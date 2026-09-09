const mongoose = require('mongoose');

/**
 * Medication Schema — Long-lived patient medication record (§6)
 * Bucket status: CURRENT, PREVIOUS, STOPPED, NEEDS CONFIRMATION
 */
const MedicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    index: true
  },
  clerkId: {
    type: String,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  system: {
    type: String,
    enum: ['modern', 'ayurvedic', 'other'],
    default: 'modern'
  },
  dosage: {
    type: String,
    default: ''
  },
  frequency: {
    type: String,
    default: 'daily'
  },
  status: {
    type: String,
    enum: ['CURRENT', 'PREVIOUS', 'STOPPED', 'NEEDS CONFIRMATION'],
    default: 'CURRENT',
    required: true,
    index: true
  },
  sourceDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  sourceTag: {
    type: String,
    default: 'Patient reported'
  },
  active: {
    type: Boolean,
    default: true
  },
  timings: [{ type: String }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }
}, { timestamps: true });

MedicationSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.models.Medication || mongoose.model('Medication', MedicationSchema);
