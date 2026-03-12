const pool = require('../config/db');

async function list() {
  const [rows] = await pool.execute(
    `SELECT
        t.teacher_id,
        t.teacher_name,
        t.department_id,
        d.department_name,
        t.assigned_class,
        t.role
     FROM teachers t
     LEFT JOIN departments d ON d.department_id = t.department_id
     ORDER BY t.teacher_id DESC`
  );
  return rows;
}

async function getById(teacherId) {
  const [rows] = await pool.execute(
    `SELECT teacher_id, teacher_name, department_id, assigned_class, role
     FROM teachers
     WHERE teacher_id = ?`,
    [teacherId]
  );
  return rows[0] ?? null;
}

async function findHomeroomConflict({ assigned_class, teacher_id = null }) {
  if (!assigned_class) return null;

  const params = [assigned_class];
  let sql =
    `SELECT teacher_id, teacher_name, assigned_class
     FROM teachers
     WHERE role = 'Homeroom Teacher'
       AND assigned_class = ?`;

  if (teacher_id) {
    sql += ' AND teacher_id <> ?';
    params.push(teacher_id);
  }

  const [rows] = await pool.execute(sql, params);
  return rows[0] ?? null;
}

async function create(teacher) {
  const [result] = await pool.execute(
    `INSERT INTO teachers (teacher_name, department_id, assigned_class, role)
     VALUES (?, ?, ?, ?)`,
    [
      teacher.teacher_name,
      teacher.department_id ?? null,
      teacher.assigned_class ?? null,
      teacher.role
    ]
  );
  return result.insertId;
}

async function update(teacherId, teacher) {
  const [result] = await pool.execute(
    `UPDATE teachers
     SET teacher_name = ?, department_id = ?, assigned_class = ?, role = ?
     WHERE teacher_id = ?`,
    [
      teacher.teacher_name,
      teacher.department_id ?? null,
      teacher.assigned_class ?? null,
      teacher.role,
      teacherId
    ]
  );
  return result.affectedRows;
}

async function remove(teacherId) {
  const [result] = await pool.execute(`DELETE FROM teachers WHERE teacher_id = ?`, [
    teacherId
  ]);
  return result.affectedRows;
}

module.exports = {
  list,
  getById,
  findHomeroomConflict,
  create,
  update,
  remove
};
