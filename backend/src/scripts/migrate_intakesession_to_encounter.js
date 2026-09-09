const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const IntakeSession = require('../models/IntakeSession');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Encounter = require('../models/Encounter');
const Symptom = require('../models/Symptom');
const History = require('../models/History');
const Vital = require('../models/Vital');
const Document = require('../models/Document');
const InvestigationOrder = require('../models/InvestigationOrder');
const Prescription = require('../models/Prescription');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vaidyasetu';

async function migrate() {
  console.log('[MIGRATION] Starting IntakeSession -> Encounter normalized fan-out...');
  await mongoose.connect(mongoUri);

  const sessions = await IntakeSession.find({});
  console.log(`[MIGRATION] Found ${sessions.length} IntakeSession documents to migrate.`);

  let encounterCount = 0;
  let patientCount = 0;

  for (const session of sessions) {
    // 1. Find or create Patient
    let patient = await Patient.findOne({
      $or: [
        ...(session.abhaId ? [{ abhaId: session.abhaId }] : []),
        { 'basicInfo.fullName': session.patientName, 'basicInfo.age': session.age }
      ]
    });

    if (!patient) {
      patient = await Patient.create({
        abhaId: session.abhaId,
        basicInfo: {
          fullName: session.patientName,
          age: session.age,
          gender: ['Male', 'Female', 'Other'].includes(session.gender) ? session.gender : 'Other',
          contactNumber: session.contactNumber
        },
        healthProfile: {
          allergies: (session.allergies || []).map(a => ({ substance: a, sourceTag: 'Patient reported' })),
          existingDiseases: (session.pastMedicalHistory || []).map(d => ({ condition: d, sourceTag: 'Patient reported' }))
        }
      });
      patientCount++;
    }

    // 2. Create Encounter
    const encounter = await Encounter.create({
      patientId: patient._id,
      tokenNumber: session.tokenNumber,
      type: 'opd',
      status: session.queueStatus === 'completed' ? 'closed' : 'opened',
      triagePriority: session.triagePriority || 'normal',
      openedAt: session.createdAt || new Date(),
      closedAt: session.queueStatus === 'completed' ? (session.updatedAt || new Date()) : undefined,
      qrPayload: session.qrPayload,
      isReturningPatient: session.isReturningPatient || false
    });
    encounterCount++;

    // 3. Create Symptom child doc if chiefComplaint exists
    if (session.chiefComplaint || session.socrates?.site) {
      await Symptom.create({
        encounterId: encounter._id,
        patientId: patient._id,
        captureMode: 'text',
        rawInput: session.chiefComplaint,
        structuredComplaint: {
          chiefComplaint: session.chiefComplaint || 'Consultation intake',
          severity: String(session.socrates?.severity || 5),
          character: session.socrates?.character || ''
        },
        capturedAt: session.createdAt || new Date()
      });
    }

    // 4. Create History child doc
    await History.create({
      encounterId: encounter._id,
      patientId: patient._id,
      mode: 'modern',
      sections: {
        chiefComplaint: session.chiefComplaint,
        pastMedicalHistory: session.pastMedicalHistory || [],
        allergies: session.allergies || [],
        dashavidhaPariksha: {
          prakriti: session.dashavidhaPariksha?.prakriti?.primaryDosha || 'Vata',
          vikriti: session.dashavidhaPariksha?.vikriti || ''
        }
      }
    });

    // 5. Create Vital child doc if vitals exist
    if (session.vitals && (session.vitals.systolicBP || session.vitals.heartRate)) {
      if (session.vitals.systolicBP) {
        await Vital.create({
          encounterId: encounter._id,
          patientId: patient._id,
          type: 'blood_pressure',
          value: { systolic: session.vitals.systolicBP, diastolic: session.vitals.diastolicBP || 80 },
          unit: 'mmHg',
          source: 'kiosk-device',
          timestamp: session.vitals.capturedAt || session.createdAt || new Date()
        });
      }
      if (session.vitals.heartRate) {
        await Vital.create({
          encounterId: encounter._id,
          patientId: patient._id,
          type: 'heart_rate',
          value: session.vitals.heartRate,
          unit: 'bpm',
          source: 'kiosk-device',
          timestamp: session.vitals.capturedAt || session.createdAt || new Date()
        });
      }
    }

    // 6. Create Document child docs if documents exist
    if (session.documents && session.documents.length > 0) {
      for (const doc of session.documents) {
        await Document.create({
          patientId: patient._id,
          encounterId: encounter._id,
          type: doc.type || 'other',
          originalFileUrl: doc.imageUrl || '/documents/sample.pdf',
          uploadedAt: doc.uploadedAt || session.createdAt || new Date(),
          verificationStatus: doc.verificationStatus === 'confirmed' ? 'verified' : 'pending'
        });
      }
    }

    // 7. Create InvestigationOrder child docs if labOrders exist
    if (session.labOrders && session.labOrders.length > 0) {
      for (const order of session.labOrders) {
        await InvestigationOrder.create({
          encounterId: encounter._id,
          patientId: patient._id,
          doctorId: encounter.doctorId || patient._id, // fallback ID
          testName: order.testName,
          priority: order.urgency || 'routine',
          status: order.status || 'ordered',
          orderedAt: order.orderedAt || session.createdAt || new Date()
        });
      }
    }

    // 8. Create Prescription child doc if soapNote plan meds exist
    const allMeds = [
      ...(session.soapNote?.plan?.allopathicMeds || []),
      ...(session.soapNote?.plan?.ayurvedicMeds || [])
    ];
    if (allMeds.length > 0) {
      await Prescription.create({
        encounterId: encounter._id,
        patientId: patient._id,
        doctorId: encounter.doctorId || patient._id,
        items: allMeds.map(m => ({
          name: m.name,
          system: m.system === 'Ayurvedic' ? 'ayurvedic' : 'modern',
          dosage: m.dosage || '1 unit',
          frequency: m.frequency || 'daily',
          duration: m.duration || '7 days',
          instructions: m.instructions || ''
        })),
        signedAt: session.soapNote?.generatedAt || session.createdAt || new Date()
      });
    }
  }

  console.log(`[MIGRATION] ✅ Complete! Migrated ${sessions.length} IntakeSessions -> ${encounterCount} Encounters and ${patientCount} Patients.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  });
}

module.exports = migrate;
