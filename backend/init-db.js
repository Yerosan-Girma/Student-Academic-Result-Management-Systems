const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');
const { runSqlScript } = require('./utils/mysqlScriptRunner');

async function initDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    console.log('Running create_tables.sql...');
    await runSqlScript(conn, path.join(__dirname, 'sql', 'create_tables.sql'));
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

initDatabase();
