const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');

// STEP 63: Track Event
router.post('/track', async (req, res) => {
  try {
    const { clerkId, event, diseaseId, metadata } = req.body;
    
    if (!clerkId || !event) {
      return res.status(400).json({ status: 'error', message: 'clerkId and event are required' });
    }

    const entry = new Analytics({
      clerkId,
      event,
      diseaseId,
      metadata
    });

    await entry.save();
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Optionally: Get summary for dashboard
router.get('/summary/:clerkId', async (req, res) => {
  try {
    const stats = await Analytics.aggregate([
      { $match: { clerkId: req.params.clerkId } },
      { $group: { _id: '$event', count: { $sum: 1 } } }
    ]);
    res.json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
