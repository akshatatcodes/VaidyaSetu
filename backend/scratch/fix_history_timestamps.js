const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const History = require('../src/models/History');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const clerkId = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';
  const logs = await History.find({ clerkId });
  
  console.log(`Fixing ${logs.length} logs for ${clerkId}...`);

  for (const log of logs) {
    let newTime = log.timestamp;

    if (log.changeType === 'initial') {
      // Set initial logs to early morning
      newTime = new Date('2026-04-11T04:00:00.000Z');
    } else if (log.field === 'weight') {
      if (log.newValue === 82) {
        newTime = new Date('2026-04-11T12:00:00.000Z');
      } else if (log.newValue === 95) {
        newTime = new Date('2026-04-11T13:00:00.000Z');
      }
    } else if (log.changeType === 'sync' || (log.changeType === 'real_change' && log.field !== 'weight')) {
       // Set any other sync/real changes to slightly after initial
       newTime = new Date('2026-04-11T11:00:00.000Z');
    }

    log.timestamp = newTime;
    await log.save();
  }

  console.log('Fix complete.');
  process.exit(0);
}
fix();
