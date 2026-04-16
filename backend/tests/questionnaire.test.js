const request = require('supertest');
const express = require('express');

// ---- Mock dependencies ----
jest.mock('../src/utils/riskScorer', () => {
  const calculateDetailedInsights = jest.fn((profile, diseaseId) => {
    const hasFrequentUrination =
      profile?.frequentUrination?.value === true || profile?.frequentUrination === true;
    const hasPaleSkin =
      profile?.paleSkinObservation?.value === true || profile?.paleSkinObservation === true;

    let riskScore = 10;
    if (hasFrequentUrination) riskScore = 30;
    if (hasPaleSkin) riskScore = 25;

    return {
      riskScore,
      riskCategory: 'mock',
      factorBreakdown: [],
      protectiveFactors: [],
      missingDataFactors: [],
      mitigationSteps: [],
      dataCompleteness: 100,
      verification: {
        source: 'MockSource',
        allSources: ['MockSource'],
        datasetVersion: '2024',
        verificationLevel: 'verified',
        lastValidatedAt: new Date(),
        algorithmVersion: 'test'
      }
    };
  });

  const getRiskVerificationMeta = jest.fn(() => ({
    source: 'MockSource',
    allSources: ['MockSource'],
    datasetVersion: '2024',
    verificationLevel: 'verified',
    lastValidatedAt: new Date(),
    algorithmVersion: 'test'
  }));

  return { calculateDetailedInsights, getRiskVerificationMeta };
});

jest.mock('../src/services/aiService', () => {
  return {
    generateMitigationSteps: jest.fn().mockResolvedValue([])
  };
});

jest.mock('../src/models/UserProfile', () => {
  return {
    findOne: jest.fn(),
    updateOne: jest.fn()
  };
});

jest.mock('../src/models/Medication', () => {
  return {
    find: jest.fn()
  };
});

jest.mock('../src/models/DiseaseInsight', () => {
  class DiseaseInsight {
    static findOne = jest.fn().mockResolvedValue(null);
    constructor(data) {
      Object.assign(this, data);
      this.save = jest.fn().mockResolvedValue(this);
    }
  }
  return DiseaseInsight;
});

jest.mock('../src/models/Report', () => {
  return {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    findById: jest.fn()
  };
});

// ---- Now import routes + mocks ----
const diseaseRoutes = require('../src/routes/diseaseRoutes');
const UserProfile = require('../src/models/UserProfile');
const Medication = require('../src/models/Medication');
const Report = require('../src/models/Report');
const DiseaseInsight = require('../src/models/DiseaseInsight');
const { calculateDetailedInsights } = require('../src/utils/riskScorer');

const app = express();
app.use(express.json());
app.use('/api/diseases', diseaseRoutes);

describe('Disease questionnaire scoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const dbProfile = {
      clerkId: 'user1',
      allergies: { value: [], lastUpdated: new Date(), updateType: 'initial' },
      gender: { value: 'Male', lastUpdated: new Date(), updateType: 'initial' },
      age: { value: 35, lastUpdated: new Date(), updateType: 'initial' }
    };

    // Used both for dbProfile and persistence updates.
    // The route calls: await UserProfile.findOne(...).lean();
    // so findOne() must return an object with a .lean() method.
    UserProfile.findOne.mockReturnValue({
      ...dbProfile,
      lean: jest.fn().mockResolvedValue(dbProfile)
    });
    UserProfile.updateOne.mockResolvedValue({ modifiedCount: 1 });

    // Medication.find(...).lean()
    Medication.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    });

    // Report.findOne(...).sort(...)
    Report.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: 'rep1',
        risk_scores: {},
        risk_score_meta: {}
      })
    });
    Report.updateOne.mockResolvedValue({ modifiedCount: 1 });

    Report.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: 'rep1',
        risk_scores: { diabetes: 22 }
      })
    });

    // Avoid unexpected side effects
    DiseaseInsight.findOne.mockResolvedValue(null);
  });

  test('applies questionnaire answers into scoring profile', async () => {
    const res = await request(app)
      .post('/api/diseases/diabetes/questionnaire')
      .send({
        clerkId: 'user1',
        answers: {
          symptoms: ['frequent_urination']
        },
        userProfile: {
          clerkId: 'user1',
          allergies: { value: [], lastUpdated: new Date(), updateType: 'initial' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    // Baseline (onboarding-only) should not include frequentUrination => 10
    expect(res.body.data.baselineScore).toBe(10);
    // Questionnaire-enriched profile should include frequentUrination => 30
    expect(res.body.data.questionnaireScore).toBe(30);
    expect(res.body.data.finalScore).toBe(30);
    expect(res.body.data.riskScore).toBe(30);
    expect(res.body.data.assessmentDelta).toBe(20);
    expect(res.body.data.questionnaireMeta.questionCount).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.assessmentFactors)).toBe(true);

    // Sanity: ensure calculateDetailedInsights was invoked for both baseline + questionnaire
    expect(calculateDetailedInsights).toHaveBeenCalled();
  });

  test('uses anemia-specific questionnaire mappings in backend scoring', async () => {
    const res = await request(app)
      .post('/api/diseases/anemia/questionnaire')
      .send({
        clerkId: 'user1',
        answers: {
          anemia_symptoms: ['pale_skin']
        },
        userProfile: {
          clerkId: 'user1',
          allergies: { value: [], lastUpdated: new Date(), updateType: 'initial' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.baselineScore).toBe(10);
    expect(res.body.data.questionnaireScore).toBe(25);
    expect(res.body.data.finalScore).toBe(25);
    expect(res.body.data.assessmentDelta).toBe(15);
  });

  test('falls back to questionnaire-point scoring for generic diseases', async () => {
    const res = await request(app)
      .post('/api/diseases/vitamin_d/questionnaire')
      .send({
        clerkId: 'user1',
        answers: {
          vitamin_d_symptoms: 'moderate'
        },
        userProfile: {
          clerkId: 'user1',
          allergies: { value: [], lastUpdated: new Date(), updateType: 'initial' }
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.baselineScore).toBe(10);
    expect(res.body.data.questionnaireScore).toBe(40);
    expect(res.body.data.finalScore).toBe(40);
    expect(res.body.data.assessmentDelta).toBe(30);
    expect(res.body.data.questionnaireBreakdown).toHaveLength(1);
    expect(res.body.data.questionnaireMeta.isSpecific).toBe(false);
  });
});

