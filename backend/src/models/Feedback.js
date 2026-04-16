const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
  },
  context: {
    type: String, // e.g. "Diabetes Advice", "Interaction Explanation"
    required: true
  },
  query: String,
  response: String,
  rating: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
