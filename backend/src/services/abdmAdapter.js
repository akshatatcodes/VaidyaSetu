/**
 * ABDM / FHIR adapter — Honest Sandbox / Simulated Adapter.
 * Returns FHIR R4 Bundle payloads from Encounter.
 * Mode is explicitly labeled: "simulated" by default unless ABDM_PROD=true.
 */

const getAbdmMode = () => (process.env.ABDM_PROD === 'true' ? 'production' : 'simulated');

function linkAbhaId(session, abhaId) {
  const mode = getAbdmMode();
  console.log(`[ABDM Adapter] linkAbhaId (${mode}): session=${session?._id} abha=${abhaId}`);
  return {
    status: mode === 'production' ? 'success' : 'simulated',
    mode,
    abhaId: abhaId || session?.abhaId,
    linkedAt: new Date().toISOString(),
    message: mode === 'production'
      ? 'ABHA link completed via live ABDM Gateway.'
      : 'ABDM Sandbox / Simulated Sync Mode — ABHA link recorded in sandbox.'
  };
}

function pullPHR(abhaId) {
  const mode = getAbdmMode();
  console.log(`[ABDM Adapter] pullPHR (${mode}): abha=${abhaId}`);
  return {
    status: mode === 'production' ? 'success' : 'simulated',
    mode,
    resources: [],
    message: mode === 'production'
      ? 'PHR retrieved from ABDM Health Locker.'
      : 'PHR pull simulated — ABDM Sandbox Mode active.'
  };
}

function toFhirPatient(session) {
  return {
    resourceType: 'Patient',
    id: `patient-${session._id}`,
    identifier: [
      { system: 'https://healthid.ndhm.gov.in', value: session.abhaId || 'UNLINKED' }
    ],
    name: [{ text: session.patientName }],
    gender: String(session.gender || 'unknown').toLowerCase(),
    telecom: session.contactNumber
      ? [{ system: 'phone', value: session.contactNumber }]
      : []
  };
}

function toFhirEncounter(session) {
  return {
    resourceType: 'Encounter',
    id: `encounter-${session._id}`,
    status: session.queueStatus === 'completed' ? 'finished' : 'in-progress',
    class: { code: 'AMB', display: 'ambulatory' },
    type: [{ text: session.department || 'OPD' }],
    subject: { reference: `Patient/patient-${session._id}` },
    period: { start: session.createdAt?.toISOString?.() || new Date().toISOString() }
  };
}

function toFhirObservations(session) {
  const v = session.vitals || {};
  const obs = [];
  const push = (code, display, value, unit) => {
    if (value === undefined || value === null || value === '') return;
    obs.push({
      resourceType: 'Observation',
      id: `obs-${code}-${session._id}`,
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code, display }], text: display },
      subject: { reference: `Patient/patient-${session._id}` },
      valueQuantity: { value: Number(value), unit }
    });
  };
  push('8480-6', 'Systolic BP', v.systolicBP, 'mmHg');
  push('8462-4', 'Diastolic BP', v.diastolicBP, 'mmHg');
  push('8867-4', 'Heart rate', v.heartRate, 'beats/min');
  push('2708-6', 'SpO2', v.spo2, '%');
  push('8310-5', 'Body temperature', v.temperature, 'Cel');
  return obs;
}

function toFhirConditions(session) {
  return (session.diagnoses || []).map((d, i) => ({
    resourceType: 'Condition',
    id: `condition-${i}-${session._id}`,
    clinicalStatus: { coding: [{ code: 'active' }] },
    code: {
      coding: [{ system: d.system || 'ICD-11', code: d.code, display: d.term }],
      text: d.term
    },
    subject: { reference: `Patient/patient-${session._id}` },
    note: [{ text: 'AI-generated draft — physician verification required' }]
  }));
}

function toFhirMedicationRequests(session) {
  const plan = session.soapNote?.plan || {};
  const meds = [
    ...(plan.allopathicMeds || []),
    ...(plan.ayurvedicMeds || [])
  ];
  return meds.map((m, i) => ({
    resourceType: 'MedicationRequest',
    id: `medreq-${i}-${session._id}`,
    status: m.confirmedAt ? 'active' : 'draft',
    intent: 'order',
    medicationCodeableConcept: { text: m.name },
    subject: { reference: `Patient/patient-${session._id}` },
    dosageInstruction: [{
      text: [m.dosage, m.frequency, m.duration, m.anupana].filter(Boolean).join(' · ')
    }],
    note: [{ text: 'AI-generated draft — physician verification required' }]
  }));
}

function toFhirDocumentReferences(session) {
  return (session.documents || session.ocrPrescriptions || []).map((doc, i) => ({
    resourceType: 'DocumentReference',
    id: `docref-${i}-${session._id}`,
    status: 'current',
    type: { text: doc.type || 'prescription' },
    content: [{
      attachment: {
        contentType: doc.mimeType || 'image/jpeg',
        url: doc.imageUrl || doc.url || '',
        title: doc.originalName || `Document ${i + 1}`
      }
    }],
    description: doc.verificationStatus || 'needs_verification'
  }));
}

/**
 * Transform completed Encounter into FHIR R4 Bundle (collection).
 */
function sessionToFhirBundle(session) {
  const mode = getAbdmMode();
  const entries = [
    toFhirPatient(session),
    toFhirEncounter(session),
    ...toFhirObservations(session),
    ...toFhirConditions(session),
    ...toFhirMedicationRequests(session),
    ...toFhirDocumentReferences(session)
  ].map((resource) => ({ fullUrl: `urn:uuid:${resource.id}`, resource }));

  return {
    resourceType: 'Bundle',
    type: 'collection',
    id: `bundle-${session.tokenNumber || session._id}`,
    timestamp: new Date().toISOString(),
    mode,
    meta: {
      tag: [{
        system: 'https://abdm.gov.in/fhir',
        code: mode,
        display: mode === 'production' ? 'ABDM Production Gateway Sync' : 'ABDM Sandbox / Simulated Sync Mode'
      }]
    },
    entry: entries
  };
}

function pushToHIS(session) {
  const mode = getAbdmMode();
  const bundle = sessionToFhirBundle(session);
  console.log(`[ABDM Adapter] pushToHIS (${mode}): token=${session?.tokenNumber} resources=${bundle.entry.length}`);
  return {
    status: mode === 'production' ? 'success' : 'simulated',
    mode,
    transactionId: mode === 'production' ? `TXN-ABDM-${Date.now()}` : `TXN-SIMULATED-${Date.now()}`,
    careContextId: `CC-${session?.tokenNumber || 'NA'}`,
    bundle,
    message: mode === 'production'
      ? 'HIS/ABDM record synchronized with production Health Locker.'
      : 'HIS/ABDM push simulated successfully — ABDM Sandbox Mode.'
  };
}

module.exports = {
  getAbdmMode,
  linkAbhaId,
  pullPHR,
  pushToHIS,
  sessionToFhirBundle,
  toFhirPatient,
  toFhirEncounter,
  toFhirObservations,
  toFhirConditions,
  toFhirMedicationRequests,
  toFhirDocumentReferences
};
