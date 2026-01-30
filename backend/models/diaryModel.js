const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Entry title is required'],
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'neutral', 'excited', 'angry'],
    default: 'neutral'
  },
  date: {
    type: Date,
    default: Date.now
  },
  images: [String]
}, { timestamps: true });

const diarySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Diary title is required'],
    trim: true,
    default: 'My Diary'
  },
  description: String,
  coverImage: String,
  entries: [entrySchema],
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Diary = mongoose.model('Diary', diarySchema);

module.exports = Diary;
