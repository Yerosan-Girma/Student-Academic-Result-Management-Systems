const bcrypt = require('bcryptjs');
const pool = require('../config/db');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

async function ensureDefaultAdmin() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INT NOT NULL AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (admin_id),
        UNIQUE KEY uq_admins_username (username)
      ) ENGINE=InnoDB
    `);

    const [rows] = await pool.execute(`SELECT COUNT(*) AS cnt FROM admins`);
    const count = rows?.[0]?.cnt ?? 0;
    if (count > 0) return;

    const username = 'admin';
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, [
      username,
      passwordHash
    ]);

    console.log('Created default admin account: admin / admin123');
  } catch (err) {
    console.warn(
      'Could not ensure default admin. Have you run backend/sql/create_tables.sql?',
      err?.code ?? err?.message ?? err
    );
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body ?? {};
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.execute(
      `SELECT admin_id, username, password_hash FROM admins WHERE username = ?`,
      [username.trim()]
    );
    const admin = rows?.[0];
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.admin = { admin_id: admin.admin_id, username: admin.username };
    return res.json({ admin_id: admin.admin_id, username: admin.username });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  if (!req.session?.admin) return res.status(401).json({ error: 'Unauthorized' });
  return res.json(req.session.admin);
}

async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('student_academic_session');
      return res.status(204).send();
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  ensureDefaultAdmin,
  login,
  me,
  logout
};
