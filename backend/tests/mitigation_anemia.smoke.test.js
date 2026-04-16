const request = require('supertest');
const express = require('express');

jest.useRealTimers();

// ---------------------------
// Mocks (deterministic only)
// ---------------------------
let mockCompletionState = { done: false };

jest.mock('../src/utils/riskScorer', () => {
  const HYBRID_DISEASE_IDS = ['anemia'];

  const calculateDetailedInsights = jest.fn((profile) => {
    // Baseline profile: paleSkinObservation absent/false => 10
    // Questionnaire profile: paleSkinObservation true => 25
    const hasPaleSkin =
      profile?.paleSkinObservation?.value === true || profile?.paleSkinObservation === true;

    const riskScore = hasPaleSkin ? 25 : 10;
    return {
      riskScore,
      riskCategory: riskScore >= 40 ? 'Moderate' : 'Low',
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

  const getScoreCategory = jest.fn((score) => {
    if (score === -1) return 'N/A';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Very Low';
  });

  return { HYBRID_DISEASE_IDS, calculateDetailedInsights, getRiskVerificationMeta, getScoreCategory };
});

jest.mock('../src/services/aiService', () => {
  return {
    generateMitigationSteps: jest.fn().mockResolvedValue([])
  };
});

jest.mock('../src/models/UserProfile', () => {
  const findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue({
      clerkId: 'user1',
      paleSkinObservation: { value: true, lastUpdated: new Date(), updateType: 'real_change' },
      allergies: [],
      activeMedications: []
    })
  });
  return { findOne };
});

jest.mock('../src/models/Medication', () => {
  return {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([])
    })
  };
});

jest.mock('../src/models/Vital', () => {
  return {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      })
    })
  };
});

jest.mock('../src/models/DiseaseInsight', () => {
  const baselineSnapshot = {
    paleSkinObservation: { value: false, lastUpdated: new Date(), updateType: 'initial' }
  };

  return {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          diseaseId: 'anemia',
          questionnaireCompletedAt: new Date(),
          rawInputData: {
            onboardingData: baselineSnapshot
          }
        }
      ]),
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { diseaseId: 'anemia', questionnaireCompletedAt: new Date() }
        ])
      })
    }),
    updateOne: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockResolvedValue(null)
  };
});

// Report persistence during recompute
let mockReportState = null;
jest.mock('../src/models/Report', () => {
  const Report = {
    findOne: jest.fn().mockReturnValue({
      // `mockReportState` is assigned in `beforeEach`, so we must resolve dynamically.
      sort: jest.fn().mockImplementation(() => Promise.resolve(mockReportState))
    }),
    create: jest.fn().mockResolvedValue(),
    updateOne: jest.fn().mockResolvedValue(),
    findById: jest.fn()
  };
  return Report;
});

jest.mock('../src/models/MitigationCompletion', () => {
  return {
    findOneAndUpdate: jest.fn().mockImplementation(async () => {
      mockCompletionState.done = true;
      return { clerkId: 'user1' };
    }),
    find: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(
        mockCompletionState.done ? [{ diseaseId: 'anemia', stepId: 'step_1', status: true }] : []
      )
    }))
  };
});

// ---------------------------
// App + routes under test
// ---------------------------
jest.resetModules();
const mitigationRoutes = require('../src/routes/mitigationRoutes');
const schedule = require('../src/services/predictiveRiskRecomputeScheduler');

const app = express();
app.use(express.json());
app.use('/api/mitigations', mitigationRoutes);

describe('Mitigation completion decreases predictive risk (anemia smoke)', () => {
  beforeEach(() => {
    mockCompletionState.done = false;

    mockReportState = {
      _id: 'rep1',
      risk_scores: { anemia: 25 },
      risk_score_meta: {
        anemia: { source: 'MockSource', verificationLevel: 'verified' }
      },
      save: jest.fn().mockResolvedValue()
    };
  });

  test('risk decreases after marking mitigation step done', async () => {
    // Simulate a vitals-triggered recompute (no mitigation done yet)
    schedule.schedulePredictiveRecompute({ clerkId: 'user1', diseaseIds: ['anemia'], debounceMs: 50 });
    await new Promise((r) => setTimeout(r, 80));

    expect(mockReportState.risk_scores.anemia).toBe(25);

    // Mark a mitigation step as completed
    await request(app)
      .post('/api/mitigations/anemia/step_1/complete')
      .send({ clerkId: 'user1' })
      .expect(200);

    // Wait for debounced scheduler to persist recompute
    await new Promise((r) => setTimeout(r, 2100));

    // mitigationReduction = 1 step * 3 = 3 => 25 -> 22
    expect(mockReportState.save).toHaveBeenCalled();
    expect(mockReportState.risk_scores.anemia).toBe(22);
  });
});

