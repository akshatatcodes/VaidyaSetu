const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

/**
 * @route GET /api/alerts/:clerkId
 * @desc  Fetch current notifications for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = { clerkId: req.params.clerkId };
    
    if (status) query.status = status;
    else query.status = { $ne: 'dismissed' }; // Default to non-dismissed

    if (priority) query.priority = priority;

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    res.json({ status: 'success', data: alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/alerts/:id/read
 * @desc  Mark an alert as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id, 
      { status: 'read' }, 
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ status: 'error', message: 'Alert not found' });
    }

    res.json({ status: 'success', data: alert });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/alerts/:id
 * @desc  Dismiss/delete an alert
 */
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id, 
      { status: 'dismissed' }, 
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ status: 'error', message: 'Alert not found' });
    }

    res.json({ status: 'success', message: 'Alert dismissed' });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/alerts
 * @desc  Internal helper to create alerts (e.g. from Safety Bridge)
 */
router.post('/', async (req, res) => {
  try {
    const alert = new Alert(req.body);
    await alert.save();
    res.status(201).json({ status: 'success', data: alert });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/alerts/:clerkId/count
 * @desc  Fetch count of unread alerts for badge display
 */
router.get('/:clerkId/count', async (req, res) => {
  try {
    const count = await Alert.countDocuments({ 
      clerkId: req.params.clerkId, 
      status: 'unread' 
    });
    res.json({ status: 'success', data: { count } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/alerts/:clerkId/summary
 * @desc  Fetch alert analytics (last 30 days)
 */
router.get('/:clerkId/summary', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alerts = await Alert.find({
      clerkId: req.params.clerkId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.priority === 'critical').length,
      high: alerts.filter(a => a.priority === 'high').length,
      unread: alerts.filter(a => a.status === 'unread').length
    };

    res.json({ status: 'success', data: summary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/alerts/:clerkId/read-all
 * @desc  Mark all unread alerts as read (bulk)
 */
router.patch('/:clerkId/read-all', async (req, res) => {
  try {
    const result = await Alert.updateMany(
      { clerkId: req.params.clerkId, status: 'unread' },
      { status: 'read' }
    );
    res.json({ status: 'success', message: `${result.modifiedCount} alerts marked as read` });
  } catch (error) {
    console.error('Bulk mark read error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route POST /api/alerts/:id/feedback
 * @desc  Submit relevance feedback for an alert
 */
router.post('/:id/feedback', async (req, res) => {
  try {
    const { rating } = req.body; // 'helpful' or 'not_helpful'
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { $set: { feedback: rating } },
      { new: true }
    );
    if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found' });
    res.json({ status: 'success', data: alert });
  } catch (error) {
    console.error('Alert feedback error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
