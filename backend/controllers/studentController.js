// Student Controller - handles all student-related operations
const pool = require('../config/database');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [students] = await connection.query('SELECT * FROM students');
    connection.release();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [student] = await connection.query('SELECT * FROM students WHERE id = ?', [id]);
    connection.release();
    
    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new student
exports.createStudent = async (req, res) => {
  try {
    const { name, email, department_id, enrollment_number } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'INSERT INTO students (name, email, department_id, enrollment_number) VALUES (?, ?, ?, ?)',
      [name, email, department_id, enrollment_number]
    );
    connection.release();
    res.status(201).json({ message: 'Student created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department_id } = req.body;
    const connection = await pool.getConnection();
    
    await connection.query(
      'UPDATE students SET name = ?, email = ?, department_id = ? WHERE id = ?',
      [name, email, department_id, id]
    );
    connection.release();
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    await connection.query('DELETE FROM students WHERE id = ?', [id]);
    connection.release();
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};