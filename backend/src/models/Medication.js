const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'twice_daily', 'thrice_daily', 'as_needed', 'custom'],
    default: 'daily'
  },
  timings: [{
    type: String // HH:mm
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  },
  lastTaken: {
    type: Date
  },
  adherence: {
    totalDoses: { type: Number, default: 0 },
    takenDoses: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Medication', MedicationSchema);
