const pool = require('../config/db');
const SchoolClass = require('./Class');

async function resolveAssignedClassRecord({
  assigned_class_id = null,
  assigned_class = null
} = {}) {
  if (assigned_class_id) {
    const schoolClass = await SchoolClass.getById(assigned_class_id);
    if (schoolClass) return schoolClass;
  }

  const normalizedAssignedClass =
    typeof assigned_class === 'string' ? assigned_class.trim() : '';
  if (!normalizedAssignedClass) return null;

  return SchoolClass.ensureByName(normalizedAssignedClass);
}

async function list() {
  // Use view for teacher workload data
  const [rows] = await pool.execute(
    `SELECT
        t.teacher_id,
        t.teacher_name,
        t.department_id,
        d.department_name,
        COALESCE(c.class_name, t.assigned_class) AS assigned_class,
        COALESCE(t.assigned_class_id, c.class_id) AS assigned_class_id,
        t.role,
        t.username,
        tsa.students_graded,
        tsa.average_mark_given
     FROM teachers t
     LEFT JOIN departments d ON d.department_id = t.department_id
     LEFT JOIN classes c ON c.class_id = t.assigned_class_id
     LEFT JOIN vw_teacher_subject_assignment tsa ON tsa.teacher_id = t.teacher_id
     ORDER BY t.teacher_id DESC`
  );
  return rows;
}

async function getById(teacherId) {
  const [rows] = await pool.execute(
    `SELECT
        t.teacher_id,
        t.teacher_name,
        t.department_id,
        COALESCE(c.class_name, t.assigned_class) AS assigned_class,
        COALESCE(t.assigned_class_id, c.class_id) AS assigned_class_id,
        t.role,
        t.username
     FROM teachers t
     LEFT JOIN classes c ON c.class_id = t.assigned_class_id
     WHERE t.teacher_id = ?`,
    [teacherId]
  );
  return rows[0] ?? null;
}

async function findByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT
        t.teacher_id,
        t.teacher_name,
        t.department_id,
        COALESCE(c.class_name, t.assigned_class) AS assigned_class,
        COALESCE(t.assigned_class_id, c.class_id) AS assigned_class_id,
        t.role,
        t.username,
        t.password_hash
     FROM teachers t
     LEFT JOIN classes c ON c.class_id = t.assigned_class_id
     WHERE t.username = ?`,
    [username]
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
       AND TRIM(assigned_class) = ?`;

  if (teacher_id) {
    sql += ' AND teacher_id <> ?';
    params.push(teacher_id);
  }

  const [rows] = await pool.execute(sql, params);
  return rows[0] ?? null;
}

async function create(teacher) {
  const schoolClass = await resolveAssignedClassRecord({
    assigned_class_id: teacher.assigned_class_id ?? null,
    assigned_class: teacher.assigned_class ?? null
  });

  const [result] = await pool.execute(
    `INSERT INTO teachers (
       teacher_name,
       department_id,
       assigned_class,
       assigned_class_id,
       role,
       username,
       password_hash
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      teacher.teacher_name,
      teacher.department_id ?? null,
      schoolClass?.class_name ?? null,
      schoolClass?.class_id ?? null,
      teacher.role,
      teacher.username ?? null,
      teacher.password_hash ?? null
    ]
  );
  return result.insertId;
}

async function update(teacherId, teacher) {
  const schoolClass = await resolveAssignedClassRecord({
    assigned_class_id: teacher.assigned_class_id ?? null,
    assigned_class: teacher.assigned_class ?? null
  });

  const [result] = await pool.execute(
    `UPDATE teachers
     SET teacher_name = ?, department_id = ?, assigned_class = ?, assigned_class_id = ?, role = ?, username = ?,
         password_hash = COALESCE(?, password_hash)
     WHERE teacher_id = ?`,
    [
      teacher.teacher_name,
      teacher.department_id ?? null,
      schoolClass?.class_name ?? null,
      schoolClass?.class_id ?? null,
      teacher.role,
      teacher.username ?? null,
      teacher.password_hash ?? null,
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
  findByUsername,
  findHomeroomConflict,
  create,
  update,
  remove
};
