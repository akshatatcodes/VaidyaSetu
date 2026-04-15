const mongoose = require('mongoose');

const FactorSchema = new mongoose.Schema({
  id: String,
  name: String,
  displayValue: String,
  rawValue: mongoose.Schema.Types.Mixed,
  impact: Number, // Percentage impact
  direction: {
    type: String,
    enum: ['increase', 'decrease']
  },
  explanation: String,
  category: {
    type: String,
    enum: ['symptom', 'demographic', 'lifestyle', 'lab']
  },
  source: String // e.g., 'user_profile', 'lab_report'
}, { _id: false });

const MitigationSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low']
  },
  category: {
    type: String,
    enum: ['medical', 'lifestyle', 'dietary', 'monitoring', 'precaution']
  },
  timeframe: String,
  applicabilityRules: mongoose.Schema.Types.Mixed,
  isRegional: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const DiseaseInsightSchema = new mongoose.Schema({
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
  riskScore: {
    type: Number,
    required: true
  },
  riskCategory: {
    type: String,
    enum: ['N/A', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'],
    required: true
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  algorithmVersion: {
    type: String,
    default: '1.0.0'
  },
  factorBreakdown: [FactorSchema],
  protectiveFactors: [FactorSchema],
  missingDataFactors: [FactorSchema],
  mitigationSteps: [MitigationSchema],
  dataCompleteness: {
    type: Number, // Percentage
    default: 0
  },
  reviewedAt: {
    type: Date
  },
  rawInputData: mongoose.Schema.Types.Mixed, // Snapshot of data used for this calc
  // Questionnaire data
  questionnaireAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  questionnaireCompletedAt: {
    type: Date,
    default: null
  },
  questionnaireVersion: {
    type: String,
    default: '1.0.0'
  }
});

// Compound index for unique user-disease insights
DiseaseInsightSchema.index({ clerkId: 1, diseaseId: 1 }, { unique: true });
// Index for recency sorting
DiseaseInsightSchema.index({ lastCalculated: -1 });

module.exports = mongoose.model('DiseaseInsight', DiseaseInsightSchema);
