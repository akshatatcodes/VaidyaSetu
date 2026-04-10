const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  diabetes_advice: {
    type: String,
    required: true,
  },
  hypertension_advice: {
    type: String,
    required: true,
  },
  anemia_advice: {
    type: String,
    required: true,
  },
  general_tips: {
    type: String,
    required: true,
  },
  disclaimer: {
    type: String,
    required: true,
  },
  risk_scores: {
    diabetes: { type: Number, required: true },
    hypertension: { type: Number, required: true },
    anemia: { type: Number, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
