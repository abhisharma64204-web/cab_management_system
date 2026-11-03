const Payment = require('../models/Payment');
const Ride    = require('../models/Ride');
const Customer = require('../models/Customer');

// GET all payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ PAYMENT_DATE: -1 }).lean();
    // Enrich with ride and customer names
    const enriched = await Promise.all(payments.map(async (p) => {
      const ride = await Ride.findOne({ RIDE_ID: p.RIDE_ID }).select('PICKUP_LOC DROP_LOC RIDE_TYPE').lean();
      const cust = await Customer.findOne({ CUST_ID: p.CUST_ID }).select('CUST_NAME').lean();
      return {
        ...p,
        PICKUP_LOC: ride?.PICKUP_LOC || '',
        DROP_LOC:   ride?.DROP_LOC   || '',
        RIDE_TYPE:  ride?.RIDE_TYPE  || '',
        CUST_NAME:  cust?.CUST_NAME  || '',
      };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET payment by ride
exports.getPaymentByRide = async (req, res) => {
  try {
    const pay = await Payment.findOne({ RIDE_ID: req.params.rideId }).lean();
    res.json({ success: true, data: pay || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create payment
exports.createPayment = async (req, res) => {
  const { RIDE_ID, CUST_ID, PAYMENT_AMOUNT, PAYMENT_METHOD } = req.body;
  if (!RIDE_ID || !CUST_ID || !PAYMENT_AMOUNT || !PAYMENT_METHOD)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  try {
    // Verify ride exists, belongs to customer, and is completed
    const ride = await Ride.findOne({ RIDE_ID, CUST_ID }).lean();
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Completed')
      return res.status(400).json({ success: false, message: 'Ride must be completed before payment' });

    // Check for duplicate payment
    const exist = await Payment.findOne({ RIDE_ID });
    if (exist) return res.status(409).json({ success: false, message: 'Payment already made for this ride' });

    // Generate sequential PAYMENT_ID (P001, P002...)
    const lastPay = await Payment.findOne().sort({ PAYMENT_ID: -1 });
    let maxId = 0;
    if (lastPay && lastPay.PAYMENT_ID) {
      maxId = parseInt(lastPay.PAYMENT_ID.substring(1), 10) || 0;
    }
    const payId = 'P' + String(maxId + 1).padStart(3, '0');

    await Payment.create({
      PAYMENT_ID: payId,
      RIDE_ID,
      CUST_ID,
      PAYMENT_AMOUNT: Number(PAYMENT_AMOUNT),
      PAYMENT_METHOD,
      PAYMENT_STATUS: 'Completed',
    });

    if (req.io) req.io.emit('paymentDone', { PAYMENT_ID: payId, RIDE_ID, PAYMENT_AMOUNT, PAYMENT_METHOD });

    res.status(201).json({ success: true, message: 'Payment successful', data: { PAYMENT_ID: payId, PAYMENT_STATUS: 'Completed' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH refund
exports.refundPayment = async (req, res) => {
  try {
    const result = await Payment.findOneAndUpdate(
      { PAYMENT_ID: req.params.id },
      { $set: { PAYMENT_STATUS: 'Refunded' } }
    );
    if (!result) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, message: 'Refund processed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
