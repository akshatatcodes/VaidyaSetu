const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread',
    index: true
  },
  actionUrl: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  expiryDate: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
