const express = require('express');
const { requireRole } = require('../middleware/auth');
const markController = require('../controllers/markController');

const router = express.Router();

router.get('/', requireRole('Admin', 'Subject Teacher'), markController.getAllMarks);
router.post('/', requireRole('Admin', 'Subject Teacher'), markController.upsertMark);
router.post('/bulk', requireRole('Admin', 'Subject Teacher'), markController.bulkUpsertMarks);
router.put('/:id', requireRole('Admin'), markController.updateMark);
router.delete('/:id', requireRole('Admin'), markController.deleteMark);

module.exports = router;
