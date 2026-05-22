const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { runSqlScript } = require('./utils/mysqlScriptRunner');

const DEFAULT_DB_NAME = 'student_academic_management_v2';
const CORE_TABLES = [
  'admins',
  'departments',
  'classes',
  'students',
  'teachers',
  'subjects',
  'marks',
  'audit_log'
];

function quoteIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

async function databaseExists(conn, dbName) {
  const [rows] = await conn.query(
    `SELECT SCHEMA_NAME
     FROM information_schema.SCHEMATA
     WHERE SCHEMA_NAME = ?`,
    [dbName]
  );
  return rows.length > 0;
}

async function getExistingCoreTables(conn, dbName) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE = 'BASE TABLE'
       AND TABLE_NAME IN (${CORE_TABLES.map(() => '?').join(', ')})`,
    [dbName, ...CORE_TABLES]
  );
  return rows.map((row) => row.TABLE_NAME);
}

async function findBrokenCoreTables(conn, dbName) {
  if (!(await databaseExists(conn, dbName))) return [];

  const existingTables = await getExistingCoreTables(conn, dbName);
  const brokenTables = [];

  for (const tableName of existingTables) {
    try {
      const [rows] = await conn.query(
        `CHECK TABLE ${quoteIdentifier(dbName)}.${quoteIdentifier(tableName)}`
      );
      const hasEngineError = rows.some(
        (row) =>
          row.Msg_type === 'Error' &&
          /doesn'?t exist in engine/i.test(String(row.Msg_text || ''))
      );

      if (hasEngineError) {
        brokenTables.push(tableName);
      }
    } catch (err) {
      if (/doesn'?t exist in engine/i.test(String(err?.sqlMessage || err?.message || ''))) {
        brokenTables.push(tableName);
      } else {
        throw err;
      }
    }
  }

  return brokenTables;
}

async function dropDatabase(conn, dbName) {
  try {
    await conn.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
  } catch (err) {
    if (!/Directory not empty|can't rmdir/i.test(String(err?.sqlMessage || err?.message || ''))) {
      throw err;
    }

    console.log('Database directory was not empty; dropping schema objects individually.');
    await dropSchemaObjects(conn, dbName);
    const removedFiles = await removeKnownOrphanTableFiles(conn, dbName);
    if (removedFiles.length > 0) {
      console.log(`Removed orphan table files: ${removedFiles.join(', ')}.`);
    }
    await conn.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
  }
}

async function dropSchemaObjects(conn, dbName) {
  if (!(await databaseExists(conn, dbName))) return;

  const [views] = await conn.query(
    `SELECT TABLE_NAME
     FROM information_schema.VIEWS
     WHERE TABLE_SCHEMA = ?`,
    [dbName]
  );

  for (const view of views) {
    await conn.query(
      `DROP VIEW IF EXISTS ${quoteIdentifier(dbName)}.${quoteIdentifier(view.TABLE_NAME)}`
    );
  }

  const [triggers] = await conn.query(
    `SELECT TRIGGER_NAME
     FROM information_schema.TRIGGERS
     WHERE TRIGGER_SCHEMA = ?`,
    [dbName]
  );

  for (const trigger of triggers) {
    await conn.query(
      `DROP TRIGGER IF EXISTS ${quoteIdentifier(dbName)}.${quoteIdentifier(trigger.TRIGGER_NAME)}`
    );
  }

  const [routines] = await conn.query(
    `SELECT ROUTINE_NAME, ROUTINE_TYPE
     FROM information_schema.ROUTINES
     WHERE ROUTINE_SCHEMA = ?`,
    [dbName]
  );

  for (const routine of routines) {
    const type = routine.ROUTINE_TYPE === 'FUNCTION' ? 'FUNCTION' : 'PROCEDURE';
    await conn.query(
      `DROP ${type} IF EXISTS ${quoteIdentifier(dbName)}.${quoteIdentifier(routine.ROUTINE_NAME)}`
    );
  }

  const [tables] = await conn.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME DESC`,
    [dbName]
  );

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const table of tables) {
      await conn.query(
        `DROP TABLE IF EXISTS ${quoteIdentifier(dbName)}.${quoteIdentifier(table.TABLE_NAME)}`
      );
    }
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function getDatabaseDirectory(conn, dbName) {
  const [rows] = await conn.query('SELECT @@datadir AS datadir');
  const rawDataDir = rows?.[0]?.datadir || '';
  const dataDir = path.resolve(rawDataDir);
  const dbDir = path.resolve(dataDir, dbName);
  const dataDirPrefix = dataDir.endsWith(path.sep) ? dataDir : `${dataDir}${path.sep}`;

  if (!rawDataDir || path.basename(dbDir) !== dbName || !dbDir.startsWith(dataDirPrefix)) {
    throw new Error(`Refusing to inspect unexpected database directory: ${dbDir}`);
  }

  return dbDir;
}

