const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  field: {
    type: String,
    required: true
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  changeType: {
    type: String,
    enum: ['initial', 'correction', 'real_change', 'auto_add', 'auto_remove', 'sync'],
    required: true
  },
  intent: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['user', 'google_fit', 'ai', 'system'],
    default: 'user'
  },
  unit: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for timeline queries
HistorySchema.index({ clerkId: 1, timestamp: -1 });

module.exports = mongoose.model('History', HistorySchema);
