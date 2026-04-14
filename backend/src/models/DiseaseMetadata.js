const mongoose = require('mongoose');

const DiseaseMetadataSchema = new mongoose.Schema({
  diseaseId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  icon: String, // Emoji or icon identifier
  specialty: {
    type: String,
    required: true
  },
  alternativeSpecialists: [String],
  searchKeywords: [String],
  category: {
    type: String,
    index: true
  },
  priority: {
    type: Number,
    default: 0
  },
  sources: [String], // Clinical sources for attribution
  prevalenceBaseline: {
    ageGroups: mongoose.Schema.Types.Mixed,
    genderSplit: mongoose.Schema.Types.Mixed
  },
  normalRanges: mongoose.Schema.Types.Mixed, // Lab test value ranges
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DiseaseMetadata', DiseaseMetadataSchema);
