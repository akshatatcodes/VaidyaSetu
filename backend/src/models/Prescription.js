const mongoose = require('mongoose');

const MedicationItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  system: { type: String, enum: ['modern', 'ayurvedic', 'other'], default: 'modern' },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  instructions: { type: String, default: '' }
}, { _id: false });

/**
 * Prescription Schema — Doctor encounter prescription (§26)
 */
const PrescriptionSchema = new mongoose.Schema({
  encounterId: {
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
    required: true,
    index: true
  },
  items: [MedicationItemSchema],
  advice: {
    type: String,
    default: ''
  },
  signedAt: {
    type: Date,
    default: Date.now
  },
  doctorSignature: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
