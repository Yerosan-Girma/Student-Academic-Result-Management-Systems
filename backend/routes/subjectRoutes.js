const express = require('express');
const { requireRole } = require('../middleware/auth');
const subjectController = require('../controllers/subjectController');

const router = express.Router();

router.get(
  '/',
  requireRole('Admin', 'Subject Teacher', 'Homeroom Teacher'),
  subjectController.getAllSubjects
);
router.post('/', requireRole('Admin'), subjectController.createSubject);
router.put('/:id', requireRole('Admin'), subjectController.updateSubject);
router.delete('/:id', requireRole('Admin'), subjectController.deleteSubject);

module.exports = router;
