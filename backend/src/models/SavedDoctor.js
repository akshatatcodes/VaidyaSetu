const mongoose = require('mongoose');

const SavedDoctorSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialty: {
    type: String,
    required: true
  },
  clinicName: String, // Clinic or Hospital name
  address: String,
  phone: String,
  placeId: String, // Google Maps Place ID for synchronization/verification
  notes: String,
  savedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
});

// Index for sorting by recency
SavedDoctorSchema.index({ savedAt: -1 });

module.exports = mongoose.model('SavedDoctor', SavedDoctorSchema);
