const mongoose = require('mongoose');

const interactionHistorySchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
  },
  inputMedicines: [String],
  confirmedMedicines: [String],
  foundInteractions: [{
    allopathy_drug: String,
    ayurveda_herb: [String],
    homeopathy_remedy: [String],
    severity: String,
    effect: String,
    mechanism: String,
    recommendation: String,
    source: String,
    ai_explanation: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InteractionHistory', interactionHistorySchema);
