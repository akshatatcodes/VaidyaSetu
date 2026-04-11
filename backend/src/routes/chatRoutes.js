const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// AI Symptom Chatbot
router.post('/symptom', async (req, res) => {
  try {
    const { clerkId, message, conversationHistory } = req.body;
    
    let profileContext = "";
    if (clerkId) {
      const [profile, report] = await Promise.all([
        UserProfile.findOne({ clerkId }),
        Report.findOne({ clerkId }).sort({ createdAt: -1 })
      ]);
      
      if (profile) {
        // Use .value for nested fields
        const age = profile.age?.value || 'unknown';
        const gender = profile.gender?.value || 'unknown';
        const conditions = profile.medicalHistory?.value || [];
        
        profileContext = `The user is a ${age}yo ${gender}. 
        They have the following conditions: ${conditions.join(', ') || 'None'}. 
        ${report ? `Their latest AI assessment summary: ${report.summary}` : ''}`;
      }
    }

    const systemPrompt = `You are VaidyaSetu's AI Symptom Assistant, a professional and empathetic healthcare bot.
    Provide preliminary insights into symptoms. Include a standard medical disclaimer.
    User Context: ${profileContext || 'No profile context available.'}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(conversationHistory || []),
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    res.json({
      status: 'success',
      reply: completion.choices[0]?.message?.content || "I apologize, but I am unable to process your request."
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
