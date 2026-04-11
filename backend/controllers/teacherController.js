const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const SchoolClass = require('../models/Class');

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

function isAllowedRole(value) {
  return ['Homeroom Teacher', 'Subject Teacher'].includes(value);
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

async function getAllTeachers(req, res, next) {
  try {
    const teachers = await Teacher.list();
    return res.json(teachers);
  } catch (err) {
    return next(err);
  }
}

async function createTeacher(req, res, next) {
  try {
    const { teacher_name, department_id, assigned_class, assigned_class_id, role, username, password } =
      req.body ?? {};

    const normalizedUsername = normalizeUsername(username);

    if (!isNonEmptyString(teacher_name)) {
      return res.status(400).json({ error: 'Teacher_Name is required' });
    }
    if (!isNonEmptyString(normalizedUsername)) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (!isAllowedRole(role)) {
      return res
        .status(400)
        .json({ error: 'Role must be Homeroom Teacher or Subject Teacher' });
    }

    const deptId = parsePositiveInt(department_id);
    if (!deptId) {
      return res.status(400).json({ error: 'Department is required' });
    }
    const assignedClassId = parseNullablePositiveInt(assigned_class_id);
    let assignedClass = isNonEmptyString(assigned_class) ? assigned_class.trim() : null;

    if (assignedClassId) {
      const schoolClass = await SchoolClass.getById(assignedClassId);
      if (!schoolClass) {
        return res.status(400).json({ error: 'Class not found' });
      }
      assignedClass = schoolClass.class_name;
    }

    if (role === 'Homeroom Teacher' && !assignedClass) {
      return res
        .status(400)
        .json({ error: 'Assigned_Class is required for Homeroom Teacher' });
    }

    if (role === 'Homeroom Teacher' && assignedClass) {
      const conflict = await Teacher.findHomeroomConflict({ assigned_class: assignedClass });
      if (conflict) {
        return res.status(409).json({
          error: `Homeroom teacher already assigned for class "${assignedClass}"`
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const teacherId = await Teacher.create({
      teacher_name: teacher_name.trim(),
      department_id: deptId,
      assigned_class: assignedClass,
      assigned_class_id: assignedClassId,
      role,
      username: normalizedUsername,
      password_hash: passwordHash
    });

    const teacher = await Teacher.getById(teacherId);
    return res.status(201).json(teacher);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY' && `${err?.message || ''}`.includes('uq_teachers_username')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (err?.code === 'ER_DUP_ENTRY' && `${err?.message || ''}`.includes('uq_homeroom_class')) {
      return res.status(409).json({
        error: 'Homeroom teacher already assigned for this class'
      });
    }
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Department does not exist' });
    }
    return next(err);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const teacherId = parsePositiveInt(req.params.id);
    if (!teacherId) return res.status(400).json({ error: 'Invalid teacher id' });

    const { teacher_name, department_id, assigned_class, assigned_class_id, role, username, password } =
      req.body ?? {};

    const normalizedUsername = normalizeUsername(username);

    if (!isNonEmptyString(teacher_name)) {
      return res.status(400).json({ error: 'Teacher_Name is required' });
    }
    if (!isNonEmptyString(normalizedUsername)) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!isAllowedRole(role)) {
      return res
        .status(400)
        .json({ error: 'Role must be Homeroom Teacher or Subject Teacher' });
    }

    const deptId = parsePositiveInt(department_id);
    if (!deptId) {
      return res.status(400).json({ error: 'Department is required' });
    }
    const assignedClassId = parseNullablePositiveInt(assigned_class_id);
    let assignedClass = isNonEmptyString(assigned_class) ? assigned_class.trim() : null;

    if (assignedClassId) {
      const schoolClass = await SchoolClass.getById(assignedClassId);
      if (!schoolClass) {
        return res.status(400).json({ error: 'Class not found' });
      }
      assignedClass = schoolClass.class_name;
    }

    if (role === 'Homeroom Teacher' && !assignedClass) {
      return res
        .status(400)
        .json({ error: 'Assigned_Class is required for Homeroom Teacher' });
    }

    if (role === 'Homeroom Teacher' && assignedClass) {
      const conflict = await Teacher.findHomeroomConflict({
        assigned_class: assignedClass,
        teacher_id: teacherId
      });
      if (conflict) {
        return res.status(409).json({
          error: `Homeroom teacher already assigned for class "${assignedClass}"`
        });
      }
    }

    const passwordHash = isNonEmptyString(password) ? await bcrypt.hash(password, 10) : null;

    const affected = await Teacher.update(teacherId, {
      teacher_name: teacher_name.trim(),
      department_id: deptId,
      assigned_class: assignedClass,
      assigned_class_id: assignedClassId,
      role,
      username: normalizedUsername,
      password_hash: passwordHash
    });

    if (!affected) return res.status(404).json({ error: 'Teacher not found' });
    const teacher = await Teacher.getById(teacherId);
    return res.json(teacher);
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY' && `${err?.message || ''}`.includes('uq_teachers_username')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    if (err?.code === 'ER_DUP_ENTRY' && `${err?.message || ''}`.includes('uq_homeroom_class')) {
      return res.status(409).json({
        error: 'Homeroom teacher already assigned for this class'
      });
    }
    if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Department does not exist' });
    }
    return next(err);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const teacherId = parsePositiveInt(req.params.id);
    if (!teacherId) return res.status(400).json({ error: 'Invalid teacher id' });

    const affected = await Teacher.remove(teacherId);
    if (!affected) return res.status(404).json({ error: 'Teacher not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
