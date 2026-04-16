const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const LabResult = require('../models/LabResult');

// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Images are allowed.'));
    }
  }
});

/**
 * @route POST /api/lab-results/upload
 * @desc  Upload a lab report file
 */
router.post('/upload', upload.single('report'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    res.json({ 
      status: 'success', 
      message: 'File uploaded successfully',
      fileUrl: `/uploads/reports/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/lab-results
 * @desc  Add a new laboratory test result
 */
router.post('/', async (req, res) => {
  try {
    const { 
      clerkId, testName, resultValue, referenceRange, 
      unit, sampleDate, source, reportRef 
    } = req.body;
    
    if (!clerkId || !testName || resultValue === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const newResult = new LabResult({
      clerkId, testName, resultValue, referenceRange, 
      unit, sampleDate, source, reportRef
    });

    await newResult.save();
    res.status(201).json({ status: 'success', data: newResult });
  } catch (error) {
    console.error('Add lab result error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/lab-results/:clerkId
 * @desc  Get history of lab results for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const results = await LabResult.find({ clerkId: req.params.clerkId })
      .sort({ sampleDate: -1 });

    res.json({ status: 'success', data: results });
  } catch (error) {
    console.error('Get lab results error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/lab-results/:clerkId/trends/:testName
 * @desc  Get numeric trends for a specific lab test over time
 */
router.get('/:clerkId/trends/:testName', async (req, res) => {
  try {
    const trends = await LabResult.find({ 
      clerkId: req.params.clerkId, 
      testName: req.params.testName 
    }).sort({ sampleDate: 1 });

    const data = trends.map(t => ({
      value: t.resultValue,
      date: t.sampleDate,
      unit: t.unit
    })).filter(t => typeof t.value === 'number');

    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/lab-results/:id
 * @desc  Delete a lab result
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await LabResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ status: 'error', message: 'Result not found' });
    res.json({ status: 'success', message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
