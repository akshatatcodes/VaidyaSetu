/**
 * Phase 13 — Multi-Channel Notification Engine (§56)
 * Channels: sms, whatsapp, push, kiosk_print, voice
 * Event set: report_ready, doctor_now_seeing, proceed_to_room, followup_slot_available
 * Rule (§56): SMS and WhatsApp are sent ONLY where explicit consent has been granted per Consent purpose scopes.
 */
const Notification = require('../models/Notification');
const Consent = require('../models/Consent');

async function sendNotification({ recipientId, channel, template, payload = {} }) {
  if (!recipientId || !channel || !template) {
    throw new Error('recipientId, channel, and template are required');
  }

  // 1. Consent Gate check for SMS / WhatsApp (§56)
  if (channel === 'whatsapp' || channel === 'sms') {
    const consent = await Consent.findOne({
      patientId: recipientId,
      status: 'active'
    });

    const isConsented = consent && (
      consent.purpose === channel ||
      consent.purpose === 'all_communications' ||
      consent.permissions?.[channel] === true
    );

    if (!isConsented) {
      const failedNotification = await Notification.create({
        recipientId,
        channel,
        template,
        payload: { ...payload, failureReason: `Consent not granted for channel [${channel}]` },
        status: 'failed'
      });
      return { status: 'failed', reason: 'Consent not granted', data: failedNotification };
    }
  }

  // 2. Simulated Dispatch for consented / push / kiosk_print / voice channels
  const notification = await Notification.create({
    recipientId,
    channel,
    template,
    payload,
    sentAt: new Date(),
    status: 'sent'
  });

  return {
    status: 'success',
    channel,
    message: `Notification sent successfully via ${channel}.`,
    data: notification
  };
}

module.exports = { sendNotification };
