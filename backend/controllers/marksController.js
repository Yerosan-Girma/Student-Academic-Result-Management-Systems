// Marks Controller - handles student marks and grades
const pool = require('../config/database');

// Get marks for a student
exports.getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const connection = await pool.getConnection();
    const [marks] = await connection.query(
      'SELECT m.*, s.name as subject_name FROM marks m JOIN subjects s ON m.subject_id = s.id WHERE m.student_id = ?',
      [studentId]
    );
    connection.release();
    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add marks for a student
exports.addMarks = async (req, res) => {
  try {
    const { student_id, subject_id, test1, test2, assignment, final_exam } = req.body;
    const connection = await pool.getConnection();
    
    // Calculate total marks
    const total = test1 + test2 + assignment + final_exam;
    
    await connection.query(
      'INSERT INTO marks (student_id, subject_id, test1, test2, assignment, final_exam, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [student_id, subject_id, test1, test2, assignment, final_exam, total]
    );
    connection.release();
    res.status(201).json({ message: 'Marks added successfully', total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update marks
exports.updateMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { test1, test2, assignment, final_exam } = req.body;
    const total = test1 + test2 + assignment + final_exam;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE marks SET test1 = ?, test2 = ?, assignment = ?, final_exam = ?, total = ? WHERE id = ?',
      [test1, test2, assignment, final_exam, total, id]
    );
    connection.release();
    res.json({ message: 'Marks updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get class marks summary
exports.getClassMarks = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const connection = await pool.getConnection();
    const [marks] = await connection.query(
      'SELECT m.*, s.name as student_name, su.name as subject_name FROM marks m JOIN students s ON m.student_id = s.id JOIN subjects su ON m.subject_id = su.id WHERE s.department_id = ?',
      [departmentId]
    );
    connection.release();
    res.json(marks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};