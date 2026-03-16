const express = require('express');
const { requireRole } = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

const router = express.Router();

router.use(requireRole('Admin'));

router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
