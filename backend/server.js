const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Routes
const userRoutes = require('./src/routes/userRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const interactionRoutes = require('./src/routes/interactionRoutes');
const realtimeInteractionRoutes = require('./src/routes/realtimeInteractionRoutes');
const ragRoutes = require('./src/routes/ragRoutes');
const fitnessRoutes = require('./src/routes/fitnessRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const feedbackRoutes = require('./src/routes/feedbackRoutes');
const ocrRoutes = require('./src/routes/ocrRoutes');
const vitalsRoutes = require('./src/routes/vitalsRoutes');
const labRoutes = require('./src/routes/labRoutes');
const labExtractionRoutes = require('./src/routes/labExtractionRoutes');
const labAnalysisRoutes = require('./src/routes/labAnalysisRoutes');
const goalsRoutes = require('./src/routes/goalsRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const preferenceRoutes = require('./src/routes/preferenceRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const governanceRoutes = require('./src/routes/governanceRoutes');
const diseaseRoutes = require('./src/routes/diseaseRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const { runReminderService } = require('./src/services/reminderService');
const initCronJobs = require('./src/scripts/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes Configuration
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/interaction', interactionRoutes);
app.use('/api/interaction', realtimeInteractionRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/fitness', fitnessRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/lab-results', labRoutes);
app.use('/api/lab-results', labExtractionRoutes);
app.use('/api/lab-results', labAnalysisRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/diseases', diseaseRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'VaidyaSetu Backend is modular and running.',
    db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the background monitoring heartbeat (Step 59, 60)
  runReminderService();
  initCronJobs(); // Step 86: Start background cron jobs
  
  // RAG Pipeline Integrity Check
  try {
    const { retrieveRelevantKnowledge } = require('./src/utils/ragRetriever');
    if (typeof retrieveRelevantKnowledge === 'function') {
      console.log('✅ RAG Engine: Module loaded successfully.');
    }
  } catch (err) {
    console.error('❌ RAG Engine: Integrity check failed:', err.message);
  }
});
