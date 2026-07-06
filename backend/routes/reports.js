// Report Routes
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/student/:studentId', reportController.generateStudentReport);
router.get('/class/:departmentId', reportController.generateClassReport);

module.exports = router;