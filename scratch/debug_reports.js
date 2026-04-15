const mongoose = require('mongoose');
const UserProfile = require('./backend/src/models/UserProfile');
const Report = require('./backend/src/models/Report');
const DiseaseInsight = require('./backend/src/models/DiseaseInsight');
const Medication = require('./backend/src/models/Medication');

async function checkData() {
  await mongoose.connect('mongodb://localhost:27017/vaidyasetu');
  const clerkId = 'user_3CCUdC7v0RUJBqSIOIr3JKsd8Eh'; // Subagent's user
  
  const profile = await UserProfile.findOne({ clerkId });
  const reports = await Report.find({ clerkId }).sort({ createdAt: -1 });
  const insights = await DiseaseInsight.find({ clerkId });
  const medications = await Medication.find({ clerkId });

  console.log('--- PROFILE ---');
  console.log('Diabetes Answers in Profile:', profile?.questionnaireAnswers || 'None');
  console.log('Active Meds Count:', medications.length);

  console.log('--- INSIGHTS ---');
  insights.forEach(i => {
    console.log(`${i.diseaseId}: score=${i.riskScore}, category=${i.riskCategory}`);
  });

  console.log('--- REPORTS ---');
  reports.forEach((r, idx) => {
    console.log(`Report ${idx} (${r.createdAt}): diabetes=${r.risk_scores?.diabetes}, hypertension=${r.risk_scores?.hypertension}`);
  });

  await mongoose.disconnect();
}

checkData();
