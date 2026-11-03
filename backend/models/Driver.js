const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  DRIVER_ID: { type: String, required: true, unique: true },
  DRIVER_NAME: { type: String, required: true },
  DRIVER_PHONE: { type: String, required: true, unique: true },
  LICENSE_NO: { type: String, required: true, unique: true },
  VEHICLE_NO: { type: String, required: true },
  VEHICLE_TYPE: { type: String, required: true },
  IS_AVAILABLE: { type: Number, default: 1 }, // 1 = Yes, 0 = No
  IS_VERIFIED: { type: Number, default: 1 },
  AVG_RATING: { type: Number, default: 5.0 },
  REG_DATE: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', DriverSchema);
