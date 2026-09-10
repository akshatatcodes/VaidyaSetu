/**
 * ABDM Integration Service (§40)
 * Decoupled Integration Layer between MediKiosk Core and External ABDM Services.
 * Wraps ABDM Adapter & FHIR R4 Bundle generation.
 */

const abdmAdapter = require('./abdmAdapter');

/**
 * Link ABHA ID to patient session via ABDM Gateway Adapter
 */
function linkAbha(session, abhaId) {
  return abdmAdapter.linkAbhaId(session, abhaId);
}

/**
 * Pull Personal Health Record (PHR) from ABDM Health Locker via Adapter
 */
function fetchPhrRecords(abhaId) {
  return abdmAdapter.pullPHR(abhaId);
}

/**
 * Export completed clinical encounter to ABDM FHIR R4 Bundle
 */
function generateFhirBundle(session) {
  return abdmAdapter.sessionToFhirBundle(session);
}

/**
 * Push clinical encounter to ABDM Production / Sandbox Gateway
 */
function pushEncounterToAbdm(session) {
  return abdmAdapter.pushToHIS(session);
}

/**
 * Get high-level sanitized ABDM Sync Status for Clinical UI (Doctor/Patient Dashboard)
 * Ensures raw FHIR JSON is NEVER exposed on clinical screens.
 */
function getAbdmSyncSummary(session) {
  const mode = abdmAdapter.getAbdmMode();
  const isLinked = Boolean(session?.abhaId || session?.patient?.abhaId);
  const isSynced = Boolean(session?.queueStatus === 'completed' || session?.abdmSynced);

  return {
    synced: isSynced || isLinked,
    mode,
    badgeText: isLinked || isSynced ? 'ABDM Sync: ✓ Linked' : 'ABDM Sync: Pending',
    statusLabel: isSynced ? 'Synchronized with ABDM Gateway' : isLinked ? 'ABHA Linked' : 'Unlinked',
    lastSyncTime: session?.updatedAt || new Date().toISOString()
  };
}

module.exports = {
  linkAbha,
  fetchPhrRecords,
  generateFhirBundle,
  pushEncounterToAbdm,
  getAbdmSyncSummary
};
