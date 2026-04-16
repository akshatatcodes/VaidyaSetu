const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  testName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  labName: {
    type: String,
    default: ''
  },
  resultValue: {
    type: mongoose.Schema.Types.Mixed, // Supports Numbers and complex results
    required: true
  },
  referenceRange: {
    type: String, // e.g. "70-100 mg/dL"
    default: ''
  },
  unit: {
    type: String,
    required: true
  },
  sampleDate: {
    type: Date,
    required: true,
    index: true
  },
  entryDate: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'manual'
  },
  reportRef: {
    type: String, // URL/Path to PDF report
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('LabResult', LabResultSchema);
