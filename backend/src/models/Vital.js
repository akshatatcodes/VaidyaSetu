const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'blood_pressure', 
      'heart_rate', 
      'blood_glucose', 
      'weight', 
      'body_temperature', 
      'oxygen_saturation', 
      'sleep_duration', 
      'water_intake', 
      'steps'
    ],
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Supports Numbers (Glucose) and Objects (BP: {systolic, diastolic})
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['manual', 'device_sync'],
    default: 'manual'
  },
  notes: {
    type: String,
    default: ''
  },
  mealContext: {
    type: String,
    enum: [
      'fasting', 'before_meal', 'after_meal', 'none',
      'resting', 'after_exercise', 'before_bed', 'morning',
      'sleeping', 'high_altitude'
    ],
    default: 'none'
  }
}, { timestamps: true });

module.exports = mongoose.model('Vital', VitalSchema);
