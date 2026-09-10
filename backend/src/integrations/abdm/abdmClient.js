/**
 * External ABDM Gateway Integration Client (§47)
 * Decouples external network calls to ABDM M1/M2/M3 APIs.
 */
const abdmIntegrationService = require('../../services/abdmIntegrationService');

class AbdmClient {
  async linkAbha(session, abhaId) {
    return abdmIntegrationService.linkAbha(session, abhaId);
  }

  async fetchPhr(abhaId) {
    return abdmIntegrationService.fetchPhrRecords(abhaId);
  }

  async pushEncounterBundle(session) {
    return abdmIntegrationService.pushEncounterToAbdm(session);
  }
}

module.exports = new AbdmClient();
