const encounterController = require('../src/controllers/encounterController');
const patientController = require('../src/controllers/patientController');
const { validateStartSessionPayload } = require('../src/validators/intakeValidator');
const abdmClient = require('../src/integrations/abdm/abdmClient');
const hisClient = require('../src/integrations/his/hisClient');

describe('Phase 47 — Backend Service Architecture (§47)', () => {
  test('1. encounterController & patientController export decoupled controller handlers', () => {
    expect(typeof encounterController.startSession).toBe('function');
    expect(typeof encounterController.getEncounterById).toBe('function');
    expect(typeof patientController.getPatientProfile).toBe('function');
    expect(typeof patientController.getPatientHistory).toBe('function');
  });

  test('2. intakeValidator rejects invalid payloads with 400 error', () => {
    const req = { body: { patientName: '', age: -5, gender: 'Invalid' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    validateStartSessionPayload(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', code: 'VALIDATION_ERROR' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('3. intakeValidator calls next() on valid payload', () => {
    const req = { body: { patientName: 'Pooja Sharma', age: 29, gender: 'Female' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    validateStartSessionPayload(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('4. abdmClient & hisClient wrap external integration operations', async () => {
    const sessionMock = { _id: '507f1f77bcf86cd799439011', tokenNumber: 'OPD-999' };

    const abdmRes = await abdmClient.pushEncounterBundle(sessionMock);
    expect(abdmRes.status).toBeDefined();

    const hisRes = await hisClient.syncPrescriptions(sessionMock);
    expect(hisRes.status).toBe('success');
  });
});
