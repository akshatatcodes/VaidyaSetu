const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import Routes
const userRoutes = require('./src/routes/userRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const ocrRoutes = require('./src/routes/ocrRoutes');
const vitalsRoutes = require('./src/routes/vitalsRoutes');
const labRoutes = require('./src/routes/labRoutes');
const labExtractionRoutes = require('./src/routes/labExtractionRoutes');
const labAnalysisRoutes = require('./src/routes/labAnalysisRoutes');
const medicationRoutes = require('./src/routes/medicationRoutes');
const governanceRoutes = require('./src/routes/governanceRoutes');
const kioskRoutes = require('./src/routes/kioskRoutes');
const kioskExtensionRoutes = require('./src/routes/kioskExtensionRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const labWorkflowRoutes = require('./src/routes/labWorkflowRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const consentRoutes = require('./src/routes/consentRoutes');
const abhaRoutes = require('./src/routes/abhaRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const encounterRoutes = require('./src/routes/encounterRoutes');
const queueRoutes = require('./src/routes/queueRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const continuityRoutes = require('./src/routes/continuityRoutes');
const aiLayerRoutes = require('./src/routes/aiLayerRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const { resolveLanguage } = require('./src/middleware/languageResolver');
const { runReminderService } = require('./src/services/reminderService');
const initCronJobs = require('./src/scripts/cronJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(resolveLanguage);

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI is not set in environment variables! Please configure it in Render/cloud settings.');
} else {
  mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000 // Fail fast if cluster is unreachable instead of hanging requests
  })
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// Routes Configuration
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/lab-results', labRoutes);
app.use('/api/lab-results', labExtractionRoutes);
app.use('/api/lab-results', labAnalysisRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/kiosk', kioskExtensionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lab', labWorkflowRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/abha', abhaRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/encounters', encounterRoutes);
app.use('/api/routing', queueRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/continuity', continuityRoutes);
app.use('/api/ai', aiLayerRoutes);
app.use('/api/notifications', notificationRoutes);

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
  initCronJobs();
});
