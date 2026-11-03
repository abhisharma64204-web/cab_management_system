const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  CUST_ID: { type: String, required: true, unique: true },
  CUST_NAME: { type: String, required: true },
  CUST_PHONE: { type: String, required: true, unique: true },
  CUST_EMAIL: { type: String, required: true, unique: true, lowercase: true, trim: true },
  CUST_ADDRESS: { type: String, default: '' },
  CUST_CITY: { type: String, default: '' },
  CUST_PASSWORD: { type: String, required: true },
  REG_DATE: { type: Date, default: Date.now },
  IS_ACTIVE: { type: Number, default: 1 }
});

module.exports = mongoose.model('Customer', CustomerSchema);
