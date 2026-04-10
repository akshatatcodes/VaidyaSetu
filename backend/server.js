const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const UserProfile = require('./src/models/UserProfile');
const Report = require('./src/models/Report');
const { calculatePreliminaryRisk } = require('./src/utils/riskScorer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Groq Setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Basic connectivity test for Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello, respond with a short greeting and confirm you are VaidyaSetu AI.',
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    res.json({
      status: 'healthy',
      message: 'Backend is running and connected to Groq.',
      groq_response: completion.choices[0]?.message?.content || '',
      db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Profile Save Route
app.post('/api/user/profile', async (req, res) => {
  try {
    const profileData = req.body;
    const { clerkId } = profileData;

    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { clerkId },
      { ...profileData, onboardingComplete: true },
      { new: true, upsert: true }
    );

    res.json({
      status: 'success',
      message: 'Profile saved successfully',
      data: profile
    });
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/user/:clerkId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ clerkId: req.params.clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'not_found', message: 'Profile not found' });
    }
    res.json({ status: 'success', data: profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Generate AI Report
app.post('/api/ai/generate-report', async (req, res) => {
  try {
    const { clerkId } = req.body;
    if (!clerkId) {
      return res.status(400).json({ status: 'error', message: 'clerkId is required' });
    }

    const profile = await UserProfile.findOne({ clerkId });
    if (!profile) {
      return res.status(404).json({ status: 'error', message: 'User profile not found' });
    }

    // Run Rule-Based Scorer
    const riskScores = calculatePreliminaryRisk(profile);

    // Call Groq
    const prompt = `
    You are VaidyaSetu AI, a compassionate health assistant for Indian users. 
    Analyze this user profile and preliminary risk scores.
    Profile: ${JSON.stringify(profile)}
    Risk Scores (0-100): ${JSON.stringify(riskScores)}
    
    Output a valid JSON object matching exactly this schema, without any backticks or markdown formatting around it:
    {
      "summary": "2-sentence warm, slightly clinical summary of their health status",
      "diabetes_advice": "Actionable advice based on their diabetes risk",
      "hypertension_advice": "Actionable advice based on their hypertension risk",
      "anemia_advice": "Actionable advice based on their anemia risk (contextual to diet/gender)",
      "general_tips": "2-3 short bullet points of general lifestyle advice, formatted as a single string with '\\n' for newlines",
      "disclaimer": "Standard short medical disclaimer"
    }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    let aiData;
    try {
      aiData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error("Groq JSON Parse error:", parseError, completion.choices[0].message.content);
      return res.status(500).json({ status: 'error', message: 'Failed to parse AI response' });
    }

    // Save report to MongoDB
    const reportData = {
      clerkId,
      summary: aiData.summary,
      diabetes_advice: aiData.diabetes_advice,
      hypertension_advice: aiData.hypertension_advice,
      anemia_advice: aiData.anemia_advice,
      general_tips: aiData.general_tips,
      disclaimer: aiData.disclaimer,
      risk_scores: riskScores,
      createdAt: new Date()
    };

    const savedReport = await Report.findOneAndUpdate(
      { clerkId },
      reportData,
      { new: true, upsert: true }
    );

    res.json({ status: 'success', data: savedReport });
  } catch (error) {
    console.error('AI Report generation error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get Latest Report
app.get('/api/reports/:clerkId', async (req, res) => {
  try {
    const report = await Report.findOne({ clerkId: req.params.clerkId });
    if (!report) {
      return res.status(404).json({ status: 'not_found', message: 'Report not found' });
    }
    res.json({ status: 'success', data: report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
