const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserProfile = require('../src/models/UserProfile');
const History = require('../src/models/History');

async function backfill() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not found in environment");
    
    console.log('Connecting to Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const profiles = await UserProfile.find({});
    console.log(`Found ${profiles.length} profiles to process.`);

    for (const profile of profiles) {
      console.log(`Processing: ${profile.clerkId}`);
      
      const fields = [
        'name', 'age', 'gender', 'height', 'weight', 'bmi', 'bmiCategory',
        'activityLevel', 'sleepHours', 'stressLevel', 'isSmoker', 'alcoholConsumption',
        'dietType', 'sugarIntake', 'saltIntake', 'eatsLeafyGreens', 'eatsFruits', 'junkFoodFrequency',
        'allergies', 'medicalHistory', 'otherConditions'
      ];

      const historyEntries = [];
      for (const f of fields) {
        if (profile[f] && profile[f].value !== undefined) {
          // Check if initial log already exists for THIS specific field
          const hasInitial = await History.findOne({ clerkId: profile.clerkId, field: f, changeType: 'initial' });
          if (!hasInitial) {
            historyEntries.push({
              clerkId: profile.clerkId,
              field: f,
              oldValue: null,
              newValue: profile[f].value,
              changeType: 'initial',
              source: 'user',
              timestamp: profile[f].lastUpdated || profile.createdAt || new Date()
            });
          }
        }
      }

      if (historyEntries.length > 0) {
        await History.insertMany(historyEntries);
        console.log(`- Inserted ${historyEntries.length} initial history entries.`);
      }
    }

    console.log('Backfill complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during backfill:', err);
    process.exit(1);
  }
}

backfill();
