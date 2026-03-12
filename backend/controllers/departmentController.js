const Department = require('../models/Department');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getAllDepartments(req, res, next) {
  try {
    const departments = await Department.list();
    return res.json(departments);
  } catch (err) {
    return next(err);
  }
}

async function createDepartment(req, res, next) {
  try {
    const { department_name } = req.body ?? {};
    if (!isNonEmptyString(department_name)) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const id = await Department.create({ department_name: department_name.trim() });
    return res.status(201).json({ department_id: id, department_name: department_name.trim() });
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Department already exists' });
    }
    return next(err);
  }
}

module.exports = {
  getAllDepartments,
  createDepartment
};

