const pool = require('../config/db');

async function list() {
  const [rows] = await pool.execute(
    `SELECT department_id, department_name
     FROM departments
     ORDER BY department_name ASC`
  );
  return rows;
}

async function create({ department_name }) {
  const [result] = await pool.execute(
    `INSERT INTO departments (department_name)
     VALUES (?)`,
    [department_name]
  );
  return result.insertId;
}

module.exports = {
  list,
  create
};
