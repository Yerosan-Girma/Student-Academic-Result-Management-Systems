const express = require('express');
const { requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Original endpoints
router.get('/', requireRole('Admin', 'Homeroom Teacher'), reportController.getReports);
router.get('/student/:studentId', requireRole('Admin', 'Homeroom Teacher'), reportController.getReportByStudent);

// NEW: Advanced database concept endpoints
router.get('/rankings', requireRole('Admin', 'Homeroom Teacher'), reportController.getStudentRankings);
router.get('/class-performance/:classId?', requireRole('Admin', 'Homeroom Teacher'), reportController.getClassPerformance);
router.get('/department-performance', requireRole('Admin'), reportController.getDepartmentPerformance);
router.get('/teacher-workload/:teacherId?', requireRole('Admin'), reportController.getTeacherWorkload);
router.get('/student-report/:studentId', requireRole('Admin', 'Homeroom Teacher'), reportController.getStudentReport);
router.get('/subject-difficulty', requireRole('Admin', 'Homeroom Teacher'), reportController.getSubjectDifficulty);
router.get('/audit-log', requireRole('Admin'), reportController.getAuditLog);

module.exports = router;
