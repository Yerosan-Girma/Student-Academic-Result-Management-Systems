const express = require('express');
const { requireRole } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', requireRole('Admin', 'Subject Teacher', 'Homeroom Teacher'), studentController.getAllStudents);
router.get(
  '/:id',
  requireRole('Admin', 'Subject Teacher', 'Homeroom Teacher'),
  studentController.getStudentById
);
router.post('/', requireRole('Admin'), studentController.createStudent);
router.put('/:id', requireRole('Admin'), studentController.updateStudent);
router.delete('/:id', requireRole('Admin'), studentController.deleteStudent);

// NEW: Advanced database concept endpoints
router.get('/:id/summary', requireRole('Admin', 'Subject Teacher', 'Homeroom Teacher'), studentController.getStudentSummary);
router.get('/:id/marks', requireRole('Admin', 'Subject Teacher', 'Homeroom Teacher'), studentController.getStudentMarks);

module.exports = router;
