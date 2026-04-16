require('dotenv').config();
const express = require('express');
const userRoutes = require('../src/routes/userRoutes');
const profileRoutes = require('../src/routes/profileRoutes');
const aiRoutes = require('../src/routes/aiRoutes');
const reportRoutes = require('../src/routes/reportRoutes');
const interactionRoutes = require('../src/routes/interactionRoutes');
const realtimeInteractionRoutes = require('../src/routes/realtimeInteractionRoutes');
const ragRoutes = require('../src/routes/ragRoutes');

const app = express();
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/interaction', interactionRoutes);
app.use('/api/interaction', realtimeInteractionRoutes);
app.use('/api/rag', ragRoutes);

function printRoutes(stack, prefix = '') {
  stack.forEach(r => {
    if (r.route) {
      const methods = Object.keys(r.route.methods).join(',').toUpperCase();
      console.log(`${methods} ${prefix}${r.route.path}`);
    } else if (r.name === 'router') {
      let routerPath = r.regexp.source
        .replace('\\/?(?=\\/|$)', '')
        .replace('^', '')
        .replace('\\/', '/');
      
      // Basic cleanup for regex source
      if (routerPath === '/api/user') routerPath = '/api/user'; // Example
      
      printRoutes(r.handle.stack, prefix + routerPath);
    }
  });
}

console.log('--- Registered Routes ---');
printRoutes(app._router.stack);
