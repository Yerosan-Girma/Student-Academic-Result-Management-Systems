const pool = require('../config/db');
const SchoolClass = require('../models/Class');
const Student = require('../models/Student');
const { isStudentEligibleForSubject } = require('../utils/yearUtils');

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function computeStatus({ total, totalOutOf, hasMissing, passPercent }) {
  if (hasMissing) return 'FAIL';
  if (!Number.isFinite(totalOutOf) || totalOutOf <= 0) return 'FAIL';
  const threshold = (totalOutOf * passPercent) / 100;
  return total >= threshold ? 'PASS' : 'FAIL';
}

function applyDenseRank(reports) {
  const sorted = [...reports].sort((a, b) => b.total - a.total);
  let rank = 0;
  let lastTotal = null;
  for (const report of sorted) {
    if (lastTotal === null || report.total !== lastTotal) {
      rank += 1;
      lastTotal = report.total;
    }
    report.rank = rank;
  }
  return sorted;
}

// NEW: Get student rankings using view
async function getStudentRankings(req, res, next) {
  try {
    const user = req.session?.user ?? null;
    
    // Use vw_student_summary view for rankings
    const [rows] = await pool.execute(
      `SELECT student_id, student_name, total_subjects, total_marks, 
              average_mark, \`rank\`, status
       FROM vw_student_summary
       ORDER BY \`rank\` ASC`
    );
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get class performance using view
async function getClassPerformance(req, res, next) {
  try {
    const classId = parsePositiveInt(req.params.classId);
    
    if (classId) {
      // Get specific class performance
      const [rows] = await pool.execute(
        `SELECT class_id, class_name, student_count, mark_count,
                class_average, highest_mark, lowest_mark
         FROM vw_class_performance
         WHERE class_id = ?`,
        [classId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      return res.json(rows[0]);
    }
    
    // Get all classes performance
    const [rows] = await pool.execute(
      `SELECT class_id, class_name, student_count, mark_count,
              class_average, highest_mark, lowest_mark
       FROM vw_class_performance
       ORDER BY class_average DESC`
    );
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get department performance using view
async function getDepartmentPerformance(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT department_id, department_name, teacher_count, subject_count,
              student_count, total_marks_recorded, department_average,
              highest_mark, lowest_mark
       FROM vw_department_performance
       ORDER BY department_average DESC`
    );
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get teacher workload using view
async function getTeacherWorkload(req, res, next) {
  try {
    const teacherId = parsePositiveInt(req.params.teacherId);
    
    if (teacherId) {
      // Get specific teacher workload
      const [rows] = await pool.execute(
        `SELECT teacher_id, teacher_name, subject_department, subject_name,
                subject_id, students_graded, average_mark_given
         FROM vw_teacher_subject_assignment
         WHERE teacher_id = ?
         ORDER BY subject_name ASC`,
        [teacherId]
      );
      
      return res.json(rows);
    }
    
    // Get all teachers workload
    const [rows] = await pool.execute(
      `SELECT teacher_id, teacher_name, subject_department, subject_name,
              subject_id, students_graded, average_mark_given
       FROM vw_teacher_subject_assignment
       ORDER BY teacher_name ASC, subject_name ASC`
    );
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get comprehensive student report using stored procedure
async function getStudentReport(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.studentId);
    if (!studentId) {
      return res.status(400).json({ error: 'Invalid student id' });
    }
    
    // Use stored procedure for comprehensive report
    const report = await Student.getReport(studentId);
    
    if (!report) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get subject difficulty analysis using function
async function getSubjectDifficulty(req, res, next) {
  try {
    // Use fn_get_subject_average function
    const [rows] = await pool.execute(
      `SELECT sub.subject_id, sub.subject_name,
              fn_get_subject_average(sub.subject_id) AS average_mark
       FROM subjects sub
       ORDER BY average_mark ASC`
    );
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

// NEW: Get audit log for marks
async function getAuditLog(req, res, next) {
  try {
    const limit = parsePositiveInt(req.query.limit) || 100;
    const studentId = parsePositiveInt(req.query.student_id);
    
    let query = `
      SELECT log_id, table_name, operation, record_id,
             old_values, new_values, changed_by, changed_at
      FROM audit_log
      WHERE table_name = 'marks'
    `;
    
    const params = [];
    
    if (studentId) {
      query += ` AND (
        JSON_EXTRACT(new_values, '$.student_id') = ? OR
        JSON_EXTRACT(old_values, '$.student_id') = ?
      )`;
      params.push(studentId, studentId);
    }
    
    query += ` ORDER BY changed_at DESC LIMIT ?`;
    params.push(limit);
    
    const [rows] = await pool.execute(query, params);
    
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

async function buildReports({ classFilter = null } = {}) {
  const [subjects] = await pool.execute(
    `SELECT subject_id, subject_name, total_mark, start_year
     FROM subjects
     ORDER BY subject_id ASC`
  );

  const studentWhere = classFilter ? 'WHERE COALESCE(c.class_name, s.grade) = ?' : '';
  const studentParams = classFilter ? [classFilter] : [];
  const [students] = await pool.execute(
    `SELECT
        s.student_id,
        s.student_name,
        s.gender,
        COALESCE(c.class_name, s.grade) AS grade,
        s.academic_year,
        s.semester
     FROM students s
     LEFT JOIN classes c ON c.class_id = s.class_id
     ${studentWhere}
     ORDER BY s.student_id ASC`,
    studentParams
  );
  const [marks] = await pool.execute(`SELECT student_id, subject_id, mark FROM marks`);
  const [homerooms] = await pool.execute(
    `SELECT
        t.teacher_id,
        t.teacher_name,
        COALESCE(c.class_name, t.assigned_class) AS assigned_class
     FROM teachers t
     LEFT JOIN classes c ON c.class_id = t.assigned_class_id
     WHERE role = 'Homeroom Teacher'`
  );

  const subjectsById = new Map(subjects.map((s) => [s.subject_id, s]));
  const studentMarks = new Map(); // student_id -> Map(subject_id -> mark)
  for (const m of marks) {
    if (!studentMarks.has(m.student_id)) {
      studentMarks.set(m.student_id, new Map());
    }
    studentMarks.get(m.student_id).set(m.subject_id, m.mark);
  }

  const passPercent = 50;
  const homeroomByClass = new Map(
    homerooms
      .filter((t) => t.assigned_class)
      .map((t) => [String(t.assigned_class).trim(), t])
  );

  const reports = students.map((st) => {
    const marksMap = studentMarks.get(st.student_id) ?? new Map();
    const subjectMarks = subjects.map((sub) => {
      const isEligible = isStudentEligibleForSubject(st.academic_year, sub.start_year);
      if (!isEligible) {
        return {
          subject_id: sub.subject_id,
          subject_name: sub.subject_name,
          total_mark: sub.total_mark,
          start_year: sub.start_year ?? null,
          is_eligible: false,
          mark: null
        };
      }

      const mark = marksMap.has(sub.subject_id) ? marksMap.get(sub.subject_id) : null;
      return {
        subject_id: sub.subject_id,
        subject_name: sub.subject_name,
        total_mark: sub.total_mark,
        start_year: sub.start_year ?? null,
        is_eligible: true,
        mark
      };
    });

    const eligibleSubjects = subjectMarks.filter((item) => item.is_eligible);
    const totalOutOf = eligibleSubjects.reduce((sum, item) => sum + Number(item.total_mark || 0), 0);
    const total = eligibleSubjects.reduce((sum, item) => sum + (item.mark ?? 0), 0);
    const average = eligibleSubjects.length > 0 ? total / eligibleSubjects.length : 0;
    const hasMissing = eligibleSubjects.some(
      (item) => item.mark === null || item.mark === undefined
    );
    const status = computeStatus({ total, totalOutOf, hasMissing, passPercent });
    const classKey = st.grade ? String(st.grade).trim() : '';
    const homeroomTeacher = classKey ? homeroomByClass.get(classKey) ?? null : null;

    return {
      student: st,
      subjectMarks,
      total,
      total_out_of: totalOutOf,
      average: Number(average.toFixed(2)),
      status,
      homeroom_teacher: homeroomTeacher
    };
  });

  const ranked = applyDenseRank(reports);
  return { subjects: [...subjectsById.values()], reports: ranked };
}

async function resolveClassFilterForUser(user) {
  if (user?.role !== 'Homeroom Teacher') return null;

  const assignedClassId = Number(user?.assigned_class_id);
  if (Number.isInteger(assignedClassId) && assignedClassId > 0) {
    const schoolClass = await SchoolClass.getById(assignedClassId);
    return schoolClass?.class_name ?? null;
  }

  const assignedClass = typeof user?.assigned_class === 'string' ? user.assigned_class.trim() : '';
  return assignedClass || null;
}

async function getReports(req, res, next) {
  try {
    const user = req.session?.user ?? null;
    const classFilter = await resolveClassFilterForUser(user);

    if (user?.role === 'Homeroom Teacher' && !classFilter) {
      const [subjects] = await pool.execute(
        `SELECT subject_id, subject_name, total_mark, start_year
         FROM subjects
         ORDER BY subject_id ASC`
      );
      return res.json({ subjects, reports: [] });
    }

    const data = await buildReports({ classFilter });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function getReportByStudent(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const user = req.session?.user ?? null;
    const classFilter = await resolveClassFilterForUser(user);

    if (user?.role === 'Homeroom Teacher' && !classFilter) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const data = await buildReports({ classFilter });
    const report = data.reports.find((r) => r.student.student_id === studentId);
    if (!report) return res.status(404).json({ error: 'Student not found' });

    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getReports,
  getReportByStudent,
  getStudentRankings,
  getClassPerformance,
  getDepartmentPerformance,
  getTeacherWorkload,
  getStudentReport,
  getSubjectDifficulty,
  getAuditLog
};
