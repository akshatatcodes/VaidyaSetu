const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Groq Setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Routes
app.get('/api/health', async (req, res) => {
  try {
    // Basic connectivity test for Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Hello, respond with a short greeting and confirm you are VaidyaSetu AI.',
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    res.json({
      status: 'healthy',
      message: 'Backend is running and connected to Groq.',
      groq_response: completion.choices[0]?.message?.content || '',
      db_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
