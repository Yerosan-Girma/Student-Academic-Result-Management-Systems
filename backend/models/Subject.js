const pool = require('../config/db');

async function list() {
  const [rows] = await pool.execute(
    `SELECT
        s.subject_id,
        s.subject_name,
        s.total_mark,
        s.department_id,
        d.department_name,
        s.teacher_id,
        t.teacher_name
     FROM subjects s
     LEFT JOIN departments d ON d.department_id = s.department_id
     LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
     ORDER BY s.subject_id DESC`
  );
  return rows;
}

async function getById(subjectId) {
  const [rows] = await pool.execute(
    `SELECT subject_id, subject_name, total_mark, department_id, teacher_id
     FROM subjects
     WHERE subject_id = ?`,
    [subjectId]
  );
  return rows[0] ?? null;
}

async function create(subject) {
  const [result] = await pool.execute(
    `INSERT INTO subjects (subject_name, department_id, teacher_id, total_mark)
     VALUES (?, ?, ?, ?)`,
    [
      subject.subject_name,
      subject.department_id ?? null,
      subject.teacher_id ?? null,
      subject.total_mark ?? 100
    ]
  );
  return result.insertId;
}

async function update(subjectId, subject) {
  const [result] = await pool.execute(
    `UPDATE subjects
     SET subject_name = ?, department_id = ?, teacher_id = ?, total_mark = ?
     WHERE subject_id = ?`,
    [
      subject.subject_name,
      subject.department_id ?? null,
      subject.teacher_id ?? null,
      subject.total_mark ?? 100,
      subjectId
    ]
  );
  return result.affectedRows;
}

async function remove(subjectId) {
  const [result] = await pool.execute(`DELETE FROM subjects WHERE subject_id = ?`, [
    subjectId
  ]);
  return result.affectedRows;
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove
};
