const mongoose = require('mongoose');

/**
 * OCRExtraction Schema — Evidence-Linked OCR & Medical Entity Extraction (§7-8)
 */
const OCRExtractionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  rawOcrText: {
    type: String,
    required: true
  },
  extractedFields: [{
    field: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    confidence: { type: Number, default: 90 },
    sourceDocName: { type: String },
    docDate: { type: Date }
  }],
  languageDetected: {
    type: String,
    default: 'en'
  },
  extractedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.models.OCRExtraction || mongoose.model('OCRExtraction', OCRExtractionSchema);
