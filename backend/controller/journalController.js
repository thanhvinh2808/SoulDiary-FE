const Diary = require('../models/diaryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// 1. LẤY DANH SÁCH (Phân loại rõ ràng)
exports.getJournals = catchAsync(async (req, res, next) => {
  const diary = await Diary.findOne({ user: req.user.id });

  if (!diary) {
    return res.status(200).json({ status: 'success', data: { journals: [] } });
  }
  
  // includeDeleted = true -> Lấy Thùng rác
  // includeDeleted = false -> Lấy Nhật ký
  const includeDeleted = req.query.includeDeleted === 'true';
  
  const journals = diary.entries.filter(entry => {
    const isDeleted = entry.isDeleted === true;
    return includeDeleted ? isDeleted : !isDeleted;
  });

  // Sắp xếp bài mới nhất lên đầu
  journals.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({
    status: 'success',
    results: journals.length,
    data: { journals }
  });
});

// 2. TẠO MỚI (Mặc định isDeleted = false)
exports.createJournal = catchAsync(async (req, res, next) => {
    let diary = await Diary.findOne({ user: req.user.id });
    if (!diary) {
        diary = await Diary.create({ user: req.user.id, entries: [] });
    }

    const newEntry = {
        title: req.body.title,
        content: req.body.content,
        mood: req.body.mood,
        date: req.body.entryDate || new Date(),
        tags: req.body.tags,
        isDeleted: false
    };

    diary.entries.push(newEntry);
    await diary.save();
    
    res.status(201).json({
        status: 'success',
        data: { journal: diary.entries[diary.entries.length - 1] }
    });
});

// 3. XỬ LÝ XÓA (Thông minh: Soft delete -> Hard delete)
exports.deleteJournal = catchAsync(async (req, res, next) => {
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });
    if (!diary) return next(new AppError('Không tìm thấy bài viết', 404));
    
    const entry = diary.entries.id(req.params.id);
    
    if (entry.isDeleted) {
        // Nếu đã ở trong thùng rác -> XÓA VĨNH VIỄN
        entry.deleteOne();
        console.log(`🔥 Đã xóa vĩnh viễn: ${req.params.id}`);
    } else {
        // Nếu chưa xóa -> CHUYỂN VÀO THÙNG RÁC
        entry.isDeleted = true;
        entry.deletedAt = new Date();
        console.log(`🗑️ Đã chuyển vào thùng rác: ${req.params.id}`);
    }

    await diary.save();
    res.status(200).json({
        status: 'success',
        message: entry.isDeleted ? 'Đã chuyển vào thùng rác' : 'Đã xóa vĩnh viễn'
    });
});

// 4. KHÔI PHỤC
exports.restoreJournal = catchAsync(async (req, res, next) => {
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });
    if (!diary) return next(new AppError('Không tìm thấy bài viết', 404));
    
    const entry = diary.entries.id(req.params.id);
    entry.isDeleted = false;
    entry.deletedAt = null;
    
    await diary.save();
    res.status(200).json({
        status: 'success',
        message: 'Đã khôi phục bài viết thành công'
    });
});

exports.getJournalById = (req, res) => {/* Giữ nguyên logic cũ */};
exports.updateJournal = (req, res) => {/* Giữ nguyên logic cũ */};
