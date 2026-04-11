const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  age: { type: Number },
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  diseases: { type: [String], default: [] },
  customDiseases: { type: [String], default: [] }, // User-specified ones not in DB
  medicines: { type: [String], default: [] },
  exerciseFrequency: { type: String, default: 'Not Specified' }, // e.g. Daily, Weekly, None
  dietType: { type: String, default: 'Not Specified' }, // e.g. Vegetarian, Non-Veg, Vegan
  onboardingComplete: { type: Boolean, default: false },
  lastProfileUpdate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
