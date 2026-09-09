const mongoose = require('mongoose');

/**
 * User Schema — Identity & Authentication core
 * Handles Patient mobile account OR Hospital Staff credentials
 */
const UserSchema = new mongoose.Schema({
  mobile: {
    type: String,
    trim: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'reception', 'admin', 'lab'],
    default: 'patient',
    required: true,
    index: true
  },
  fullName: {
    type: String,
    trim: true
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  activePatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  isStaff: {
    type: Boolean,
    default: false
  },
  staffCode: {
    type: String
  }
}, {
  timestamps: true
});

UserSchema.index({ mobile: 1, role: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
