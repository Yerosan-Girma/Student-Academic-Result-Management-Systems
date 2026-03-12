const express = require('express');
const requireAuth = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.use(requireAuth);

router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);

module.exports = router;

