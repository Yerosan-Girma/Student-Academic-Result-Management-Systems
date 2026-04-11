const SchoolClass = require('../models/Class');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

async function getAllClasses(req, res, next) {
  try {
    await SchoolClass.syncLegacyReferences();
    const classes = await SchoolClass.list();
    return res.json(classes);
  } catch (err) {
    return next(err);
  }
}

async function getClassById(req, res, next) {
  try {
    const classId = parsePositiveInt(req.params.id);
    if (!classId) return res.status(400).json({ error: 'Invalid class id' });

    const schoolClass = await SchoolClass.getById(classId);
    if (!schoolClass) return res.status(404).json({ error: 'Class not found' });

    return res.json(schoolClass);
  } catch (err) {
    return next(err);
  }
}

async function createClass(req, res, next) {
  try {
    const { class_name, description } = req.body ?? {};
    if (!isNonEmptyString(class_name)) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const classId = await SchoolClass.create({
      class_name: class_name.trim(),
      description
    });
    const schoolClass = await SchoolClass.getById(classId);
    return res.status(201).json(schoolClass);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Class already exists' });
    }
    return next(err);
  }
}

async function updateClass(req, res, next) {
  try {
    const classId = parsePositiveInt(req.params.id);
    if (!classId) return res.status(400).json({ error: 'Invalid class id' });

    const { class_name, description } = req.body ?? {};
    if (!isNonEmptyString(class_name)) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const affected = await SchoolClass.update(classId, {
      class_name: class_name.trim(),
      description
    });
    if (!affected) return res.status(404).json({ error: 'Class not found' });

    const schoolClass = await SchoolClass.getById(classId);
    return res.json(schoolClass);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Class already exists' });
    }
    return next(err);
  }
}

async function deleteClass(req, res, next) {
  try {
    const classId = parsePositiveInt(req.params.id);
    if (!classId) return res.status(400).json({ error: 'Invalid class id' });

    const schoolClass = await SchoolClass.getById(classId);
    if (!schoolClass) return res.status(404).json({ error: 'Class not found' });

    const usage = await SchoolClass.getUsageSummary({
      class_id: schoolClass.class_id,
      class_name: schoolClass.class_name
    });
    if (Number(usage.student_count) > 0 || Number(usage.teacher_count) > 0) {
      return res.status(409).json({
        error:
          `Class is in use by ${usage.student_count} student(s) ` +
          `and ${usage.teacher_count} teacher assignment(s)`
      });
    }

    const affected = await SchoolClass.remove(classId);
    if (!affected) return res.status(404).json({ error: 'Class not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
