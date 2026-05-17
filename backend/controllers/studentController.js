const Student = require('../models/Student');
const SchoolClass = require('../models/Class');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAllowedGender(value) {
  return ['Male', 'Female', 'Other'].includes(value);
}

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function parseNullablePositiveInt(value) {
  if (value === null || value === undefined || value === '') return null;
  return parsePositiveInt(value);
}

async function getAllStudents(req, res, next) {
  try {
    const classId = parseNullablePositiveInt(req.query?.class_id);
    if (req.query?.class_id !== undefined && req.query?.class_id !== '' && !classId) {
      return res.status(400).json({ error: 'Invalid class id' });
    }

    const grade = isNonEmptyString(req.query?.grade) ? req.query.grade.trim() : null;
    const academicYear = isNonEmptyString(req.query?.academic_year)
      ? req.query.academic_year.trim()
      : null;
    const semester = isNonEmptyString(req.query?.semester) ? req.query.semester.trim() : null;

    const students = await Student.list({
      class_id: classId,
      grade,
      academic_year: academicYear,
      semester
    });
    return res.json(students);
  } catch (err) {
    return next(err);
  }
}

async function getStudentById(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const student = await Student.getById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    return res.json(student);
  } catch (err) {
    return next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const { student_name, gender, grade, academic_year, semester, class_id } = req.body ?? {};
    if (!isNonEmptyString(student_name)) {
      return res.status(400).json({ error: 'Student_Name is required' });
    }
    if (!isAllowedGender(gender)) {
      return res.status(400).json({ error: 'Gender must be Male, Female, or Other' });
    }

    const classId = parseNullablePositiveInt(class_id);
    let className = isNonEmptyString(grade) ? grade.trim() : null;

    if (classId) {
      const schoolClass = await SchoolClass.getById(classId);
      if (!schoolClass) {
        return res.status(400).json({ error: 'Class not found' });
      }
      className = schoolClass.class_name;
    }

    if (!isNonEmptyString(className)) {
      return res.status(400).json({ error: 'Class is required' });
    }
    if (!isNonEmptyString(academic_year)) {
      return res.status(400).json({ error: 'Academic_Year is required' });
    }
    if (!isNonEmptyString(semester)) {
      return res.status(400).json({ error: 'Semester is required' });
    }

    const studentId = await Student.create({
      student_name: student_name.trim(),
      gender,
      grade: className,
      class_id: classId,
      academic_year: academic_year.trim(),
      semester: semester.trim()
    });

    const student = await Student.getById(studentId);
    return res.status(201).json(student);
  } catch (err) {
    if (err?.code === 'VALIDATION_ERROR') {
      return res.status(400).json({ error: err.message });
    }
    return next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const { student_name, gender, grade, academic_year, semester, class_id } = req.body ?? {};
    if (!isNonEmptyString(student_name)) {
      return res.status(400).json({ error: 'Student_Name is required' });
    }
    if (!isAllowedGender(gender)) {
      return res.status(400).json({ error: 'Gender must be Male, Female, or Other' });
    }

    const classId = parseNullablePositiveInt(class_id);
    let className = isNonEmptyString(grade) ? grade.trim() : null;

    if (classId) {
      const schoolClass = await SchoolClass.getById(classId);
      if (!schoolClass) {
        return res.status(400).json({ error: 'Class not found' });
      }
      className = schoolClass.class_name;
    }

    if (!isNonEmptyString(className)) {
      return res.status(400).json({ error: 'Class is required' });
    }
    if (!isNonEmptyString(academic_year)) {
      return res.status(400).json({ error: 'Academic_Year is required' });
    }
    if (!isNonEmptyString(semester)) {
      return res.status(400).json({ error: 'Semester is required' });
    }

    const affected = await Student.update(studentId, {
      student_name: student_name.trim(),
      gender,
      grade: className,
      class_id: classId,
      academic_year: academic_year.trim(),
      semester: semester.trim()
    });

    if (!affected) return res.status(404).json({ error: 'Student not found' });

    const student = await Student.getById(studentId);
    return res.json(student);
  } catch (err) {
    return next(err);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const affected = await Student.remove(studentId);
    if (!affected) return res.status(404).json({ error: 'Student not found' });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

// NEW: Get student summary with rank using view
async function getStudentSummary(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const summary = await Student.getSummary(studentId);
    if (!summary) return res.status(404).json({ error: 'Student not found' });

    return res.json(summary);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get student marks detail using view
async function getStudentMarks(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.id);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const marks = await Student.getMarksDetail(studentId);
    return res.json(marks);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentSummary,
  getStudentMarks
};
