const Subject = require('../models/Subject');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNullablePositiveInt(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

async function getAllSubjects(req, res, next) {
  try {
    const subjects = await Subject.list();
    return res.json(subjects);
  } catch (err) {
    return next(err);
  }
}

async function createSubject(req, res, next) {
  try {
    const { subject_name, department_id, teacher_id, total_mark } = req.body ?? {};

    if (!isNonEmptyString(subject_name)) {
      return res.status(400).json({ error: 'Subject_Name is required' });
    }

    const deptId = parseNullablePositiveInt(department_id);
    const teacherId = parseNullablePositiveInt(teacher_id);

    const markNum = total_mark === undefined || total_mark === '' ? 100 : Number(total_mark);
    if (!Number.isFinite(markNum) || markNum <= 0) {
      return res.status(400).json({ error: 'Total mark must be a positive number' });
    }

    const subjectId = await Subject.create({
      subject_name: subject_name.trim(),
      department_id: deptId,
      teacher_id: teacherId,
      total_mark: Math.trunc(markNum)
    });

    const subject = await Subject.getById(subjectId);
    return res.status(201).json(subject);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject name already exists' });
    }
    return next(err);
  }
}

async function updateSubject(req, res, next) {
  try {
    const subjectId = parsePositiveInt(req.params.id);
    if (!subjectId) return res.status(400).json({ error: 'Invalid subject id' });

    const { subject_name, department_id, teacher_id, total_mark } = req.body ?? {};

    if (!isNonEmptyString(subject_name)) {
      return res.status(400).json({ error: 'Subject_Name is required' });
    }

    const deptId = parseNullablePositiveInt(department_id);
    const teacherId = parseNullablePositiveInt(teacher_id);

    const markNum = total_mark === undefined || total_mark === '' ? 100 : Number(total_mark);
    if (!Number.isFinite(markNum) || markNum <= 0) {
      return res.status(400).json({ error: 'Total mark must be a positive number' });
    }

    const affected = await Subject.update(subjectId, {
      subject_name: subject_name.trim(),
      department_id: deptId,
      teacher_id: teacherId,
      total_mark: Math.trunc(markNum)
    });

    if (!affected) return res.status(404).json({ error: 'Subject not found' });
    const subject = await Subject.getById(subjectId);
    return res.json(subject);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject name already exists' });
    }
    return next(err);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const subjectId = parsePositiveInt(req.params.id);
    if (!subjectId) return res.status(400).json({ error: 'Invalid subject id' });

    const affected = await Subject.remove(subjectId);
    if (!affected) return res.status(404).json({ error: 'Subject not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject
};
