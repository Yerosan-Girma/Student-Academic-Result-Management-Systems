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

  // Use functions to calculate total, average, and status for each student
  const [rows] = await pool.execute(
    `SELECT
        s.student_id,
        s.student_name,
        s.gender,
        COALESCE(c.class_name, TRIM(s.grade)) AS grade,
        s.academic_year,
        s.semester,
        c.class_id,
        fn_calculate_total(s.student_id) AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id) AS status
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
        c.class_id,
        fn_calculate_total(s.student_id) AS total_marks,
        fn_calculate_average(s.student_id) AS average_mark,
        fn_get_status(s.student_id) AS status
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

  // Use stored procedure sp_add_student for validation and insertion
  const [rows] = await pool.execute(
    `CALL sp_add_student(?, ?, ?, ?, ?, ?, @student_id, @result_code, @result_message)`,
    [
      student.student_name,
      student.gender,
      schoolClass?.class_name ?? null,
      schoolClass?.class_id ?? null,
      student.academic_year,
      student.semester
    ]
  );

  // Get the OUT parameters
  const [outParams] = await pool.execute(
    `SELECT @student_id AS student_id, @result_code AS result_code, @result_message AS result_message`
  );

  const { student_id, result_code, result_message } = outParams[0];

  if (result_code !== 0) {
    const error = new Error(result_message);
    error.code = 'VALIDATION_ERROR';
    error.result_code = result_code;
    throw error;
  }

  return student_id;
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

// Get student summary using view (includes rank, total, average, status)
async function getSummary(studentId = null) {
  if (studentId) {
    const [rows] = await pool.execute(
      `SELECT student_id, student_name, total_subjects, total_marks, 
              average_mark, \`rank\`, status
       FROM vw_student_summary
       WHERE student_id = ?`,
      [studentId]
    );
    return rows[0] ?? null;
  }

  // Get all students ranked
  const [rows] = await pool.execute(
    `SELECT student_id, student_name, total_subjects, total_marks, 
            average_mark, \`rank\`, status
     FROM vw_student_summary
     ORDER BY \`rank\` ASC`
  );
  return rows;
}

// Get student marks using view
async function getMarksDetail(studentId) {
  const [rows] = await pool.execute(
    `SELECT student_name, subject_name, mark, total_mark, percentage
     FROM vw_student_subject_marks
     WHERE student_id = ?
     ORDER BY subject_name ASC`,
    [studentId]
  );
  return rows;
}

// Get comprehensive student report using stored procedure
async function getReport(studentId) {
  const [rows] = await pool.execute(`CALL sp_get_student_report(?)`, [studentId]);
  return rows[0]?.[0] ?? null;
}

module.exports = {
  list,
  getById,
  getByIds,
  create,
  update,
  remove,
  getSummary,
  getMarksDetail,
  getReport
};
