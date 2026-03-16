const bcrypt = require('bcryptjs');
const pool = require('../config/db');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeUsername(value) {
  return String(value || '').trim();
}

const SAMPLE_TEACHERS = [
  { teacher_name: 'Mr. Genet', username: 'genet' },
  { teacher_name: 'Ms. Alemu', username: 'alemu' },
  { teacher_name: 'Mr. Tola', username: 'tola' },
  { teacher_name: 'Ms. OLyad', username: 'olyad' },
  { teacher_name: 'Mr. Alemayehu', username: 'alemayehu' },
  { teacher_name: 'Addisu', username: 'addisu' }
];

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

async function ensureSampleTeacherLogins() {
  try {
    const passwordHash = await bcrypt.hash('teacher123', 10);

    for (const teacher of SAMPLE_TEACHERS) {
      await pool.execute(
        `UPDATE teachers
         SET username = ?, password_hash = COALESCE(password_hash, ?)
         WHERE teacher_name = ? AND (username IS NULL OR username = '')`,
        [teacher.username, passwordHash, teacher.teacher_name]
      );
    }
  } catch (err) {
    console.warn(
      'Could not ensure sample teacher logins. Have you run backend/sql/create_tables.sql?',
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

    const normalizedUsername = normalizeUsername(username);

    const [adminRows] = await pool.execute(
      `SELECT admin_id, username, password_hash FROM admins WHERE username = ?`,
      [normalizedUsername]
    );
    const admin = adminRows?.[0];

    if (admin) {
      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      const user = {
        user_id: admin.admin_id,
        username: admin.username,
        role: 'Admin'
      };
      req.session.user = user;
      return res.json(user);
    }

    const [teacherRows] = await pool.execute(
      `SELECT teacher_id, teacher_name, role, username, password_hash, assigned_class, department_id
       FROM teachers
       WHERE username = ?`,
      [normalizedUsername]
    );
    const teacher = teacherRows?.[0];
    if (!teacher) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, teacher.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const user = {
      user_id: teacher.teacher_id,
      teacher_id: teacher.teacher_id,
      username: teacher.username,
      teacher_name: teacher.teacher_name,
      role: teacher.role,
      assigned_class: teacher.assigned_class ?? null,
      department_id: teacher.department_id ?? null
    };
    req.session.user = user;
    return res.json(user);
  } catch (err) {
    return next(err);
  }
}

async function me(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json(req.session.user);
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
  ensureSampleTeacherLogins,
  login,
  me,
  logout
};
