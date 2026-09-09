const mongoose = require('mongoose');

/**
 * FollowUp Schema — Continuity Engine follow-up encounter manager (§31-37)
 */
const FollowUpSchema = new mongoose.Schema({
  originEncounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  reason: {
    type: String,
    enum: ['lab_result', 'imaging', 'review', 'referral_return', 'symptom_worsening'],
    required: true,
    index: true
  },
  linkedOrderIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestigationOrder'
  }],
  status: {
    type: String,
    enum: ['waiting_for_results', 'schedulable', 'scheduled', 'completed', 'cancelled'],
    default: 'waiting_for_results',
    required: true,
    index: true
  },
  scheduledWindow: {
    date: { type: String }, // YYYY-MM-DD
    startTime: { type: String }, // HH:mm
    endTime: { type: String } // HH:mm
  },
  newEncounterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Encounter'
  }
}, { timestamps: true });

FollowUpSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);
