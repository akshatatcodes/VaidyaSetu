const mongoose = require('mongoose');

const HealthGoalSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    index: true
  },
  goalType: {
    type: String,
    required: true,
    enum: [
      'daily_steps', 
      'daily_water', 
      'weight_goal', 
      'sleep_target', 
      'bp_target',
      'glucose_control'
    ],
    index: true
  },
  targetValue: {
    type: Number,
    required: true
  },
  progressValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'achieved', 'abandoned'],
    default: 'active',
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('HealthGoal', HealthGoalSchema);
