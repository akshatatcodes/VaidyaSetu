const mongoose = require('mongoose');

const AlertPreferenceSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  preferences: [{
    alertType: {
      type: String,
      required: true,
      enum: [
        'interaction_detected', 
        'vital_out_of_range', 
        'medication_reminder', 
        'lab_test_due', 
        'profile_incomplete', 
        'goal_achieved', 
        'new_feature', 
        'health_tip',
        'predictive_risk_high'
      ]
    },
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true }
  }],
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' }, // 24h format
    end: { type: String, default: '07:00' }
  },
  customThresholds: {
    systolicBP: { low: Number, high: Number },
    diastolicBP: { low: Number, high: Number },
    fastingGlucose: { low: Number, high: Number },
    heartRate: { low: Number, high: Number },
    spo2: { low: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('AlertPreference', AlertPreferenceSchema);
