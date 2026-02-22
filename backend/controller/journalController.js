const Diary = require('../models/diaryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// NOTE: This controller adapts the Diary/Entry model to the Journal API spec.
// A "Journal" in the API corresponds to an "Entry" sub-document in the Diary model.

exports.getJournals = catchAsync(async (req, res, next) => {
  // TODO: Implement filtering, pagination, and search
  const diary = await Diary.findOne({ user: req.user.id });

  if (!diary) {
    return res.status(200).json({
        status: 'success',
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        results: 0,
        data: {
            journals: []
        }
    });
  }
  
  // For now, return all entries sorted
  const journals = diary.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({
    status: 'success',
    results: journals.length,
    data: {
        journals: journals
    }
  });
});

exports.createJournal = catchAsync(async (req, res, next) => {
    let diary = await Diary.findOne({ user: req.user.id });

    // If user has no diary, create one for them
    if (!diary) {
        diary = await Diary.create({ user: req.user.id, title: `${req.user.name}'s Diary`, entries: [] });
    }

    const newEntry = {
        title: req.body.title,
        content: req.body.content,
        mood: req.body.mood,
        date: req.body.entryDate, // Match the spec
        tags: req.body.tags
    };

    diary.entries.push(newEntry);
    await diary.save();
    
    const createdJournal = diary.entries[diary.entries.length - 1];

    res.status(201).json({
        status: 'success',
        data: {
            journal: createdJournal
        }
    });
});

exports.getJournalById = catchAsync(async (req, res, next) => {
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });

    if (!diary) {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    const journal = diary.entries.id(req.params.id);

    res.status(200).json({
        status: 'success',
        data: {
            journal: journal
        }
    });
});

exports.updateJournal = catchAsync(async (req, res, next) => {
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });

    if (!diary) {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    const journal = diary.entries.id(req.params.id);
    if (!journal) {
        // This case should not be reached if the above query works, but for safety:
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    // Update fields from request body
    journal.set(req.body);
    // The field from spec is entryDate, but in the model it is date
    if(req.body.entryDate) {
        journal.date = req.body.entryDate;
    }


    await diary.save();

    res.status(200).json({
        status: 'success',
        data: {
            journal: journal
        }
    });
});

exports.deleteJournal = catchAsync(async (req, res, next) => {
    // Soft delete is not implemented in the model, so we will do a hard delete.
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });

    if (!diary) {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }
    
    const entry = diary.entries.id(req.params.id);
    if(entry) {
        entry.deleteOne();
    } else {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    await diary.save();

    res.status(204).json({
        status: 'success',
        data: null
    });
});
