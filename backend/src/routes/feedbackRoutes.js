const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const InteractionHistory = require('../models/InteractionHistory');

// Save Feedback
router.post('/', async (req, res) => {
  try {
    const { clerkId, context, query, response, rating } = req.body;
    const feedback = await Feedback.create({ clerkId, context, query, response, rating });
    res.json({ status: 'success', data: feedback });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// User Data Export (moved here from server.js)
router.get('/export/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [profile, reports, interactions, feedbacks] = await Promise.all([
      UserProfile.findOne({ clerkId }),
      Report.find({ clerkId }),
      InteractionHistory.find({ clerkId }),
      Feedback.find({ clerkId })
    ]);

    res.json({ 
      status: 'success', 
      data: { profile, reports, interactions, feedbacks, exportDate: new Date() } 
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
