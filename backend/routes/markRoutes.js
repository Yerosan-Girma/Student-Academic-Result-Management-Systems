const express = require('express');
const requireAuth = require('../middleware/auth');
const markController = require('../controllers/markController');

const router = express.Router();

router.use(requireAuth);

router.get('/', markController.getAllMarks);
router.post('/', markController.upsertMark);
router.post('/bulk', markController.bulkUpsertMarks);
router.put('/:id', markController.updateMark);
router.delete('/:id', markController.deleteMark);

module.exports = router;
