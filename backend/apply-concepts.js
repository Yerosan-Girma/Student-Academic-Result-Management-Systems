const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const sqlFiles = [
  '01-indexes.sql',
  '02-views.sql',
  '03-functions.sql',
  '04-procedures.sql',
  '05-triggers.sql'
];

function parseDelimitedSQL(sql) {
  const statements = [];
  let currentStatement = '';
  let delimiter = ';';
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : '';
    const nextChars = sql.substring(i, i + 10);

    // Check for DELIMITER command
    if (nextChars.startsWith('DELIMITER ')) {
      // Flush current statement if any
      if (currentStatement.trim()) {
        statements.push({ sql: currentStatement.trim(), delimiter });
        currentStatement = '';
      }
      // Extract new delimiter
      i += 10; // Skip 'DELIMITER '
      let newDelimiter = '';
      while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') {
        newDelimiter += sql[i];
        i++;
      }
      delimiter = newDelimiter.trim();
      continue;
    }

    // Track if we're inside a string
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    currentStatement += char;

    // Check if we've reached the delimiter
    if (!inString && currentStatement.endsWith(delimiter)) {
      const stmt = currentStatement.substring(0, currentStatement.length - delimiter.length).trim();
      if (stmt) {
        statements.push({ sql: stmt, delimiter });
      }
      currentStatement = '';
    }

    i++;
  }

  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push({ sql: currentStatement.trim(), delimiter });
  }

  return statements;
}

async function executeSqlFile(connection, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, 'sql', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const statements = parseDelimitedSQL(sql);
    let executed = 0;
    let errors = [];

    const executeNext = (index) => {
      if (index >= statements.length) {
        if (errors.length > 0) {
          reject({ filename, errors, executed });
        } else {
          resolve({ filename, executed });
        }
        return;
      }

      const stmt = statements[index];
      connection.query(stmt.sql, (err, results) => {
        if (err) {
          errors.push({ statement: stmt.sql.substring(0, 50), error: err.message });
        } else {
          executed++;
        }
        executeNext(index + 1);
      });
    };

    executeNext(0);
  });
}

async function applyAdvancedConcepts() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'student_academic_management_v2'
  });

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('✗ Connection error:', err.message);
        reject(err);
        return;
      }

      console.log('✓ Connected to database\n');
      console.log('Applying 5 Advanced Database Concepts...\n');

      let completed = 0;
      let failed = 0;

      // Execute each SQL file sequentially
      const executeNext = (index) => {
        if (index >= sqlFiles.length) {
          console.log('\n' + '='.repeat(60));
          console.log('✓ EXECUTION COMPLETE');
          console.log('='.repeat(60));
          console.log(`✓ Successful: ${completed}/${sqlFiles.length}`);
          console.log(`✗ Failed: ${failed}/${sqlFiles.length}`);
          
          if (failed === 0) {
            console.log('\n✓ All 5 Advanced Database Concepts Applied Successfully!\n');
            console.log('Summary:');
            console.log('  ✓ CONCEPT 1: INDEXES - 20+ indexes on frequently queried columns');
            console.log('  ✓ CONCEPT 2: VIEWS - 7 views for consistent data access');
            console.log('  ✓ CONCEPT 3: FUNCTIONS - 8 functions for reusable calculations');
            console.log('  ✓ CONCEPT 4: STORED PROCEDURES - 4 procedures for complex business logic');
            console.log('  ✓ CONCEPT 5: TRIGGERS - 11 triggers for validation and audit logging\n');
          }
          
          connection.end();
          resolve();
          return;
        }

        const filename = sqlFiles[index];
        console.log(`[${index + 1}/${sqlFiles.length}] Executing ${filename}...`);

        executeSqlFile(connection, filename)
          .then((result) => {
            console.log(`  ✓ ${filename} completed (${result.executed} statements)\n`);
            completed++;
            executeNext(index + 1);
          })
          .catch((err) => {
            console.error(`  ✗ ${filename} failed:`);
            if (err.errors && err.errors.length > 0) {
              err.errors.forEach(e => {
                console.error(`    - ${e.error}`);
              });
            } else {
              console.error(`    Error: ${err.error || err.message}`);
            }
            console.error(`  (${err.executed || 0} statements executed before error)\n`);
            failed++;
            executeNext(index + 1);
          });
      };

      executeNext(0);
    });
  });
}

applyAdvancedConcepts()
  .then(() => {
    console.log('✓ Script completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('✗ Script failed:', err.message);
    process.exit(1);
  });
