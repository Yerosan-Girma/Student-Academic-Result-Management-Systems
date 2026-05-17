const Department = require('../models/Department');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
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

async function updateDepartment(req, res, next) {
  try {
    const departmentId = parsePositiveInt(req.params.id);
    if (!departmentId) return res.status(400).json({ error: 'Invalid department id' });

    const { department_name } = req.body ?? {};
    if (!isNonEmptyString(department_name)) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const affected = await Department.update(departmentId, {
      department_name: department_name.trim()
    });

    if (!affected) return res.status(404).json({ error: 'Department not found' });

    const department = await Department.getById(departmentId);
    return res.json(department);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Department already exists' });
    }
    return next(err);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    const departmentId = parsePositiveInt(req.params.id);
    if (!departmentId) return res.status(400).json({ error: 'Invalid department id' });

    const affected = await Department.remove(departmentId);
    if (!affected) return res.status(404).json({ error: 'Department not found' });

    return res.status(204).send();
  } catch (err) {
    if (err?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        error: 'Department is in use by teachers or subjects and cannot be deleted'
      });
    }
    return next(err);
  }
}

// NEW: Get department performance using view
async function getDepartmentPerformance(req, res, next) {
  try {
    const departmentId = parsePositiveInt(req.params.id);
    
    if (departmentId) {
      const pool = require('../config/db');
      const [rows] = await pool.execute(
        `SELECT department_id, department_name, teacher_count, subject_count,
                student_count, total_marks_recorded, department_average,
                highest_mark, lowest_mark
         FROM vw_department_performance
         WHERE department_id = ?`,
        [departmentId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      return res.json(rows[0]);
    }
    
    // Get all departments performance
    const departments = await Department.list();
    return res.json(departments);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentPerformance
};
