const express = require('express');
const requireAuth = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

const router = express.Router();

router.use(requireAuth);

router.get('/', teacherController.getAllTeachers);
router.post('/', teacherController.createTeacher);
router.put('/:id', teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);

module.exports = router;