async function removeKnownOrphanTableFiles(conn, dbName) {
  if (!(await databaseExists(conn, dbName))) return [];

  const dbDir = await getDatabaseDirectory(conn, dbName);
  if (!fs.existsSync(dbDir)) return [];

  const existingTables = new Set(await getExistingCoreTables(conn, dbName));
  const removedFiles = [];

  for (const tableName of CORE_TABLES) {
    if (existingTables.has(tableName)) continue;

    const filePath = path.resolve(dbDir, `${tableName}.ibd`);
    if (path.dirname(filePath) !== dbDir || !fs.existsSync(filePath)) continue;

    fs.unlinkSync(filePath);
    removedFiles.push(path.basename(filePath));
  }

  return removedFiles;
}

async function ensureDefaultAdmin(conn, dbName) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS count
     FROM ${quoteIdentifier(dbName)}.${quoteIdentifier('admins')}`
  );

  if (Number(rows?.[0]?.count || 0) > 0) return;

  const passwordHash = await bcrypt.hash('admin123', 10);
  await conn.query(
    `INSERT INTO ${quoteIdentifier(dbName)}.${quoteIdentifier('admins')}
       (username, password_hash)
     VALUES (?, ?)`,
    ['admin', passwordHash]
  );
  console.log('Default admin account is ready: admin / admin123');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dbName = process.env.DB_NAME || DEFAULT_DB_NAME;
  const shouldReset = args.has('--reset') || args.has('--rebuild');
  const shouldRepair = args.has('--repair');
  const shouldSeed = args.has('--seed');
  const shouldLog = args.has('--verbose');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  console.log('Connected to MySQL.');

  if (shouldReset) {
    console.log(`Resetting database ${dbName} before setup.`);
    await dropDatabase(conn, dbName);
  } else if (shouldRepair) {
    const brokenTables = await findBrokenCoreTables(conn, dbName);
    if (brokenTables.length > 0) {
      console.log(
        `Repairing database ${dbName}; broken InnoDB tables: ${brokenTables.join(', ')}.`
      );
      await dropDatabase(conn, dbName);
    } else {
      const removedFiles = await removeKnownOrphanTableFiles(conn, dbName);
      if (removedFiles.length > 0) {
        console.log(`Removed orphan table files: ${removedFiles.join(', ')}.`);
        await dropDatabase(conn, dbName);
      } else {
        console.log('No broken InnoDB tables found.');
      }
    }
  }

  console.log('Running create_tables.sql...');
  await runSqlScript(conn, path.join(__dirname, 'sql', 'create_tables.sql'), {
    log: shouldLog
  });
  console.log('All tables, views, functions, procedures, and triggers are ready.');

  await ensureDefaultAdmin(conn, dbName);

  if (shouldSeed) {
    console.log('Running sample_data.sql...');
    await runSqlScript(conn, path.join(__dirname, 'sql', 'sample_data.sql'), {
      log: shouldLog
    });
    console.log('Sample data is ready.');
  }

  await conn.end();
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
