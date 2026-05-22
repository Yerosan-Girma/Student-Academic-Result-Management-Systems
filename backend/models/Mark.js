const pool = require('../config/db');

async function list({ student_id = null, subject_id = null, teacher_id = null } = {}) {
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
  if (teacher_id) {
    where.push('m.teacher_id = ?');
    params.push(teacher_id);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT
        m.mark_id,
        m.student_id,
        s.student_name,
        m.subject_id,
        sub.subject_name,
        m.teacher_id,
        m.mark,
        sub.total_mark,
        ROUND((m.mark / sub.total_mark) * 100, 2) AS percentage
     FROM marks m
     JOIN students s ON s.student_id = m.student_id
     JOIN subjects sub ON sub.subject_id = m.subject_id
     ${whereSql}
     ORDER BY s.student_name ASC, sub.subject_name ASC`,
    params
  );

  return rows;
}

async function setMarkTeacher(executor, { student_id, subject_id, teacher_id }) {
  if (!teacher_id) return;

  await executor.execute(
    `UPDATE marks
     SET teacher_id = ?
     WHERE student_id = ? AND subject_id = ?`,
    [teacher_id, student_id, subject_id]
  );
}

async function upsert({ student_id, subject_id, teacher_id = null, mark }) {
  // Check if mark exists
  const [existing] = await pool.execute(
    `SELECT mark_id FROM marks WHERE student_id = ? AND subject_id = ?`,
    [student_id, subject_id]
  );

  if (existing.length > 0) {
    // Use stored procedure for update with validation
    await pool.execute(
      `CALL sp_update_mark(?, ?, ?, @result_code, @result_message)`,
      [student_id, subject_id, mark]
    );

    const [outParams] = await pool.execute(
      `SELECT @result_code AS result_code, @result_message AS result_message`
    );

    const { result_code, result_message } = outParams[0];

    if (result_code !== 0) {
      const error = new Error(result_message);
      error.code = 'VALIDATION_ERROR';
      error.result_code = result_code;
      throw error;
    }
  } else {
    // Use stored procedure for insert with validation
    await pool.execute(
      `CALL sp_insert_mark(?, ?, ?, @result_code, @result_message)`,
      [student_id, subject_id, mark]
    );

    const [outParams] = await pool.execute(
      `SELECT @result_code AS result_code, @result_message AS result_message`
    );

    const { result_code, result_message } = outParams[0];

    if (result_code !== 0) {
      const error = new Error(result_message);
      error.code = 'VALIDATION_ERROR';
      error.result_code = result_code;
      throw error;
    }
  }

  await setMarkTeacher(pool, { student_id, subject_id, teacher_id });

  const [rows] = await pool.execute(
    `SELECT mark_id, student_id, subject_id, teacher_id, mark
     FROM marks
     WHERE student_id = ? AND subject_id = ?`,
    [student_id, subject_id]
  );

  return rows[0] ?? null;
}

async function bulkUpsert({ student_id, marks, teacher_id = null }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of marks) {
      // Check if mark exists
      const [existing] = await conn.execute(
        `SELECT mark_id FROM marks WHERE student_id = ? AND subject_id = ?`,
        [student_id, item.subject_id]
      );

      if (existing.length > 0) {
        // Use stored procedure for update
        await conn.execute(
          `CALL sp_update_mark(?, ?, ?, @result_code, @result_message)`,
          [student_id, item.subject_id, item.mark]
        );

        const [outParams] = await conn.execute(
          `SELECT @result_code AS result_code, @result_message AS result_message`
        );

        if (outParams[0].result_code !== 0) {
          throw new Error(outParams[0].result_message);
        }
      } else {
        // Use stored procedure for insert
        await conn.execute(
          `CALL sp_insert_mark(?, ?, ?, @result_code, @result_message)`,
          [student_id, item.subject_id, item.mark]
        );

        const [outParams] = await conn.execute(
          `SELECT @result_code AS result_code, @result_message AS result_message`
        );

        if (outParams[0].result_code !== 0) {
          throw new Error(outParams[0].result_message);
        }
      }

      await setMarkTeacher(conn, {
        student_id,
        subject_id: item.subject_id,
        teacher_id
      });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await pool.execute(
    `SELECT mark_id, student_id, subject_id, teacher_id, mark
     FROM marks
     WHERE student_id = ?`,
    [student_id]
  );
  return rows;
}

async function bulkUpsertBySubject({ subject_id, teacher_id = null, marks }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of marks) {
      // Check if mark exists
      const [existing] = await conn.execute(
        `SELECT mark_id FROM marks WHERE student_id = ? AND subject_id = ?`,
        [item.student_id, subject_id]
      );

      if (existing.length > 0) {
        // Use stored procedure for update
        await conn.execute(
          `CALL sp_update_mark(?, ?, ?, @result_code, @result_message)`,
          [item.student_id, subject_id, item.mark]
        );

        const [outParams] = await conn.execute(
          `SELECT @result_code AS result_code, @result_message AS result_message`
        );

        if (outParams[0].result_code !== 0) {
          throw new Error(outParams[0].result_message);
        }
      } else {
        // Use stored procedure for insert
        await conn.execute(
          `CALL sp_insert_mark(?, ?, ?, @result_code, @result_message)`,
          [item.student_id, subject_id, item.mark]
        );

        const [outParams] = await conn.execute(
          `SELECT @result_code AS result_code, @result_message AS result_message`
        );

        if (outParams[0].result_code !== 0) {
          throw new Error(outParams[0].result_message);
        }
      }

      await setMarkTeacher(conn, {
        student_id: item.student_id,
        subject_id,
        teacher_id
      });
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await pool.execute(
    `SELECT mark_id, student_id, subject_id, teacher_id, mark
     FROM marks
     WHERE subject_id = ?`,
    [subject_id]
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
  bulkUpsertBySubject,
  update,
  remove
};
