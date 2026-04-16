const mongoose = require('mongoose');

const MitigationCompletionSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  diseaseId: {
    type: String,
    required: true,
    index: true
  },
  stepId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

MitigationCompletionSchema.index({ clerkId: 1, diseaseId: 1, stepId: 1 }, { unique: true });

module.exports = mongoose.model('MitigationCompletion', MitigationCompletionSchema);

