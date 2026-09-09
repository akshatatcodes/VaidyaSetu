const mongoose = require('mongoose');

/**
 * Vital Schema — Keyed off Encounter (if captured in hospital/kiosk) or Patient (home-logged) (§14)
 */
const VitalSchema = new mongoose.Schema({
  encounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  clerkId: {
    type: String,
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
      'respiratory_rate',
      'height',
      'sleep_duration', 
      'water_intake', 
      'steps'
    ],
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Number or Object (BP: {systolic, diastolic})
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
    enum: ['patient', 'kiosk-device', 'kiosk-peripheral', 'staff', 'manual', 'device_sync'],
    default: 'patient'
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

VitalSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.models.Vital || mongoose.model('Vital', VitalSchema);
