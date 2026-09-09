const mongoose = require('mongoose');
const {
  DAYS_OF_WEEK,
  TIME_OF_DAY_PATTERN
} = require('../../constants/facility');

/**
 * SHARED FACILITY SUB-SCHEMAS — MediKiosk
 *
 * Reusable embedded shapes for the §53/§54 configuration entities. Defined once
 * so a hospital, a department, a laboratory and a kiosk all describe an address,
 * a contact and a working week the same way.
 *
 * All are `_id: false` — they are value objects, not separately addressable
 * records.
 */

/** Postal address. Kept loose because rural addresses rarely fit a strict shape. */
const AddressSchema = new mongoose.Schema({
  line1: { type: String, trim: true, default: '' },
  line2: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  district: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  pincode: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' }
}, { _id: false });

/**
 * GeoJSON point, so §9 "nearby hospitals" can be answered with a real
 * `$nearSphere` query instead of pulling every hospital and sorting in Node.
 * Coordinates are [longitude, latitude] — GeoJSON order, not lat/lng.
 */
const GeoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: {
    type: [Number],
    validate: {
      validator: (v) => !v || v.length === 0 || (
        v.length === 2 &&
        v[0] >= -180 && v[0] <= 180 &&
        v[1] >= -90 && v[1] <= 90
      ),
      message: 'coordinates must be [longitude, latitude] within valid bounds'
    },
    default: undefined
  }
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  phone: { type: String, trim: true, default: '' },
  alternatePhone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  website: { type: String, trim: true, default: '' }
}, { _id: false });

/**
 * One day's opening window. A facility that is shut on a given day simply has
 * `isOpen: false` rather than a missing entry, so "we don't know" and "closed"
 * stay distinguishable (§5 — absence of information is never an assertion).
 */
const WorkingHoursSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, enum: DAYS_OF_WEEK, required: true },
  isOpen: { type: Boolean, default: true },
  opensAt: {
    type: String,
    default: '09:00',
    match: [TIME_OF_DAY_PATTERN, 'opensAt must be HH:mm in 24-hour form']
  },
  closesAt: {
    type: String,
    default: '17:00',
    match: [TIME_OF_DAY_PATTERN, 'closesAt must be HH:mm in 24-hour form']
  },
  /** Optional midday break, e.g. 13:00–14:00. */
  breakStart: {
    type: String,
    default: null,
    match: [TIME_OF_DAY_PATTERN, 'breakStart must be HH:mm in 24-hour form']
  },
  breakEnd: {
    type: String,
    default: null,
    match: [TIME_OF_DAY_PATTERN, 'breakEnd must be HH:mm in 24-hour form']
  }
}, { _id: false });

/** A date on which the facility (or one department) does not run OPD. */
const HolidaySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reason: { type: String, trim: true, default: '' },
  /** Empty = hospital-wide. Otherwise restricted to these department codes. */
  departmentCodes: { type: [String], default: [] }
}, { _id: false });

/**
 * Default working week: open Mon–Sat 09:00–17:00, closed Sunday.
 * A hospital that works differently overrides it — §54 forbids assuming every
 * facility runs the same way.
 */
function defaultWorkingHours() {
  return DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    isOpen: dayOfWeek !== 0,
    opensAt: '09:00',
    closesAt: '17:00',
    breakStart: null,
    breakEnd: null
  }));
}

module.exports = {
  AddressSchema,
  GeoPointSchema,
  ContactSchema,
  WorkingHoursSchema,
  HolidaySchema,
  defaultWorkingHours
};
