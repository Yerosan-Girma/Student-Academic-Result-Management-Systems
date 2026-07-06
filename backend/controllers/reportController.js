// Report Controller - generates academic reports
const pool = require('../config/database');

// Generate student report card
exports.generateStudentReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const connection = await pool.getConnection();
    
    const [student] = await connection.query('SELECT * FROM students WHERE id = ?', [studentId]);
    const [marks] = await connection.query(
      'SELECT m.*, s.name as subject_name FROM marks m JOIN subjects s ON m.subject_id = s.id WHERE m.student_id = ?',
      [studentId]
    );
    
    connection.release();
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const gpa = calculateGPA(marks);
    const report = {
      student: student[0],
      marks,
      gpa,
      generatedDate: new Date()
    };
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate class performance report
exports.generateClassReport = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const connection = await pool.getConnection();
    
    const [classMarks] = await connection.query(
      'SELECT m.*, s.name as student_name, su.name as subject_name FROM marks m JOIN students s ON m.student_id = s.id JOIN subjects su ON m.subject_id = su.id WHERE s.department_id = ?',
      [departmentId]
    );
    
    const avgMarks = calculateAverageMarks(classMarks);
    const topStudents = getTopStudents(classMarks, 5);
    
    connection.release();
    
    res.json({
      classStats: {
        totalStudents: new Set(classMarks.map(m => m.student_id)).size,
        averageMarks: avgMarks,
        highestMark: Math.max(...classMarks.map(m => m.total)),
        lowestMark: Math.min(...classMarks.map(m => m.total))
      },
      topPerformers: topStudents,
      generatedDate: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper functions
function calculateGPA(marks) {
  if (marks.length === 0) return 0;
  const total = marks.reduce((sum, m) => sum + m.total, 0);
  return (total / marks.length / 100 * 4).toFixed(2);
}

function calculateAverageMarks(marks) {
  if (marks.length === 0) return 0;
  const total = marks.reduce((sum, m) => sum + m.total, 0);
  return (total / marks.length).toFixed(2);
}

function getTopStudents(marks, count) {
  const studentMarks = {};
  marks.forEach(m => {
    if (!studentMarks[m.student_name]) {
      studentMarks[m.student_name] = [];
    }
    studentMarks[m.student_name].push(m.total);
  });
  
  return Object.entries(studentMarks)
    .map(([name, markList]) => ({
      name,
      average: (markList.reduce((a, b) => a + b, 0) / markList.length).toFixed(2)
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, count);
}