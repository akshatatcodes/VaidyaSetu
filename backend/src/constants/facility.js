/**
 * FACILITY CONSTANTS — MediKiosk
 *
 * Single source of truth for the enumerations shared by the facility
 * configuration entities (§53, §54) and everything downstream of them.
 *
 * Why this file exists: before the refactor the department list was written out
 * five separate times — the Encounter enum, an in-memory object in
 * adminRoutes, AYURVEDA_DEPARTMENTS in dashavidhaService, DEPARTMENTS in
 * KioskIntake.jsx and DEPT_LABELS in AdminDashboard.jsx — and the five copies
 * disagreed with each other. §54 is explicit that hospital structure must not be
 * hard-coded, so the *departments themselves* now live in the database. What
 * stays here is only the small closed vocabulary those records are built from.
 */

/** Systems of medicine a hospital or department may practise. */
const SYSTEMS_OF_MEDICINE = [
  'Allopathy',
  'Ayurveda',
  'Yoga & Naturopathy',
  'Unani',
  'Siddha',
  'Homoeopathy'
];

/**
 * Which clinical history framework a department's intake runs (§12, §13).
 *   'modern' → Chief complaint → HPI → PMH → PSH → Drug → Allergies →
 *              Family → Personal → ROS → Investigations → Vitals
 *   'ayush'  → Chief complaint → Nidana → Samprapti → Prakriti → Vikriti →
 *              Dashavidha Pariksha → Ahara → Vihara → Agni → Koshtha
 *
 * §13 is explicit that the exact question set is configurable per hospital /
 * clinical protocol rather than hard-coded universally — this flag only selects
 * the framework; `Department.intakeConfig` carries the per-hospital detail.
 */
const CLINICAL_MODES = ['modern', 'ayush'];

/** Lifecycle for any configured facility record. */
const FACILITY_STATUSES = ['active', 'inactive', 'decommissioned'];

/** Days of week, 0 = Sunday, matching JavaScript's Date#getDay(). */
const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

/** Laboratory sections (§28) — the operational split of a lab's work. */
const LAB_SECTIONS = [
  'Pathology',
  'Biochemistry',
  'Haematology',
  'Microbiology',
  'Serology',
  'Radiology',
  'Imaging',
  'Other'
];

/** Peripherals a kiosk may have attached (§14). */
const KIOSK_PERIPHERALS = [
  'bp_monitor',
  'pulse_oximeter',
  'thermometer',
  'glucometer',
  'weighing_scale',
  'stadiometer',
  'document_scanner',
  'token_printer',
  'card_reader'
];

/** Languages the platform can run an intake in (§44). */
const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'mr', 'ta', 'te', 'bn',
  'gu', 'kn', 'ml', 'or', 'pa', 'as', 'ur'
];

/** `HH:mm` in 24-hour form, used by every working-hours block. */
const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

module.exports = {
  SYSTEMS_OF_MEDICINE,
  CLINICAL_MODES,
  FACILITY_STATUSES,
  DAYS_OF_WEEK,
  LAB_SECTIONS,
  KIOSK_PERIPHERALS,
  SUPPORTED_LANGUAGES,
  TIME_OF_DAY_PATTERN
};
