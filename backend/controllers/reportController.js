const pool = require('../config/db');

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function computeStatus(subjectMarks, passMark) {
  for (const item of subjectMarks) {
    if (item.mark === null || item.mark === undefined) return 'FAIL';
    if (Number(item.mark) < passMark) return 'FAIL';
  }
  return 'PASS';
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

async function buildReports() {
  const [subjects] = await pool.execute(
    `SELECT subject_id, subject_name, total_mark
     FROM subjects
     ORDER BY subject_id ASC`
  );
  const [students] = await pool.execute(
    `SELECT student_id, student_name, gender, grade, academic_year, semester
     FROM students
     ORDER BY student_id ASC`
  );
  const [marks] = await pool.execute(`SELECT student_id, subject_id, mark FROM marks`);

  const subjectsById = new Map(subjects.map((s) => [s.subject_id, s]));
  const studentMarks = new Map(); // student_id -> Map(subject_id -> mark)
  for (const m of marks) {
    if (!studentMarks.has(m.student_id)) {
      studentMarks.set(m.student_id, new Map());
    }
    studentMarks.get(m.student_id).set(m.subject_id, m.mark);
  }

  const subjectCount = subjects.length;
  const passMark = 50;

  const reports = students.map((st) => {
    const marksMap = studentMarks.get(st.student_id) ?? new Map();
    const subjectMarks = subjects.map((sub) => {
      const mark = marksMap.has(sub.subject_id) ? marksMap.get(sub.subject_id) : null;
      return {
        subject_id: sub.subject_id,
        subject_name: sub.subject_name,
        total_mark: sub.total_mark,
        mark
      };
    });

    const total = subjectMarks.reduce((sum, item) => sum + (item.mark ?? 0), 0);
    const average = subjectCount > 0 ? total / subjectCount : 0;
    const status = computeStatus(subjectMarks, passMark);

    return {
      student: st,
      subjectMarks,
      total,
      total_out_of: subjectCount * 100,
      average: Number(average.toFixed(2)),
      status
    };
  });

  const ranked = applyDenseRank(reports);
  return { subjects: [...subjectsById.values()], reports: ranked };
}

async function getReports(req, res, next) {
  try {
    const data = await buildReports();
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

async function getReportByStudent(req, res, next) {
  try {
    const studentId = parsePositiveInt(req.params.studentId);
    if (!studentId) return res.status(400).json({ error: 'Invalid student id' });

    const data = await buildReports();
    const report = data.reports.find((r) => r.student.student_id === studentId);
    if (!report) return res.status(404).json({ error: 'Student not found' });

    return res.json(report);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getReports,
  getReportByStudent
};
