const express = require('express');
const diaryController = require('../controller/diaryController');
const authController = require('../controller/authController');

const router = express.Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập
router.use(authController.protect);

router
  .route('/')
  .get(diaryController.getAllDiaries)
  .post(diaryController.createDiary);

router
  .route('/:id')
  .get(diaryController.getDiary)
  .delete(diaryController.deleteDiary);

// Route cho Entries (Bài viết)
// /api/v1/diaries/:diaryId/entries
router
  .route('/:diaryId/entries')
  .get(diaryController.getEntries)
  .post(diaryController.createEntry);

router
  .route('/:diaryId/entries/:id')
  .get(diaryController.getEntry)
  .patch(diaryController.updateEntry)
  .delete(diaryController.deleteEntry);

module.exports = router;
