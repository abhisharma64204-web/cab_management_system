const db = require('../config/db');

// GET all feedbacks
exports.getAllFeedback = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT F.*, C.CUST_NAME, D.DRIVER_NAME, R.PICKUP_LOC, R.DROP_LOC
       FROM FEEDBACK F
       JOIN CUSTOMER C ON F.CUST_ID=C.CUST_ID
       JOIN DRIVER   D ON F.DRIVER_ID=D.DRIVER_ID
       JOIN RIDE     R ON F.RIDE_ID=R.RIDE_ID
       ORDER BY F.FEEDBACK_DATE DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST submit feedback
exports.submitFeedback = async (req, res) => {
  const { RIDE_ID, CUST_ID, DRIVER_ID, RATING, COMMENTS } = req.body;
  if (!RIDE_ID || !CUST_ID || !DRIVER_ID || !RATING)
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  if (RATING < 1 || RATING > 5)
    return res.status(400).json({ success: false, message: 'Rating must be 1–5' });

  try {
    // Verify ride is completed & belongs to customer
    const [[ride]] = await db.query(
      "SELECT * FROM RIDE WHERE RIDE_ID=? AND CUST_ID=? AND RIDE_STATUS='Completed'",
      [RIDE_ID, CUST_ID]
    );
    if (!ride) return res.status(400).json({ success: false, message: 'Ride not eligible for feedback' });

    const [[exist]] = await db.query("SELECT FEEDBACK_ID FROM FEEDBACK WHERE RIDE_ID=?", [RIDE_ID]);
    if (exist) return res.status(409).json({ success: false, message: 'Feedback already submitted' });

    // Check payment done
    const [[pay]] = await db.query("SELECT PAYMENT_ID FROM PAYMENT WHERE RIDE_ID=? AND PAYMENT_STATUS='Completed'", [RIDE_ID]);
    if (!pay) return res.status(400).json({ success: false, message: 'Payment must be completed first' });

    const [[{maxId}]] = await db.query("SELECT MAX(CAST(SUBSTRING(FEEDBACK_ID,2) AS UNSIGNED)) AS maxId FROM FEEDBACK");
    const fbId = 'F' + String((maxId || 0) + 1).padStart(3, '0');

    await db.query(
      "INSERT INTO FEEDBACK (FEEDBACK_ID,RIDE_ID,CUST_ID,DRIVER_ID,RATING,COMMENTS) VALUES (?,?,?,?,?,?)",
      [fbId, RIDE_ID, CUST_ID, DRIVER_ID, RATING, COMMENTS || '']
    );

    // Recalculate driver AVG_RATING
    await db.query(
      "UPDATE DRIVER SET AVG_RATING=(SELECT ROUND(AVG(RATING),2) FROM FEEDBACK WHERE DRIVER_ID=?) WHERE DRIVER_ID=?",
      [DRIVER_ID, DRIVER_ID]
    );

    res.status(201).json({ success: true, message: 'Feedback submitted. Thank you!', data: { FEEDBACK_ID: fbId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET driver rating report
exports.getDriverRatings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT D.DRIVER_ID, D.DRIVER_NAME, D.VEHICLE_TYPE, D.AVG_RATING, D.TOTAL_RIDES,
              COUNT(F.FEEDBACK_ID) AS total_reviews,
              SUM(CASE WHEN F.RATING=5 THEN 1 ELSE 0 END) AS five_star,
              SUM(CASE WHEN F.RATING=4 THEN 1 ELSE 0 END) AS four_star,
              SUM(CASE WHEN F.RATING<=3 THEN 1 ELSE 0 END) AS three_or_less
       FROM DRIVER D
       LEFT JOIN FEEDBACK F ON D.DRIVER_ID=F.DRIVER_ID
       WHERE D.VERIFY_STATUS='Verified'
       GROUP BY D.DRIVER_ID
       ORDER BY D.AVG_RATING DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
