/**
 * setup_db.js – Run once to create all tables.
 * Usage:  node backend/setup_db.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true   // needed to run the whole SQL file at once
  });

  console.log('Connected to MySQL.');

  const sqlFile = path.join(__dirname, 'sql', 'create_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Running create_tables.sql …');
  await conn.query(sql);
  console.log('✅  All tables created (or already existed).');

  await conn.end();
}

main().catch((err) => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
