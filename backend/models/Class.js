const pool = require('../config/db');

function normalizeClassName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function getCurrentDatabase() {
  const [rows] = await pool.execute(`SELECT DATABASE() AS db_name`);
  return rows?.[0]?.db_name ?? null;
}

async function columnExists(tableName, columnName) {
  const dbName = await getCurrentDatabase();
  if (!dbName) return false;

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbName, tableName, columnName]
  );
  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function tableExists(tableName) {
  const dbName = await getCurrentDatabase();
  if (!dbName) return false;

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, tableName]
  );
  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function indexExists(tableName, indexName) {
  const dbName = await getCurrentDatabase();
  if (!dbName) return false;

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [dbName, tableName, indexName]
  );
  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function foreignKeyExists(tableName, constraintName) {
  const dbName = await getCurrentDatabase();
  if (!dbName) return false;

  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ?
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [dbName, tableName, constraintName]
  );
  return Number(rows?.[0]?.cnt ?? 0) > 0;
}

async function ensureTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS classes (
        class_id INT NOT NULL AUTO_INCREMENT,
        class_name VARCHAR(50) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (class_id),
        UNIQUE KEY uq_classes_name (class_name)
      ) ENGINE=InnoDB
    `);
  } catch (err) {
    console.warn(
      'Could not ensure classes table. Have you run backend/sql/create_tables.sql?',
      err?.code ?? err?.message ?? err
    );
  }
}

async function syncFromLegacyData() {
  try {
    const [studentsExists, teachersExists] = await Promise.all([
      tableExists('students'),
      tableExists('teachers')
    ]);
    if (!studentsExists || !teachersExists) return;

    await pool.execute(`
      INSERT INTO classes (class_name)
      SELECT legacy_classes.class_name
      FROM (
        SELECT DISTINCT TRIM(grade) AS class_name
        FROM students
        WHERE grade IS NOT NULL AND TRIM(grade) <> ''
        UNION
        SELECT DISTINCT TRIM(assigned_class) AS class_name
        FROM teachers
        WHERE assigned_class IS NOT NULL AND TRIM(assigned_class) <> ''
      ) AS legacy_classes
      ON DUPLICATE KEY UPDATE
        class_name = VALUES(class_name)
    `);
  } catch (err) {
    console.warn(
      'Could not sync legacy class values into classes table.',
      err?.code ?? err?.message ?? err
    );
  }
}

async function ensureStudentClassColumn() {
  if (!(await tableExists('students'))) return;

  if (!(await columnExists('students', 'class_id'))) {
    await pool.execute(`ALTER TABLE students ADD COLUMN class_id INT NULL AFTER grade`);
  }

  if (!(await indexExists('students', 'idx_students_class'))) {
    await pool.execute(`ALTER TABLE students ADD INDEX idx_students_class (class_id)`);
  }
}

async function ensureTeacherAssignedClassColumn() {
  if (!(await tableExists('teachers'))) return;

  if (!(await columnExists('teachers', 'assigned_class_id'))) {
    await pool.execute(
      `ALTER TABLE teachers ADD COLUMN assigned_class_id INT NULL AFTER assigned_class`
    );
  }

  if (!(await indexExists('teachers', 'idx_teachers_assigned_class_id'))) {
    await pool.execute(
      `ALTER TABLE teachers ADD INDEX idx_teachers_assigned_class_id (assigned_class_id)`
    );
  }
}

async function syncStudentClassReferences() {
  try {
    if (!(await tableExists('students'))) return;
    if (!(await columnExists('students', 'class_id'))) return;

    await pool.execute(`
      UPDATE students s
      JOIN classes c ON c.class_name = TRIM(s.grade)
      SET s.class_id = c.class_id
      WHERE TRIM(s.grade) <> ''
        AND (s.class_id IS NULL OR s.class_id <> c.class_id)
    `);
  } catch (err) {
    console.warn(
      'Could not backfill students.class_id from students.grade.',
      err?.code ?? err?.message ?? err
    );
  }
}

async function syncTeacherClassReferences() {
  try {
    if (!(await tableExists('teachers'))) return;
    if (!(await columnExists('teachers', 'assigned_class_id'))) return;

    await pool.execute(`
      UPDATE teachers t
      JOIN classes c ON c.class_name = TRIM(t.assigned_class)
      SET t.assigned_class_id = c.class_id
      WHERE t.assigned_class IS NOT NULL
        AND TRIM(t.assigned_class) <> ''
        AND (t.assigned_class_id IS NULL OR t.assigned_class_id <> c.class_id)
    `);
  } catch (err) {
    console.warn(
      'Could not backfill teachers.assigned_class_id from teachers.assigned_class.',
      err?.code ?? err?.message ?? err
    );
  }
}

async function ensureStudentClassForeignKey() {
  if (!(await tableExists('students'))) return;
  if (!(await foreignKeyExists('students', 'fk_students_class'))) {
    await pool.execute(`
      ALTER TABLE students
      ADD CONSTRAINT fk_students_class
      FOREIGN KEY (class_id)
      REFERENCES classes (class_id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
    `);
  }
}

async function ensureTeacherAssignedClassForeignKey() {
  if (!(await tableExists('teachers'))) return;
  if (!(await foreignKeyExists('teachers', 'fk_teachers_assigned_class'))) {
    await pool.execute(`
      ALTER TABLE teachers
      ADD CONSTRAINT fk_teachers_assigned_class
      FOREIGN KEY (assigned_class_id)
      REFERENCES classes (class_id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT
    `);
  }
}

async function syncLegacyReferences() {
  await syncFromLegacyData();
  await syncStudentClassReferences();
  await syncTeacherClassReferences();
}

async function ensureSchema() {
  try {
    await ensureTable();
    await syncFromLegacyData();
    await ensureStudentClassColumn();
    await ensureTeacherAssignedClassColumn();
    await syncStudentClassReferences();
    await syncTeacherClassReferences();
    await ensureStudentClassForeignKey();
    await ensureTeacherAssignedClassForeignKey();
  } catch (err) {
    console.warn(
      'Could not fully ensure class schema compatibility.',
      err?.code ?? err?.message ?? err
    );
  }
}

async function list() {
  // Use view for class performance data
  const [rows] = await pool.execute(`
    SELECT
      c.class_id,
      c.class_name,
      c.description,
      cp.student_count,
      cp.mark_count,
      cp.class_average,
      cp.highest_mark,
      cp.lowest_mark,
      COALESCE(tc.teacher_count, 0) AS teacher_count,
      COALESCE(tc.homeroom_teacher_count, 0) AS homeroom_teacher_count
    FROM classes c
    LEFT JOIN vw_class_performance cp ON cp.class_id = c.class_id
    LEFT JOIN (
      SELECT
        assigned_class_id,
        COUNT(*) AS teacher_count,
        SUM(CASE WHEN role = 'Homeroom Teacher' THEN 1 ELSE 0 END) AS homeroom_teacher_count
      FROM teachers
      WHERE assigned_class_id IS NOT NULL
      GROUP BY assigned_class_id
    ) tc ON tc.assigned_class_id = c.class_id
    ORDER BY c.class_name ASC
  `);
  return rows;
}

async function getById(classId) {
  const [rows] = await pool.execute(
    `SELECT class_id, class_name, description
     FROM classes
     WHERE class_id = ?`,
    [classId]
  );
  return rows[0] ?? null;
}

async function getByName(className) {
  const normalized = normalizeClassName(className);
  if (!normalized) return null;

  const [rows] = await pool.execute(
    `SELECT class_id, class_name, description
     FROM classes
     WHERE class_name = ?`,
    [normalized]
  );
  return rows[0] ?? null;
}

async function getUsageSummary({ class_id = null, class_name = null } = {}) {
  const classId = Number(class_id);
  const normalized = normalizeClassName(class_name);

  if (!Number.isInteger(classId) || classId <= 0) {
    if (!normalized) {
      return {
        student_count: 0,
        teacher_count: 0,
        homeroom_teacher_count: 0
      };
    }

    const [rows] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM students WHERE TRIM(grade) = ?) AS student_count,
         (SELECT COUNT(*) FROM teachers WHERE TRIM(assigned_class) = ?) AS teacher_count,
         (
           SELECT COUNT(*)
           FROM teachers
           WHERE role = 'Homeroom Teacher' AND TRIM(assigned_class) = ?
         ) AS homeroom_teacher_count`,
      [normalized, normalized, normalized]
    );

    return (
      rows[0] ?? {
        student_count: 0,
        teacher_count: 0,
        homeroom_teacher_count: 0
      }
    );
  }

  const [rows] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM students WHERE class_id = ?) AS student_count,
       (SELECT COUNT(*) FROM teachers WHERE assigned_class_id = ?) AS teacher_count,
       (
         SELECT COUNT(*)
         FROM teachers
         WHERE role = 'Homeroom Teacher' AND assigned_class_id = ?
       ) AS homeroom_teacher_count`,
    [classId, classId, classId]
  );

  return (
    rows[0] ?? {
      student_count: 0,
      teacher_count: 0,
      homeroom_teacher_count: 0
    }
  );
}

async function create({ class_name, description = null }) {
  const normalized = normalizeClassName(class_name);
  const normalizedDescription =
    typeof description === 'string' && description.trim().length > 0
      ? description.trim()
      : null;

  const [result] = await pool.execute(
    `INSERT INTO classes (class_name, description)
     VALUES (?, ?)`,
    [normalized, normalizedDescription]
  );

  return result.insertId;
}

async function ensureByName(className, { description = null } = {}) {
  const normalized = normalizeClassName(className);
  if (!normalized) return null;

  const existing = await getByName(normalized);
  if (existing) return existing;

  try {
    const classId = await create({ class_name: normalized, description });
    return await getById(classId);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return getByName(normalized);
    }
    throw err;
  }
}

async function resolveFromInput({ class_id = null, class_name = null } = {}) {
  if (class_id) {
    return getById(class_id);
  }

  return ensureByName(class_name);
}

async function update(classId, { class_name, description = null }) {
  const normalized = normalizeClassName(class_name);
  const normalizedDescription =
    typeof description === 'string' && description.trim().length > 0
      ? description.trim()
      : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [currentRows] = await conn.execute(
      `SELECT class_id, class_name
       FROM classes
       WHERE class_id = ?
       FOR UPDATE`,
      [classId]
    );
    const current = currentRows[0] ?? null;
    if (!current) {
      await conn.rollback();
      return 0;
    }

    await conn.execute(
      `UPDATE classes
       SET class_name = ?, description = ?
       WHERE class_id = ?`,
      [normalized, normalizedDescription, classId]
    );

    if (current.class_name !== normalized) {
      await conn.execute(
        `UPDATE students
         SET grade = ?
         WHERE class_id = ? OR TRIM(grade) = ?`,
        [normalized, classId, current.class_name]
      );

      await conn.execute(
        `UPDATE teachers
         SET assigned_class = ?
         WHERE assigned_class_id = ? OR TRIM(assigned_class) = ?`,
        [normalized, classId, current.class_name]
      );
    }

    await conn.commit();
    return 1;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function remove(classId) {
  const [result] = await pool.execute(`DELETE FROM classes WHERE class_id = ?`, [classId]);
  return result.affectedRows;
}

module.exports = {
  ensureSchema,
  syncFromLegacyData,
  syncLegacyReferences,
  list,
  getById,
  getByName,
  getUsageSummary,
  create,
  ensureByName,
  resolveFromInput,
  update,
  remove
};
