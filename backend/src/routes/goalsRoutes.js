const express = require('express');
const router = express.Router();
const HealthGoal = require('../models/HealthGoal');

/**
 * @route POST /api/goals
 * @desc  Create a new health goal
 */
router.post('/', async (req, res) => {
  try {
    const { 
      clerkId, goalType, targetValue, progressValue, 
      unit, startDate, targetDate 
    } = req.body;
    
    if (!clerkId || !goalType || targetValue === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    const newGoal = new HealthGoal({
      clerkId, goalType, targetValue, progressValue, 
      unit, startDate, targetDate
    });

    await newGoal.save();
    res.status(201).json({ status: 'success', data: newGoal });
  } catch (error) {
    console.error('Add goal error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/goals/:clerkId
 * @desc  Get all goals for a user
 */
router.get('/:clerkId', async (req, res) => {
  try {
    const goals = await HealthGoal.find({ clerkId: req.params.clerkId })
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: goals });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route PATCH /api/goals/:id
 * @desc  Update goal progress or status
 */
router.patch('/:id', async (req, res) => {
  try {
    const { progressValue, status } = req.body;
    
    const goal = await HealthGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ status: 'error', message: 'Goal not found' });
    }

    if (progressValue !== undefined) goal.progressValue = progressValue;
    if (status) goal.status = status;

    // Auto-complete goal if progress meets target
    if (goal.progressValue >= goal.targetValue) {
        goal.status = 'achieved';
    }

    await goal.save();
    res.json({ status: 'success', data: goal });
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route GET /api/goals/:clerkId/summary
 * @desc  Get a summary of goal progress for the dashboard
 */
router.get('/:clerkId/summary', async (req, res) => {
  try {
    const goals = await HealthGoal.find({ clerkId: req.params.clerkId });
    const summary = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      achieved: goals.filter(g => g.status === 'achieved').length,
      nearCompletion: goals.filter(g => g.status === 'active' && (g.progressValue / g.targetValue) >= 0.8).length
    };
    res.json({ status: 'success', data: summary });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

/**
 * @route DELETE /api/goals/:id
 * @desc  Abandon/Delete a goal
 */
router.delete('/:id', async (req, res) => {
  try {
    const goal = await HealthGoal.findByIdAndDelete(req.params.id);
    if (!goal) return res.status(404).json({ status: 'error', message: 'Goal not found' });
    res.json({ status: 'success', message: 'Goal removed' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
