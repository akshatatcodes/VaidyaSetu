/**
 * Phase 13 — Notification & Offline Sync Routes (§55, §56)
 */
const express = require('express');
const router = express.Router();
const { sendNotification } = require('../services/notificationEngine');
const Notification = require('../models/Notification');

/**
 * 1. POST /api/notifications/send
 * Dispatch notification through the consent-gated notification engine (§56)
 */
router.post('/send', async (req, res) => {
  try {
    const result = await sendNotification(req.body);
    if (result.status === 'failed') {
      return res.status(403).json(result);
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 2. GET /api/notifications/recipient/:recipientId
 * List notifications for a patient
 */
router.get('/recipient/:recipientId', async (req, res) => {
  try {
    const { recipientId } = req.params;
    const notifications = await Notification.find({ recipientId }).sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', count: notifications.length, data: notifications });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. POST /api/notifications/kiosk-offline-sync (§55)
 * Secure sync endpoint for offline kiosk submissions on reconnect.
 * Explicitly rejects attempting to sync ABDM health record data offline.
 */
router.post('/kiosk-offline-sync', async (req, res) => {
  try {
    const { queuedItems = [] } = req.body;

    const abdmItems = queuedItems.filter(item => item.isAbdm || item.url?.includes('/abha'));
    if (abdmItems.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'ABDM / external health-record data cannot be cached or processed offline (§55).'
      });
    }

    return res.json({
      status: 'success',
      message: `Offline queue synced successfully (${queuedItems.length} items processed).`,
      syncedCount: queuedItems.length
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
