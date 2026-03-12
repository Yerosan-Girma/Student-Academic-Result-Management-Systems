const express = require('express');
const requireAuth = require('../middleware/auth');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.use(requireAuth);

router.get('/', subjectController.getAllSubjects);
router.post('/', subjectController.createSubject);
router.put('/:id', subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
