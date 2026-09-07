const db = require('../config/db');

// GET all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const { status, verify } = req.query;
    let sql = 'SELECT * FROM DRIVER WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND AVAIL_STATUS=?'; params.push(status); }
    if (verify) { sql += ' AND VERIFY_STATUS=?'; params.push(verify); }
    sql += ' ORDER BY CREATED_AT DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single driver
exports.getDriverById = async (req, res) => {
  try {
    const [[drv]] = await db.query('SELECT * FROM DRIVER WHERE DRIVER_ID=?', [req.params.id]);
    if (!drv) return res.status(404).json({ success: false, message: 'Driver not found' });
    res.json({ success: true, data: drv });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST register driver
exports.registerDriver = async (req, res) => {
  const { DRIVER_NAME, DRIVER_PHONE, LICENSE_NO, VEHICLE_TYPE, VEHICLE_NO, EXPERIENCE } = req.body;
  if (!DRIVER_NAME || !DRIVER_PHONE || !LICENSE_NO || !VEHICLE_TYPE || !VEHICLE_NO)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  try {
    const [[exist]] = await db.query('SELECT DRIVER_ID FROM DRIVER WHERE DRIVER_PHONE=? OR LICENSE_NO=? OR VEHICLE_NO=?', [DRIVER_PHONE, LICENSE_NO, VEHICLE_NO]);
    if (exist) return res.status(409).json({ success: false, message: 'Phone, license or vehicle already registered' });

    const [[{maxId}]] = await db.query("SELECT MAX(CAST(SUBSTRING(DRIVER_ID,2) AS UNSIGNED)) AS maxId FROM DRIVER");
    const newId = 'D' + String((maxId || 0) + 1).padStart(3, '0');

    await db.query(
      'INSERT INTO DRIVER (DRIVER_ID,DRIVER_NAME,DRIVER_PHONE,LICENSE_NO,VEHICLE_TYPE,VEHICLE_NO,EXPERIENCE) VALUES (?,?,?,?,?,?,?)',
      [newId, DRIVER_NAME, DRIVER_PHONE, LICENSE_NO, VEHICLE_TYPE, VEHICLE_NO, EXPERIENCE || 0]
    );
    res.status(201).json({ success: true, message: 'Driver registered. Awaiting admin verification.', data: { DRIVER_ID: newId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update driver
exports.updateDriver = async (req, res) => {
  const { DRIVER_NAME, DRIVER_PHONE, VEHICLE_TYPE, VEHICLE_NO, EXPERIENCE } = req.body;
  try {
    await db.query(
      'UPDATE DRIVER SET DRIVER_NAME=?,DRIVER_PHONE=?,VEHICLE_TYPE=?,VEHICLE_NO=?,EXPERIENCE=? WHERE DRIVER_ID=?',
      [DRIVER_NAME, DRIVER_PHONE, VEHICLE_TYPE, VEHICLE_NO, EXPERIENCE, req.params.id]
    );
    res.json({ success: true, message: 'Driver updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH availability
exports.toggleAvailability = async (req, res) => {
  const { AVAIL_STATUS } = req.body;
  if (!['Available','Busy','Offline'].includes(AVAIL_STATUS))
    return res.status(400).json({ success: false, message: 'Invalid status' });
  try {
    await db.query('UPDATE DRIVER SET AVAIL_STATUS=? WHERE DRIVER_ID=?', [AVAIL_STATUS, req.params.id]);
    res.json({ success: true, message: 'Availability updated', data: { AVAIL_STATUS } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH verify driver (admin)
exports.verifyDriver = async (req, res) => {
  const { VERIFY_STATUS } = req.body;
  if (!['Verified','Rejected','Pending'].includes(VERIFY_STATUS))
    return res.status(400).json({ success: false, message: 'Invalid verify status' });
  try {
    await db.query('UPDATE DRIVER SET VERIFY_STATUS=? WHERE DRIVER_ID=?', [VERIFY_STATUS, req.params.id]);
    res.json({ success: true, message: `Driver ${VERIFY_STATUS}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET available verified drivers
exports.getAvailableDrivers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM DRIVER WHERE AVAIL_STATUS='Available' AND VERIFY_STATUS='Verified' ORDER BY AVG_RATING DESC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET driver earnings report
exports.getDriverEarnings = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT D.DRIVER_ID, D.DRIVER_NAME, D.VEHICLE_TYPE, D.AVG_RATING, D.TOTAL_RIDES,
              COUNT(R.RIDE_ID) AS completed_rides,
              COALESCE(SUM(R.FARE),0) AS total_earnings,
              COALESCE(AVG(R.FARE),0) AS avg_fare
       FROM DRIVER D
       LEFT JOIN RIDE R ON D.DRIVER_ID=R.DRIVER_ID AND R.RIDE_STATUS='Completed'
       GROUP BY D.DRIVER_ID
       ORDER BY total_earnings DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE driver
exports.deleteDriver = async (req, res) => {
  try {
    await db.query('DELETE FROM DRIVER WHERE DRIVER_ID=?', [req.params.id]);
    res.json({ success: true, message: 'Driver removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST driver login
exports.loginDriver = async (req, res) => {
  const { DRIVER_PHONE, LICENSE_NO } = req.body;
  if (!DRIVER_PHONE || !LICENSE_NO)
    return res.status(400).json({ success: false, message: 'Phone and license number required' });
  try {
    const [[driver]] = await db.query(
      'SELECT * FROM DRIVER WHERE DRIVER_PHONE=? AND LICENSE_NO=?',
      [DRIVER_PHONE, LICENSE_NO]
    );
    if (!driver)
      return res.status(401).json({ success: false, message: 'Invalid phone or license number' });
    if (driver.VERIFY_STATUS === 'Pending')
      return res.status(403).json({ success: false, message: 'Your account is pending admin verification' });
    if (driver.VERIFY_STATUS === 'Rejected')
      return res.status(403).json({ success: false, message: 'Your account has been rejected by admin' });
    res.json({ success: true, message: 'Login successful', data: driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET rides assigned to a driver
exports.getDriverRides = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT R.*, C.CUST_NAME, C.CUST_PHONE,
              P.PAYMENT_STATUS, P.PAYMENT_METHOD,
              F.RATING, F.COMMENTS
       FROM RIDE R
       LEFT JOIN CUSTOMER C ON R.CUST_ID = C.CUST_ID
       LEFT JOIN PAYMENT  P ON R.RIDE_ID = P.RIDE_ID
       LEFT JOIN FEEDBACK F ON R.RIDE_ID = F.RIDE_ID
       WHERE R.DRIVER_ID = ?
       ORDER BY R.REQUEST_TIME DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
