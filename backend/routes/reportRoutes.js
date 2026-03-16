const express = require('express');
const { requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/', requireRole('Admin', 'Homeroom Teacher'), reportController.getReports);
router.get('/:studentId', requireRole('Admin', 'Homeroom Teacher'), reportController.getReportByStudent);

module.exports = router;
