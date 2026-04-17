const express = require('express');
const router = express.Router();
const axiosNode = require('axios');
const Vital = require('../models/Vital');
const STEPS_AGGREGATE_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset/aggregate';

async function aggregateDailySteps(accessToken, startTimeMillis, endTimeMillis) {
  const aggregateByVariants = [
    [{ dataTypeName: 'com.google.step_count.delta' }],
    [{ dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' }],
    [{ dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas' }]
  ];

  for (const aggregateBy of aggregateByVariants) {
    try {
      const body = {
        aggregateBy,
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      };
      const res = await axiosNode.post(STEPS_AGGREGATE_URL, body, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      let steps = 0;
      if (Array.isArray(res.data?.bucket)) {
        res.data.bucket.forEach((b) => {
          (b.dataset || []).forEach((ds) => {
            (ds.point || []).forEach((p) => {
              steps += p?.value?.[0]?.intVal || 0;
            });
          });
        });
      }
      if (steps > 0) return steps;
    } catch (err) {
      console.warn('[Fitness] Step aggregate variant failed:', err.response?.data?.error?.message || err.message);
    }
  }

  return 0;
}
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
 * @route POST /api/fitness/steps
 * @desc  Sync daily step count from Google Fit
 */
router.post('/steps', async (req, res) => {
  try {
    const { clerkId, accessToken } = req.body;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = now.getTime();
    
    const startTimeNs = startOfDay * 1000000;
    const endTimeNs = endOfDay * 1000000;

    const totalSteps = await aggregateDailySteps(accessToken, startOfDay, endOfDay);

    if (totalSteps > 0) {
      // Update or create step count for today
      await Vital.findOneAndUpdate(
        { clerkId, type: 'steps', timestamp: { $gte: new Date(startOfDay) } },
        { clerkId, type: 'steps', value: totalSteps, unit: 'Steps', source: 'google_fit', timestamp: new Date() },
        { upsert: true, new: true }
      );
    }

    res.json({ status: 'success', data: { steps: totalSteps } });
  } catch (error) {
    console.error('Steps sync error:', error);
    res.status(500).json({ status: 'error', message: 'Steps sync failed', detail: error.message });
  }
});

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

    // 4. Sync Steps (for current day)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todaySteps = await aggregateDailySteps(accessToken, startOfToday, endOfDay);

    if (todaySteps > 0) {
      await Vital.findOneAndUpdate(
        { clerkId, type: 'steps', timestamp: { $gte: new Date(startOfToday) } },
        { clerkId, type: 'steps', value: todaySteps, unit: 'Steps', source: 'device_sync', timestamp: new Date() },
        { upsert: true, new: true }
      );
    }

    res.json({ status: 'success', message: 'Fitness data (Steps, HR, Weight, Sleep) synced successfully', data: { steps: todaySteps } });
  } catch (error) {
    console.error('Extended sync error:', error);
    res.status(500).json({ status: 'error', message: 'Extended fitness sync failed', detail: error.message });
  }
});

module.exports = router;
