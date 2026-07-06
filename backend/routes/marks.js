// Marks Routes
const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');

router.get('/student/:studentId', marksController.getStudentMarks);
router.get('/class/:departmentId', marksController.getClassMarks);
router.post('/', marksController.addMarks);
router.put('/:id', marksController.updateMarks);

module.exports = router;