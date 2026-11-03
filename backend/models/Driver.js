const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  DRIVER_ID: { type: String, required: true, unique: true },
  DRIVER_NAME: { type: String, required: true },
  DRIVER_PHONE: { type: String, required: true, unique: true },
  LICENSE_NO: { type: String, required: true, unique: true },
  VEHICLE_TYPE: { type: String, required: true },
  VEHICLE_NO: { type: String, required: true, unique: true },
  EXPERIENCE: { type: Number, default: 0 },
  AVAIL_STATUS: { type: String, enum: ['Available', 'Busy', 'Offline'], default: 'Available' },
  VERIFY_STATUS: { type: String, enum: ['Verified', 'Rejected', 'Pending'], default: 'Verified' }, // Auto-verified for demo convenience
  AVG_RATING: { type: Number, default: 5.0 },
  TOTAL_RIDES: { type: Number, default: 0 },
  CREATED_AT: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
