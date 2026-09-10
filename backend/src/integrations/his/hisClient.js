/**
 * External Hospital HIS Integration Client (§47)
 * Decouples external network calls to Hospital Information Systems (HIS).
 */
const hisIntegrationService = require('../../services/hisIntegrationService');

class HisClient {
  async syncEncounter(session) {
    return hisIntegrationService.pushEncounterToHis(session);
  }

  async syncPrescriptions(session) {
    return hisIntegrationService.syncPrescriptionsToPharmacy(session);
  }

  async syncLabOrder(order) {
    return hisIntegrationService.syncLabOrdersToLims(order);
  }
}

module.exports = new HisClient();
