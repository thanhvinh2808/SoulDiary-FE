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
  
  // Handle soft delete filtering
  const includeDeleted = req.query.includeDeleted === 'true';
  console.log(`🔍 getJournals: includeDeleted=${includeDeleted}`);
  console.log(`📊 Total entries in diary: ${diary.entries.length}`);
  
  // Filter entries based on soft delete status
  let filteredEntries = diary.entries.filter(entry => {
    // Treat undefined isDeleted as false (active)
    const isDeletedStatus = entry.isDeleted === true ? true : false;
    
    if (includeDeleted) {
      console.log(`  Entry "${entry.title}": isDeleted=${entry.isDeleted}, returning=${isDeletedStatus}`);
      return isDeletedStatus;  // Show only deleted entries
    } else {
      console.log(`  Entry "${entry.title}": isDeleted=${entry.isDeleted}, returning=${!isDeletedStatus}`);
      return !isDeletedStatus;  // Show only active entries (default)
    }
  });
  
  // Get pagination params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Sort by date (newest first)
  const sortedEntries = filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Apply pagination
  const paginatedEntries = sortedEntries.slice(skip, skip + limit);
  
  // Calculate pagination info
  const totalPages = Math.ceil(filteredEntries.length / limit);

  res.status(200).json({
    status: 'success',
    page,
    limit,
    totalPages,
    totalResults: filteredEntries.length,
    results: paginatedEntries.length,
    message: 'Journals retrieved successfully',
    data: {
        journals: paginatedEntries,
        pagination: {
          page,
          limit,
          totalPages,
          totalResults: filteredEntries.length
        }
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
        tags: req.body.tags,
        isDeleted: false,  // Explicitly set soft delete flag
        deletedAt: null
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
    // Soft delete: mark entry as deleted instead of removing it
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });

    if (!diary) {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }
    
    const entry = diary.entries.id(req.params.id);
    if(entry) {
        // Soft delete: set isDeleted flag and deletedAt timestamp
        entry.isDeleted = true;
        entry.deletedAt = new Date();
        console.log(`🗑️ Soft delete: Entry ${req.params.id} marked as deleted`);
    } else {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    await diary.save();

    res.status(200).json({
        status: 'success',
        message: 'Entry moved to trash',
        data: {
            journal: entry
        }
    });
});

exports.restoreJournal = catchAsync(async (req, res, next) => {
    // Restore a soft-deleted entry
    const diary = await Diary.findOne({ user: req.user.id, 'entries._id': req.params.id });

    if (!diary) {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }
    
    const entry = diary.entries.id(req.params.id);
    if(entry) {
        // Restore: unset isDeleted flag and clear deletedAt
        entry.isDeleted = false;
        entry.deletedAt = null;
        console.log(`♻️ Restore: Entry ${req.params.id} restored from trash`);
    } else {
        return next(new AppError('Không tìm thấy nhật ký', 404));
    }

    await diary.save();

    res.status(200).json({
        status: 'success',
        message: 'Entry restored from trash',
        data: {
            journal: entry
        }
    });
});
