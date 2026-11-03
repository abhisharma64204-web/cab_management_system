const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  PAYMENT_ID:     { type: String, required: true, unique: true },
  RIDE_ID:        { type: String, required: true },
  CUST_ID:        { type: String, required: true },
  PAYMENT_AMOUNT: { type: Number, required: true },
  PAYMENT_METHOD: { type: String, required: true },
  PAYMENT_STATUS: { type: String, enum: ['Pending','Completed','Failed','Refunded'], default: 'Completed' },
  PAYMENT_DATE:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);
