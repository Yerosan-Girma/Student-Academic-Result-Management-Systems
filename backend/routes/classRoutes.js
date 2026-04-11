const express = require('express');
const { requireRole } = require('../middleware/auth');
const classController = require('../controllers/classController');

const router = express.Router();

router.use(requireRole('Admin'));

router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);
router.post('/', classController.createClass);
router.put('/:id', classController.updateClass);
router.delete('/:id', classController.deleteClass);

module.exports = router;
