const Mark = require('../models/Mark');

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function parseNullablePositiveInt(value) {
  if (value === null || value === undefined || value === '') return null;
  return parsePositiveInt(value);
}

function parseMark(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const intValue = Math.trunc(num);
  if (intValue < 0 || intValue > 100) return null;
  return intValue;
}

async function getAllMarks(req, res, next) {
  try {
    const studentId = parseNullablePositiveInt(req.query.student_id);
    const subjectId = parseNullablePositiveInt(req.query.subject_id);

    const marks = await Mark.list({ student_id: studentId, subject_id: subjectId });
    return res.json(marks);
  } catch (err) {
    return next(err);
  }
}

async function upsertMark(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.body?.student_id);
    const subjectId = parsePositiveInt(req.body?.subject_id);
    const markValue = parseMark(req.body?.mark);

    if (!studentId) return res.status(400).json({ error: 'Valid Student_ID is required' });
    if (!subjectId) return res.status(400).json({ error: 'Valid Subject_ID is required' });
    if (markValue === null) {
      return res.status(400).json({ error: 'Mark must be an integer between 0 and 100' });
    }

    const saved = await Mark.upsert({
      student_id: studentId,
      subject_id: subjectId,
      mark: markValue
    });

    return res.status(201).json(saved);
  } catch (err) {
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Student or Subject does not exist' });
    }
    if (err?.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      return res.status(400).json({ error: 'Mark must be between 0 and 100' });
    }
    return next(err);
  }
}

async function bulkUpsertMarks(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.body?.student_id);
    const marks = Array.isArray(req.body?.marks) ? req.body.marks : null;

    if (!studentId) return res.status(400).json({ error: 'Valid Student_ID is required' });
    if (!marks || marks.length === 0) {
      return res.status(400).json({ error: 'marks[] is required' });
    }

    const normalized = [];
    for (const item of marks) {
      const subjectId = parsePositiveInt(item?.subject_id);
      const markValue = parseMark(item?.mark);

      if (!subjectId) {
        return res.status(400).json({ error: 'Each mark must include a valid Subject_ID' });
      }
      if (markValue === null) {
        return res
          .status(400)
          .json({ error: 'Each mark must be an integer between 0 and 100' });
      }

      normalized.push({ subject_id: subjectId, mark: markValue });
    }

    const saved = await Mark.bulkUpsert({ student_id: studentId, marks: normalized });
    return res.status(200).json(saved);
  } catch (err) {
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Student or Subject does not exist' });
    }
    if (err?.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      return res.status(400).json({ error: 'Mark must be between 0 and 100' });
    }
    return next(err);
  }
}

async function updateMark(req, res, next) {
  try {
    const markId = parsePositiveInt(req.params.id);
    if (!markId) return res.status(400).json({ error: 'Invalid mark id' });

    const markValue = parseMark(req.body?.mark);
    if (markValue === null) {
      return res.status(400).json({ error: 'Mark must be an integer between 0 and 100' });
    }

    const affected = await Mark.update(markId, markValue);
    if (!affected) return res.status(404).json({ error: 'Mark not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function deleteMark(req, res, next) {
  try {
    const markId = parsePositiveInt(req.params.id);
    if (!markId) return res.status(400).json({ error: 'Invalid mark id' });

    const affected = await Mark.remove(markId);
    if (!affected) return res.status(404).json({ error: 'Mark not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllMarks,
  upsertMark,
  bulkUpsertMarks,
  updateMark,
  deleteMark
};
