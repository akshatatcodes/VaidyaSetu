const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Report = require('../models/Report');
const InteractionHistory = require('../models/InteractionHistory');
const Feedback = require('../models/Feedback');

// Get Latest Report
router.get('/:clerkId', async (req, res) => {
  try {
    const clerkId = req.params.clerkId;
    const [report, profile] = await Promise.all([
      Report.findOne({ clerkId }).sort({ createdAt: -1 }),
      UserProfile.findOne({ clerkId })
    ]);

    if (!report) {
      return res.status(404).json({ status: 'not_found', message: 'Report not found' });
    }

    // Integrated response
    res.json({ 
      status: 'success', 
      data: {
        ...report.toObject(),
        userProfile: profile || {}
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
