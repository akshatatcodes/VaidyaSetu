const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const History = require('../src/models/History');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const clerkId = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh';
  const data = await History.find({ clerkId });
  console.log(`History for ${clerkId}:`, JSON.stringify(data, null, 2));
  process.exit(0);
}
check();
