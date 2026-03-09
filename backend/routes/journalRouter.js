const express = require('express');
const journalController = require('../controller/journalController');
const authController = require('../controller/authController');

const router = express.Router();
router.use(authController.protect);

router
  .route('/')
  .get(journalController.getJournals)
  .post(journalController.createJournal);

router
  .route('/:id')
  .get(journalController.getJournalById)
  .patch(journalController.updateJournal)
  .delete(journalController.deleteJournal);

// Restore soft-deleted entry
router.patch('/:id/restore', journalController.restoreJournal);

module.exports = router;
