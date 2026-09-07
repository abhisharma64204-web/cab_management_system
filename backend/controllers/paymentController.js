const db = require('../config/db');

// GET all payments
exports.getAllPayments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT P.*, R.PICKUP_LOC, R.DROP_LOC, R.RIDE_TYPE, C.CUST_NAME
       FROM PAYMENT P
       JOIN RIDE R     ON P.RIDE_ID=R.RIDE_ID
       JOIN CUSTOMER C ON P.CUST_ID=C.CUST_ID
       ORDER BY P.PAYMENT_DATE DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET payment by ride
exports.getPaymentByRide = async (req, res) => {
  try {
    const [[pay]] = await db.query(
      `SELECT P.*, R.PICKUP_LOC, R.DROP_LOC, C.CUST_NAME FROM PAYMENT P
       JOIN RIDE R ON P.RIDE_ID=R.RIDE_ID JOIN CUSTOMER C ON P.CUST_ID=C.CUST_ID
       WHERE P.RIDE_ID=?`, [req.params.rideId]
    );
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
    const [[ride]] = await db.query("SELECT * FROM RIDE WHERE RIDE_ID=? AND CUST_ID=?", [RIDE_ID, CUST_ID]);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Completed')
      return res.status(400).json({ success: false, message: 'Ride must be completed before payment' });

    const [[exist]] = await db.query("SELECT PAYMENT_ID FROM PAYMENT WHERE RIDE_ID=?", [RIDE_ID]);
    if (exist) return res.status(409).json({ success: false, message: 'Payment already made for this ride' });

    const [[{maxId}]] = await db.query("SELECT MAX(CAST(SUBSTRING(PAYMENT_ID,2) AS UNSIGNED)) AS maxId FROM PAYMENT");
    const payId = 'P' + String((maxId || 0) + 1).padStart(3, '0');

    await db.query(
      "INSERT INTO PAYMENT (PAYMENT_ID,RIDE_ID,CUST_ID,PAYMENT_AMOUNT,PAYMENT_METHOD,PAYMENT_STATUS) VALUES (?,?,?,?,?,'Completed')",
      [payId, RIDE_ID, CUST_ID, PAYMENT_AMOUNT, PAYMENT_METHOD]
    );

    if (req.io) req.io.emit('paymentDone', { PAYMENT_ID: payId, RIDE_ID, PAYMENT_AMOUNT, PAYMENT_METHOD });

    res.status(201).json({ success: true, message: 'Payment successful', data: { PAYMENT_ID: payId, PAYMENT_STATUS: 'Completed' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH refund
exports.refundPayment = async (req, res) => {
  try {
    await db.query("UPDATE PAYMENT SET PAYMENT_STATUS='Refunded' WHERE PAYMENT_ID=?", [req.params.id]);
    res.json({ success: true, message: 'Refund processed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
