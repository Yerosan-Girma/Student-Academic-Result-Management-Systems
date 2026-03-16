const express = require('express');
const { requireRole } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.use(requireRole('Admin'));

router.get('/', teacherController.getAllTeachers);
router.post('/', teacherController.createTeacher);
router.put('/:id', teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);

module.exports = router;
