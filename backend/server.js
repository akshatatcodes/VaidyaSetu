const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { analyzeProfile } = require('./services/ruleEngine');
const { generateAIInsight, extractMedicinesFromOCR } = require('./services/aiExplainer');
const { extractFromImage } = require('./services/gemini');
const { getDrugDetails } = require('./services/rxnav');
const { getFDAWarnings } = require('./services/openfda');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vaidyasetu';

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB (VaidyaSetu)'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'VaidyaSetu Backend is running!' });
});

// Phase 2: Static Engine Analyzer Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { diseases, medicines, language } = req.body;
    const userDiseases = Array.isArray(diseases) ? diseases : [];
    const userMedicines = Array.isArray(medicines) ? medicines : [];
    const targetLang = language || 'English';

    // 1. Static Rule Engine ( AYUSH / Local Checks )
    const report = await analyzeProfile(userDiseases, userMedicines);
    
    // 2. Live Clinical Data Fetch ( RxNav + openFDA )
    const liveData = [];
    for (const med of userMedicines) {
      try {
        const [rx, fda] = await Promise.all([getDrugDetails(med), getFDAWarnings(med)]);
        liveData.push({ name: med, composition: rx.composition, warnings: fda.warnings, interactions: fda.interactions });
      } catch (e) { console.warn(`Live data fail for ${med}`); }
    }

    // 3. Phase 6: Feed hybrid data into Llama 3 for Multilingual Insight
    const aiResponse = await generateAIInsight(report, liveData, targetLang);
    
    // Attach and return structure matching Mediscan's enriched output
    report.aiInsight = aiResponse.explanation;
    report.alternatives = aiResponse.alternatives;
    report.liveData = liveData;

    res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    console.error('Analyzer Error:', error);
    res.status(500).json({ status: 'error', message: 'Engine processing failed' });
  }
});

// GET Lists for AJAX Dropdowns
app.get('/api/lists/diseases', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/diseases.json'), 'utf8'));
    res.json(data.map(d => d.name));
  } catch(e) { res.status(500).json([]); }
});

app.get('/api/lists/medicines', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/medicines.json'), 'utf8'));
    res.json(data.map(m => m.name));
  } catch(e) { res.status(500).json([]); }
});

// GET User Profile
app.get('/api/user/:clerkId', async (req, res) => {
  try {
    let user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      user = new User({ clerkId: req.params.clerkId });
      await user.save();
    }
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST Update User Profile
app.post('/api/user/update', async (req, res) => {
  try {
    const { clerkId, age, height, weight, diseases, medicines, onboardingComplete } = req.body;
    const user = await User.findOneAndUpdate(
      { clerkId },
      { $set: { age, height, weight, diseases, medicines, onboardingComplete } },
      { returnDocument: 'after', upsert: true }
    );
    res.json({ status: 'success', data: user });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Phase 5: Smart OCR API Upload
app.post('/api/ocr', upload.single('prescription'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image provided for OCR.' });
    }

    // Single call to the Triple-Fallback Engine (Gemini -> Groq -> Local)
    const medicines = await extractFromImage(req.file.buffer, req.file.mimetype);
    
    res.json({ status: 'success', data: medicines });
  } catch (error) {
    console.error('OCR Pipeline Critical Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Medicine extraction system failed.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
