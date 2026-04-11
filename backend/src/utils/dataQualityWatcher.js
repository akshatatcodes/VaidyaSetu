/**
 * Calculates the Data Quality Score based on Completeness, Freshness, and Validity.
 * @param {Object} profile - The user profile object (nested schema)
 * @returns {Object} { score, label, message }
 */
const calculateDataQuality = (profile) => {
  if (!profile) return { score: 0, label: 'Basic', message: 'No profile data found.' };

  const coreFields = [
    'age', 'gender', 'weight', 'height', 
    'activityLevel', 'sleepHours', 'stressLevel', 'isSmoker', 'alcoholConsumption',
    'dietType', 'allergies', 'medicalHistory'
  ];

  // 1. Completeness Score (out of 40)
  let completedCount = 0;
  coreFields.forEach(field => {
    if (profile[field] && profile[field].value !== undefined && profile[field].value !== null) {
      if (Array.isArray(profile[field].value)) {
        if (profile[field].value.length > 0) completedCount++;
      } else if (profile[field].value !== '') {
        completedCount++;
      }
    }
  });
  const completenessScore = (completedCount / coreFields.length) * 40;

  // 2. Freshness Score (out of 30)
  // Check the most recent update across core fields
  let latestUpdate = profile.createdAt || new Date(0);
  coreFields.forEach(field => {
    if (profile[field] && profile[field].lastUpdated) {
      const updateDate = new Date(profile[field].lastUpdated);
      if (updateDate > latestUpdate) latestUpdate = updateDate;
    }
  });

  const now = new Date();
  const diffDays = (now - latestUpdate) / (1000 * 60 * 60 * 24);
  
  let freshnessScore = 0;
  if (diffDays <= 30) {
    freshnessScore = 30;
  } else if (diffDays <= 90) {
    freshnessScore = 15;
  } else {
    freshnessScore = 0;
  }

  // 3. Validity Score (out of 30)
  let validityScore = 0;
  
  // Award points for verified sources (Google Fit)
  // We check if any field has updateType 'sync'
  const hasSyncData = coreFields.some(field => profile[field] && profile[field].updateType === 'sync');
  if (hasSyncData) validityScore += 15;

  // Health Plausibility (Basic check for demonstration)
  // e.g., Height/Weight in reasonable ranges
  const isPlausible = (
    profile.height?.value > 50 && profile.height?.value < 250 &&
    profile.weight?.value > 10 && profile.weight?.value < 300
  );
  if (isPlausible) validityScore += 15;

  const totalScore = Math.round(completenessScore + freshnessScore + validityScore);

  let label = 'Basic';
  let message = 'Your risk assessment is based on limited information. To get a more accurate and personalized report, please complete the missing sections in your profile.';

  if (totalScore >= 85) {
    label = 'Excellent';
    message = 'Your profile is comprehensive and up-to-date. Your risk assessments are based on high-quality information.';
  } else if (totalScore >= 60) {
    label = 'Good';
    message = 'Your profile provides a solid foundation. To get more precise insights, try connecting Google Fit or updating information that hasn\'t been refreshed in a while.';
  }

  return { 
    score: totalScore, 
    label, 
    message 
  };
};

module.exports = { calculateDataQuality };
