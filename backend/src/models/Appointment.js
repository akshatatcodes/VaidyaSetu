const mongoose = require('mongoose');

/**
 * Appointment Schema — Scheduled or walk-in patient appointments
 */
const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    index: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['walk-in', 'follow-up', 'booked'],
    default: 'walk-in'
  },
  status: {
    type: String,
    enum: ['scheduled', 'checked_in', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
    index: true
  },
  tokenNumber: {
    type: String
  }
}, {
  timestamps: true
});

AppointmentSchema.index({ patientId: 1, scheduledFor: -1 });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
