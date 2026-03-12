const pool = require('../config/db');

async function list({ student_id = null, subject_id = null } = {}) {
  const where = [];
  const params = [];

  if (student_id) {
    where.push('m.student_id = ?');
    params.push(student_id);
  }
  if (subject_id) {
    where.push('m.subject_id = ?');
    params.push(subject_id);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT
        m.mark_id,
        m.student_id,
        st.student_name,
        m.subject_id,
        sb.subject_name,
        m.mark
     FROM marks m
     JOIN students st ON st.student_id = m.student_id
     JOIN subjects sb ON sb.subject_id = m.subject_id
     ${whereSql}
     ORDER BY m.mark_id DESC`,
    params
  );

  return rows;
}

async function upsert({ student_id, subject_id, mark }) {
  await pool.execute(
    `INSERT INTO marks (student_id, subject_id, mark)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       mark = VALUES(mark),
       updated_at = CURRENT_TIMESTAMP`,
    [student_id, subject_id, mark]
  );

  const [rows] = await pool.execute(
    `SELECT mark_id, student_id, subject_id, mark
     FROM marks
     WHERE student_id = ? AND subject_id = ?`,
    [student_id, subject_id]
  );

  return rows[0] ?? null;
}

async function bulkUpsert({ student_id, marks }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of marks) {
      await conn.execute(
        `INSERT INTO marks (student_id, subject_id, mark)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           mark = VALUES(mark),
           updated_at = CURRENT_TIMESTAMP`,
        [student_id, item.subject_id, item.mark]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await pool.execute(
    `SELECT mark_id, student_id, subject_id, mark
     FROM marks
     WHERE student_id = ?`,
    [student_id]
  );
  return rows;
}

async function update(markId, markValue) {
  const [result] = await pool.execute(
    `UPDATE marks
     SET mark = ?
     WHERE mark_id = ?`,
    [markValue, markId]
  );
  return result.affectedRows;
}

async function remove(markId) {
  const [result] = await pool.execute(`DELETE FROM marks WHERE mark_id = ?`, [markId]);
  return result.affectedRows;
}

module.exports = {
  list,
  upsert,
  bulkUpsert,
  update,
  remove
};
