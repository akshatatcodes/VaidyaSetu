const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  clerkId: { type: String, required: true },
  event: { 
    type: String, 
    required: true,
    enum: [
      'card_expand', 
      'missing_data_add', 
      'doctor_finder_click', 
      'saved_doctor_action', 
      'feedback_submission', 
      'mark_as_reviewed',
      'emergency_alert_view',
      'call_108_click'
    ]
  },
  diseaseId: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analytics', AnalyticsSchema);
