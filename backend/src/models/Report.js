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
  // Dynamic Map for disease-specific advice (e.g., { "thyroid": "...", "diabetes": "..." })
  advice: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  general_tips: {
    type: String,
    required: true,
  },
  disclaimer: {
    type: String,
    required: true,
  },
  // Dynamic Map for risk scores
  risk_scores: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Per-disease provenance/verification metadata aligned with risk_scores keys
  risk_score_meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Category-level insights (e.g., { "metabolic": "...", "cardio": "..." })
  category_insights: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Per-disease mitigations (exercise, diet, lifestyle, precautions)
  mitigations: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toObject: { flattenMaps: true },
  toJSON: { flattenMaps: true }
});

module.exports = mongoose.model('Report', reportSchema);
