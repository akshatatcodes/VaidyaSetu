const mongoose = require('mongoose');

/**
 * UserProfile (Slimmed down to User identity model per §4 / Phase 1)
 * Stripped of diagnostic screening quiz fields.
 */
const UserProfileSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    index: true
  },
  mobile: {
    type: String,
    trim: true,
    index: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'reception', 'admin', 'lab'],
    default: 'patient',
    required: true
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingComplete: {
    type: Boolean,
    default: true
  },
  doctorProfile: {
    doctorId: String,
    doctorName: String,
    registrationNumber: String,
    department: { type: String, default: 'Kayachikitsa' },
    roomNumber: { type: String, default: 'Room 104' },
    hospitalName: { type: String, default: 'All India Institute of Ayurveda (AIIA)' }
  },
  settings: {
    language: { type: String, default: 'English' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
    highContrast: { type: Boolean, default: false },
    reduceAnimations: { type: Boolean, default: false },
    voiceGuidance: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.models.UserProfile || mongoose.model('UserProfile', UserProfileSchema);
