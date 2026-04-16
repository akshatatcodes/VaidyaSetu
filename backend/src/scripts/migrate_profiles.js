const mongoose = require('mongoose');
const dotenv = require('dotenv');
const UserProfile = require('../models/UserProfile');
const History = require('../models/History');

dotenv.config({ path: './backend/.env' }); 

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for migration');

    // Use lean() to get plain objects and avoid schema casting errors
    const users = await UserProfile.find({}).lean();
    console.log(`Found ${users.length} profiles to migrate.`);

    for (const rawData of users) {
      // Check if already migrated
      if (rawData.weight && typeof rawData.weight === 'object' && rawData.weight.value !== undefined) {
        console.log(`Skipping already migrated profile: ${rawData.clerkId}`);
        continue;
      }

      console.log(`Migrating profile: ${rawData.clerkId}`);
      const migratedData = { onboardingComplete: rawData.onboardingComplete || true };
      
      const fieldsToMigrate = [
        'age', 'gender', 'height', 'weight', 'bmi', 'bmiCategory',
        'activityLevel', 'sleepHours', 'stressLevel', 'isSmoker', 'alcoholConsumption',
        'dietType', 'sugarIntake', 'saltIntake', 'eatsLeafyGreens', 'eatsFruits', 'junkFoodFrequency',
        'allergies', 'medicalHistory', 'otherConditions'
      ];

      for (const field of fieldsToMigrate) {
        if (rawData[field] !== undefined) {
          migratedData[field] = {
            value: rawData[field],
            lastUpdated: rawData.createdAt || new Date(),
            updateType: 'initial',
            previousValue: null
          };
          
          // Log initial entry to History
          await History.create({
            clerkId: rawData.clerkId,
            field,
            newValue: rawData[field],
            changeType: 'initial',
            source: 'system',
            timestamp: rawData.createdAt || new Date()
          });
        }
      }

      // Update the user document raw to bypass schema validation of old fields
      await UserProfile.collection.replaceOne(
        { _id: rawData._id }, 
        { 
          ...migratedData, 
          clerkId: rawData.clerkId, 
          createdAt: rawData.createdAt,
          onboardingComplete: true 
        }
      );
      console.log(`Successfully migrated: ${rawData.clerkId}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
