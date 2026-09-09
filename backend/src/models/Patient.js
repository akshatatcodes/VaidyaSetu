const mongoose = require('mongoose');

/**
 * Patient Schema — Represents a unique health identity (Self or Family Beneficiary)
 */
const PatientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  abhaId: {
    type: String,
    trim: true,
    index: true
  },
  abhaAddress: {
    type: String,
    trim: true
  },
  abhaLinkStatus: {
    type: String,
    enum: ['unlinked', 'pending_abdm_flow', 'linked', 'failed'],
    default: 'unlinked'
  },
  mobileNumber: {
    type: String,
    trim: true,
    index: true
  },
  familyHeadPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient'
  },
  relationshipToHead: {
    type: String,
    default: 'Self'
  },
  isFamilyHead: {
    type: Boolean,
    default: true
  },
  basicInfo: {
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], default: 'Unknown' },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String }
    }
  },
  healthProfile: {
    allergies: [{
      substance: { type: String },
      sourceTag: { type: String, default: 'Not reported' }, // Confirmed, Patient reported, Document derived, Uncertain, Conflicting, Not reported
      status: { type: String, default: 'Confirmed' }
    }],
    existingDiseases: [{
      condition: { type: String },
      sourceTag: { type: String, default: 'Not reported' },
      diagnosedAt: { type: Date }
    }],
    surgeries: [{
      procedure: { type: String },
      year: { type: Number },
      hospital: { type: String }
    }],
    hospitalizations: [{
      reason: { type: String },
      year: { type: Number }
    }],
    familyHistory: [{
      relation: { type: String },
      condition: { type: String }
    }],
    personalHistory: {
      smoking: { type: String, default: 'Not reported' },
      alcohol: { type: String, default: 'Not reported' },
      diet: { type: String, default: 'Not reported' }
    }
  },
  ayushProfile: {
    prakriti: { type: String, default: 'Not reported' },
    vikriti: { type: String, default: 'Not reported' },
    ahara: { type: String, default: 'Not reported' },
    vihara: { type: String, default: 'Not reported' },
    agni: { type: String, default: 'Not reported' },
    koshtha: { type: String, default: 'Not reported' }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

PatientSchema.index({ 'basicInfo.fullName': 1, 'basicInfo.contactNumber': 1 });

module.exports = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
