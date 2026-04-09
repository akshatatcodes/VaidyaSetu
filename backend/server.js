const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { analyzeProfile } = require('./services/ruleEngine');
const { generateAIInsight } = require('./services/aiExplainer');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

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
    const { diseases, medicines } = req.body;
    const userDiseases = Array.isArray(diseases) ? diseases : [];
    const userMedicines = Array.isArray(medicines) ? medicines : [];

    const report = await analyzeProfile(userDiseases, userMedicines);
    
    // Phase 3: Feed static report into Llama 3 for biological explanation
    const aiInsight = await generateAIInsight(report);
    
    // Attach and return hybrid structure
    report.aiInsight = aiInsight;
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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
