const pool = require('../config/db');
const SchoolClass = require('./Class');

async function resolveClassRecord({ class_id = null, grade = null } = {}) {
  if (class_id) {
    const schoolClass = await SchoolClass.getById(class_id);
    if (schoolClass) return schoolClass;
  }

  const normalizedGrade = typeof grade === 'string' ? grade.trim() : '';
  if (!normalizedGrade) return null;

  return SchoolClass.ensureByName(normalizedGrade);
}

async function list({ class_id = null, grade = null, academic_year = null, semester = null } = {}) {
  const where = [];
  const params = [];

  if (class_id) {
    where.push('c.class_id = ?');
    params.push(class_id);
  } else if (grade) {
    where.push('TRIM(s.grade) = ?');
    params.push(grade);
  }
  if (academic_year) {
    where.push('s.academic_year = ?');
    params.push(academic_year);
  }
  if (semester) {
    where.push('s.semester = ?');
    params.push(semester);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT
        s.student_id,
        s.student_name,
        s.gender,
        COALESCE(c.class_name, TRIM(s.grade)) AS grade,
        s.academic_year,
        s.semester,
        c.class_id
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     ${whereSql}
     ORDER BY s.student_id DESC`,
    params
  );
  return rows;
}

async function getById(studentId) {
  const [rows] = await pool.execute(
    `SELECT
        s.student_id,
        s.student_name,
        s.gender,
        COALESCE(c.class_name, TRIM(s.grade)) AS grade,
        s.academic_year,
        s.semester,
        c.class_id
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     WHERE s.student_id = ?`,
    [studentId]
  );
  return rows[0] ?? null;
}

async function getByIds(studentIds) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) return [];

  const placeholders = studentIds.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT
        s.student_id,
        s.student_name,
        s.gender,
        COALESCE(c.class_name, TRIM(s.grade)) AS grade,
        s.academic_year,
        s.semester,
        c.class_id
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     WHERE s.student_id IN (${placeholders})`,
    studentIds
  );
  return rows;
}

async function create(student) {
  const schoolClass = await resolveClassRecord({
    class_id: student.class_id ?? null,
    grade: student.grade
  });

  const [result] = await pool.execute(
    `INSERT INTO students (student_name, gender, grade, class_id, academic_year, semester)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      student.student_name,
      student.gender,
      schoolClass?.class_name ?? null,
      schoolClass?.class_id ?? null,
      student.academic_year,
      student.semester
    ]
  );
  return result.insertId;
}

async function update(studentId, student) {
  const schoolClass = await resolveClassRecord({
    class_id: student.class_id ?? null,
    grade: student.grade
  });

  const [result] = await pool.execute(
    `UPDATE students
     SET student_name = ?, gender = ?, grade = ?, class_id = ?, academic_year = ?, semester = ?
     WHERE student_id = ?`,
    [
      student.student_name,
      student.gender,
      schoolClass?.class_name ?? null,
      schoolClass?.class_id ?? null,
      student.academic_year,
      student.semester,
      studentId
    ]
  );
  return result.affectedRows;
}

async function remove(studentId) {
  const [result] = await pool.execute(`DELETE FROM students WHERE student_id = ?`, [
    studentId
  ]);
  return result.affectedRows;
}

module.exports = {
  list,
  getById,
  getByIds,
  create,
  update,
  remove
};
