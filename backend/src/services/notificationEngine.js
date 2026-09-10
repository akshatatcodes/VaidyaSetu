/**
 * Phase 29 — Multi-Channel Consent-Aware Notification Engine
 * Channels: sms, whatsapp, push, kiosk_print, voice
 * Events: opd_token_generated, queue_approaching, doctor_ready, lab_order_created, report_ready, followup_created, followup_changed, referral_created
 */
const Notification = require('../models/Notification');
const Consent = require('../models/Consent');

const SUPPORTED_CHANNELS = ['sms', 'whatsapp', 'push', 'kiosk_print', 'voice'];
const SUPPORTED_EVENTS = [
  'opd_token_generated',
  'token_issued',
  'queue_approaching',
  'doctor_ready',
  'doctor_now_seeing',
  'proceed_to_room',
  'lab_order_created',
  'report_ready',
  'followup_created',
  'followup_changed',
  'referral_created'
];

async function sendNotification({ recipientId, channel, template, payload = {} }) {
  if (!recipientId || !channel || !template) {
    throw new Error('recipientId, channel, and template are required');
  }

  if (!SUPPORTED_CHANNELS.includes(channel)) {
    throw new Error(`Unsupported channel: ${channel}`);
  }

  // Consent Gate check for channels requiring explicit consent (§29, §56)
  if (['whatsapp', 'sms', 'voice'].includes(channel)) {
    const consent = await Consent.findOne({
      patientId: recipientId,
      status: 'active'
    });

    const isConsented = Boolean(
      consent && (
        consent.purpose === channel ||
        consent.purpose === 'all_communications' ||
        (consent.purpose === 'followup_notification' && template.startsWith('followup')) ||
        consent.permissions?.[channel] === true
      )
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

  // Simulated Dispatch for consented / push / kiosk_print / voice channels
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

module.exports = { sendNotification, SUPPORTED_CHANNELS, SUPPORTED_EVENTS };
