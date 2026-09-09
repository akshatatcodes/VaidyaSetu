const mongoose = require('mongoose');

/**
 * Notification Schema — Multi-channel notification engine (§56)
 */
const NotificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  channel: {
    type: String,
    enum: ['sms', 'whatsapp', 'push', 'kiosk_print', 'voice'],
    required: true,
    index: true
  },
  template: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'failed'],
    default: 'queued',
    index: true
  }
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
