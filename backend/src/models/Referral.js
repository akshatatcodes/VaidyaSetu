const mongoose = require('mongoose');

/**
 * Referral Schema — Same-hospital or cross-hospital clinical referral (§38)
 */
const ReferralSchema = new mongoose.Schema({
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
  fromDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  referralScope: {
    type: String,
    enum: ['same_hospital', 'other_hospital'],
    default: 'same_hospital',
    required: true
  },
  toHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital'
  },
  toDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  toDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  reason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  qrPayload: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
