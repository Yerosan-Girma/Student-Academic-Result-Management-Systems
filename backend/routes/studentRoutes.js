const express = require('express');
const requireAuth = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.use(requireAuth);

router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', studentController.createStudent);
router.put('/:id', studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
