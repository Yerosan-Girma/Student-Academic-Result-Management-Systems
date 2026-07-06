// Authentication Controller
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await pool.getConnection();
    
    const [users] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
    connection.release();
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    res.json({ 
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logout user
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
};

// Get current user
exports.getCurrentUser = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ userId: req.session.userId, role: req.session.userRole });
};

// Check authentication middleware
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};