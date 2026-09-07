const db = require('../config/db');

// Daily trips report
exports.getDailyTrips = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const [rows] = await db.query(
      `SELECT DATE(REQUEST_TIME) AS trip_date,
              COUNT(*) AS total_rides,
              SUM(CASE WHEN RIDE_STATUS='Completed' THEN 1 ELSE 0 END) AS completed,
              SUM(CASE WHEN RIDE_STATUS='Cancelled' THEN 1 ELSE 0 END) AS cancelled,
              COALESCE(SUM(CASE WHEN RIDE_STATUS='Completed' THEN FARE ELSE 0 END),0) AS revenue
       FROM RIDE
       WHERE REQUEST_TIME >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(REQUEST_TIME)
       ORDER BY trip_date DESC`, [Number(days)]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Summary stats for admin dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM CUSTOMER WHERE IS_ACTIVE=1) AS total_customers,
        (SELECT COUNT(*) FROM DRIVER WHERE VERIFY_STATUS='Verified') AS verified_drivers,
        (SELECT COUNT(*) FROM DRIVER WHERE AVAIL_STATUS='Available' AND VERIFY_STATUS='Verified') AS available_drivers,
        (SELECT COUNT(*) FROM DRIVER WHERE VERIFY_STATUS='Pending') AS pending_drivers,
        (SELECT COUNT(*) FROM RIDE) AS total_rides,
        (SELECT COUNT(*) FROM RIDE WHERE RIDE_STATUS='Completed') AS completed_rides,
        (SELECT COUNT(*) FROM RIDE WHERE RIDE_STATUS IN ('Accepted','Ongoing')) AS active_rides,
        (SELECT COUNT(*) FROM RIDE WHERE RIDE_STATUS='Cancelled') AS cancelled_rides,
        (SELECT COALESCE(SUM(PAYMENT_AMOUNT),0) FROM PAYMENT WHERE PAYMENT_STATUS='Completed') AS total_revenue,
        (SELECT COALESCE(SUM(PAYMENT_AMOUNT),0) FROM PAYMENT WHERE PAYMENT_STATUS='Completed' AND DATE(PAYMENT_DATE)=CURDATE()) AS today_revenue,
        (SELECT COUNT(*) FROM RIDE WHERE DATE(REQUEST_TIME)=CURDATE()) AS today_rides,
        (SELECT ROUND(AVG(AVG_RATING),2) FROM DRIVER WHERE VERIFY_STATUS='Verified' AND AVG_RATING>0) AS platform_rating
    `);
    res.json({ success: true, data: totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Revenue by ride type
exports.getRevenueByType = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT RIDE_TYPE,
              COUNT(*) AS total_rides,
              COALESCE(SUM(FARE),0) AS total_revenue,
              ROUND(AVG(FARE),0) AS avg_fare
       FROM RIDE WHERE RIDE_STATUS='Completed'
       GROUP BY RIDE_TYPE`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Top customers
exports.getTopCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT C.CUST_ID, C.CUST_NAME, C.CUST_CITY,
              COUNT(R.RIDE_ID) AS total_rides,
              COALESCE(SUM(R.FARE),0) AS total_spent
       FROM CUSTOMER C
       LEFT JOIN RIDE R ON C.CUST_ID=R.CUST_ID AND R.RIDE_STATUS='Completed'
       GROUP BY C.CUST_ID
       ORDER BY total_spent DESC
       LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
