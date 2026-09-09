const mongoose = require('mongoose');

/**
 * FamilyMember Schema — Links a Patient beneficiary to a User head-of-account
 */
const FamilyMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  relation: {
    type: String,
    enum: ['self', 'father', 'mother', 'child', 'spouse', 'sibling', 'other'],
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

FamilyMemberSchema.index({ userId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.models.FamilyMember || mongoose.model('FamilyMember', FamilyMemberSchema);
