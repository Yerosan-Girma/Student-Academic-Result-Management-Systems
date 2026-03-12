const mysql = require('mysql2/promise');

function getEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === null) {
    return fallback;
  }
  return value;
}

const pool = mysql.createPool({
  host: getEnv('DB_HOST', '127.0.0.1'),
  port: Number(getEnv('DB_PORT', '3306')),
  user: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASSWORD', ''),
  database: getEnv('DB_NAME', 'student_academic_management'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MySQL connected successfully');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
}

testConnection();

module.exports = pool;
