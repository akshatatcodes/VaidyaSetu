/**
 * ApiCache Mongoose Model (Step 40)
 * Stores RxNav and OpenFDA API responses to avoid redundant calls.
 * TTL: 24 hours (86400 seconds) via MongoDB TTL Index on `createdAt`.
 */

const mongoose = require('mongoose');

const ApiCacheSchema = new mongoose.Schema({
  // The cache key - a normalized string of the query
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // The source API that produced this response
  source: {
    type: String,
    enum: ['rxnav', 'openfda', 'combined'],
    required: true
  },

  // The actual cached response payload
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // TTL: MongoDB automatically deletes documents 24 hours after creation
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  }
});

module.exports = mongoose.model('ApiCache', ApiCacheSchema);
