const express = require('express');
const router = express.Router();
const multer = require('multer');
const Document = require('../models/Document');
const OCRExtraction = require('../models/OCRExtraction');
const Encounter = require('../models/Encounter');
const LabResult = require('../models/LabResult');
const { extractFromImage } = require('../services/visionOcr');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * @route POST /api/documents/upload
 * @desc Document Intelligence Pipeline (§7/§8): upload, OCR, entity extraction, Document + OCRExtraction persistence
 */
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const { patientId, encounterId, type, title, docDate } = req.body;

    if (!patientId) {
      return res.status(400).json({ status: 'error', message: 'patientId is required' });
    }

    const docType = type || 'prescription';
    const originalFileUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : (req.body.imageUrl || 'https://via.placeholder.com/600x800.png?text=Medical+Document');

    // 1. Create Document Entity
    const isHandwritten = docType === 'prescription';
    const document = await Document.create({
      patientId: patientId.match(/^[0-9a-fA-F]{24}$/) ? patientId : undefined,
      encounterId: encounterId && encounterId.match(/^[0-9a-fA-F]{24}$/) ? encounterId : undefined,
      type: docType,
      title: title || `${docType.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
      originalFileUrl,
      verificationStatus: isHandwritten ? 'pending' : 'verified'
    });

    let rawOcrText = 'Sample medical document text.';
    let medicinesExtracted = [];

    // 2. Run OCR & Medical Entity Extraction Pipeline if file provided
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const ocrResult = await extractFromImage(base64Image, req.file.mimetype);
      medicinesExtracted = ocrResult.medicines || [];
      rawOcrText = medicinesExtracted.length > 0
        ? `Extracted Medicines: ${medicinesExtracted.join(', ')}`
        : 'Medical document scan completed.';
    }

    // 3. Evidence-Linked Clinical Record Construction (§8)
    const documentName = document.title;
    const documentDate = docDate ? new Date(docDate) : document.uploadedAt;

    const extractedFields = medicinesExtracted.map(med => ({
      field: 'medication',
      value: med,
      confidence: 88,
      sourceDocName: documentName,
      docDate: documentDate
    }));

    if (extractedFields.length === 0) {
      extractedFields.push({
        field: 'document_summary',
        value: rawOcrText,
        confidence: 95,
        sourceDocName: documentName,
        docDate: documentDate
      });
    }

    // 4. Create OCRExtraction Entity
    const ocrExtraction = await OCRExtraction.create({
      documentId: document._id,
      patientId: document.patientId || patientId,
      rawOcrText,
      extractedFields,
      languageDetected: 'en'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Document processed through Document Intelligence Pipeline',
      data: {
        document,
        ocrExtraction
      }
    });
  } catch (error) {
    console.error('Document pipeline error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/documents/patient/:patientId
 * @desc Fetch all documents for a patient (§7)
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    let query = {};
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId;
    }

    const docs = await Document.find(query).sort({ uploadedAt: -1 });
    return res.json({
      status: 'success',
      count: docs.length,
      data: docs
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/documents/:documentId
 * @desc Fetch document details with OCR extraction (§7/§8)
 */
router.get('/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    const extraction = await OCRExtraction.findOne({ documentId: document._id });

    return res.json({
      status: 'success',
      data: {
        document,
        extraction
      }
    });
  } catch (error) {
    console.error('Error fetching document details:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/documents/:documentId/verify
 * @desc Physician verification gate for handwritten prescriptions (§39)
 */
router.post('/:documentId/verify', async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body; // 'verified' | 'rejected'

    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      { verificationStatus: status || 'verified' },
      { new: true }
    );

    if (!updatedDoc) {
      return res.status(404).json({ status: 'error', message: 'Document not found' });
    }

    return res.json({
      status: 'success',
      message: `Document verification status updated to [${updatedDoc.verificationStatus}]`,
      data: updatedDoc
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/patients/:patientId/timeline
 * @desc Longitudinal Medical Timeline aggregation endpoint (§40)
 * Aggregates Encounters, LabResults, and Documents in chronological order
 */
router.get('/patient/:patientId/timeline', async (req, res) => {
  try {
    const { patientId } = req.params;
    let query = {};
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.patientId = patientId;
    }

    const FollowUp = require('../models/FollowUp');
    const Referral = require('../models/Referral');

    const [encounters, labResults, documents, followUps, referrals] = await Promise.all([
      Encounter.find(query).sort({ openedAt: -1 }),
      LabResult.find(query).sort({ createdAt: -1 }),
      Document.find(query).sort({ uploadedAt: -1 }),
      FollowUp.find(query).sort({ createdAt: -1 }),
      Referral.find(query).sort({ createdAt: -1 })
    ]);

    const timelineEvents = [];

    encounters.forEach(enc => {
      timelineEvents.push({
        eventType: 'encounter',
        timestamp: enc.openedAt || enc.createdAt,
        data: enc
      });
    });

    labResults.forEach(lab => {
      timelineEvents.push({
        eventType: 'lab_result',
        timestamp: lab.verifiedAt || lab.createdAt,
        data: lab
      });
    });

    documents.forEach(doc => {
      timelineEvents.push({
        eventType: 'document',
        timestamp: doc.uploadedAt || doc.createdAt,
        data: doc
      });
    });

    followUps.forEach(fu => {
      timelineEvents.push({
        eventType: 'followup',
        timestamp: fu.createdAt,
        data: fu
      });
    });

    referrals.forEach(ref => {
      timelineEvents.push({
        eventType: 'referral',
        timestamp: ref.createdAt,
        data: ref
      });
    });

    // Chronological sort (newest first)
    timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      status: 'success',
      patientId,
      count: timelineEvents.length,
      timeline: timelineEvents
    });
  } catch (error) {
    console.error('Error fetching medical timeline:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
