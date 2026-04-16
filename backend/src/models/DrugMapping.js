const mongoose = require('mongoose');

const drugMappingSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  brand_aliases: [{
    type: String,
    index: true
  }],
  generic_name: {
    type: String,
    required: true,
    index: true
  },
  strength: String,
  combination_drug: {
    type: Boolean,
    default: false
  },
  components: [String], // For combination drugs
  manufacturer: String,
  category: {
    type: String,
    enum: ['Allopathy', 'Ayurveda', 'Homeopathy'],
    default: 'Allopathy'
  }
}, { timestamps: true });

// Create text index for fuzzy/search support at DB level if needed
drugMappingSchema.index({ brand_name: 'text', brand_aliases: 'text', generic_name: 'text' });

module.exports = mongoose.model('DrugMapping', drugMappingSchema);
