const Diary = require('../models/diaryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Lấy tất cả nhật ký của user hiện tại
exports.getAllDiaries = catchAsync(async (req, res, next) => {
  const diaries = await Diary.find({ user: req.user.id }).sort('-createdAt');
  
  // Trả về array trực tiếp để khớp với frontend logic
  res.status(200).json(diaries);
});

// Tạo nhật ký mới
exports.createDiary = catchAsync(async (req, res, next) => {
  const { title, description, coverImage } = req.body;
  
  const newDiary = await Diary.create({
    user: req.user.id,
    title,
    description,
    coverImage
  });

  res.status(201).json(newDiary);
});

// Lấy chi tiết một nhật ký
exports.getDiary = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.id, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  res.status(200).json(diary);
});

// Xóa nhật ký
exports.deleteDiary = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  res.status(204).json({ status: 'success', data: null });
});

// --- ENTRIES ---

// Lấy tất cả bài viết của 1 nhật ký
exports.getEntries = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.diaryId, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  // Sắp xếp entries mới nhất lên đầu
  const entries = diary.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json(entries);
});

// Thêm bài viết mới
exports.createEntry = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.diaryId, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  const newEntry = {
    title: req.body.title,
    content: req.body.content,
    mood: req.body.mood,
    date: req.body.date || Date.now(),
    images: req.body.images || []
  };

  diary.entries.push(newEntry);
  await diary.save();

  // Trả về entry vừa tạo (là phần tử cuối cùng)
  res.status(201).json(diary.entries[diary.entries.length - 1]);
});

// Lấy chi tiết 1 bài viết
exports.getEntry = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.diaryId, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  const entry = diary.entries.id(req.params.id);

  if (!entry) {
    return next(new AppError('No entry found with that ID', 404));
  }

  res.status(200).json(entry);
});

// Cập nhật bài viết
exports.updateEntry = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.diaryId, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  const entry = diary.entries.id(req.params.id);

  if (!entry) {
    return next(new AppError('No entry found with that ID', 404));
  }

  // Cập nhật các fields
  if (req.body.title) entry.title = req.body.title;
  if (req.body.content) entry.content = req.body.content;
  if (req.body.mood) entry.mood = req.body.mood;
  if (req.body.date) entry.date = req.body.date;
  if (req.body.images) entry.images = req.body.images;

  await diary.save();

  res.status(200).json(entry);
});

// Xóa bài viết
exports.deleteEntry = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ _id: req.params.diaryId, user: req.user.id });

  if (!diary) {
    return next(new AppError('No diary found with that ID', 404));
  }

  const entry = diary.entries.id(req.params.id);

  if (!entry) {
    return next(new AppError('No entry found with that ID', 404));
  }

  entry.deleteOne();
  await diary.save();

  res.status(204).json({ status: 'success', data: null });
});
