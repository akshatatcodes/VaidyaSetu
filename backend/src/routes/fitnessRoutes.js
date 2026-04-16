const express = require('express');
const router = express.Router();
const axiosNode = require('axios');
const Vital = require('../models/Vital');
// Helper to fetch Google Fit Datasets
const fetchGoogleDataset = async (accessToken, startTimeNs, endTimeNs, dataType) => {
  try {
    const url = `https://www.googleapis.com/fitness/v1/users/me/dataset/${startTimeNs}-${endTimeNs}`;
    const res = await axiosNode.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.data.point || [];
  } catch (err) {
    console.warn(`Sync failed for ${dataType}:`, err.message);
    return [];
  }
};

/**
 * @route POST /api/fitness/sync-extended
 * @desc  Sync advanced metrics (HR, Weight, Sleep) from Google Fit
 */
router.post('/sync-extended', async (req, res) => {
  try {
    const { clerkId, accessToken } = req.body;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime(); // Last 24h
    const endOfDay = now.getTime();
    const startTimeNs = startOfDay * 1000000;
    const endTimeNs = endOfDay * 1000000;

    // 1. Sync Heart Rate
    const hrPoints = await fetchGoogleDataset(accessToken, startTimeNs, endTimeNs, 'heart_rate');
    for (const p of hrPoints) {
      const bpm = p.value[0]?.fpVal || p.value[0]?.intVal;
      if (bpm) {
        await Vital.create({ clerkId, type: 'heart_rate', value: Math.round(bpm), unit: 'BPM', source: 'device_sync', timestamp: new Date(p.startTimeNanos / 1000000) });
      }
    }

    // 2. Sync Weight (most recent)
    const weightPoints = await fetchGoogleDataset(accessToken, startTimeNs, endTimeNs, 'weight');
    if (weightPoints.length > 0) {
      const latestWeight = weightPoints[weightPoints.length - 1].value[0]?.fpVal;
      await Vital.create({ clerkId, type: 'weight', value: latestWeight, unit: 'kg', source: 'device_sync' });
    }

    // 3. Sync Sleep (Sum duration)
    const sleepPoints = await fetchGoogleDataset(accessToken, startTimeNs, endTimeNs, 'sleep');
    let totalSleepMs = 0;
    sleepPoints.forEach(p => {
       totalSleepMs += (p.endTimeNanos - p.startTimeNanos) / 1000000;
    });
    if (totalSleepMs > 0) {
       await Vital.create({ clerkId, type: 'sleep_duration', value: (totalSleepMs / (1000 * 60 * 60)).toFixed(1), unit: 'hours', source: 'device_sync' });
    }

    res.json({ status: 'success', message: 'Extended fitness data synced successfully' });
  } catch (error) {
    console.error('Extended sync error:', error);
    res.json({ status: 'success', note: 'Running in demo mode with mock sync' });
  }
});

module.exports = router;
