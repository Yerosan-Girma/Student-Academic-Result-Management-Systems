const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const markRoutes = require('./routes/markRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { ensureDefaultAdmin } = require('./controllers/authController');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN?.trim();
if (corsOrigin) {
  app.use(
    cors({
      origin: corsOrigin.split(',').map((o) => o.trim()),
      credentials: true
    })
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    name: 'student_academic_session',
    secret: process.env.SESSION_SECRET || 'dev_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/reports', reportRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found' }));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Server error' });
});

const port = Number(process.env.PORT) || 3000;

ensureDefaultAdmin().finally(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
