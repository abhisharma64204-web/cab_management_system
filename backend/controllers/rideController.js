const db = require('../config/db');

const FARE_RATES = { Standard: 12, Premium: 20, SUV: 18, Auto: 8 };
const BASE_FARE  = 40;

const calcFare = (dist, type) => Math.round(BASE_FARE + dist * (FARE_RATES[type] || 12));

// GET all rides
exports.getAllRides = async (req, res) => {
  try {
    const { status, cust_id, driver_id } = req.query;
    let sql = `SELECT R.*, C.CUST_NAME, D.DRIVER_NAME, D.VEHICLE_NO
               FROM RIDE R
               LEFT JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID
               LEFT JOIN DRIVER   D ON R.DRIVER_ID=D.DRIVER_ID
               WHERE 1=1`;
    const params = [];
    if (status)    { sql += ' AND R.RIDE_STATUS=?'; params.push(status); }
    if (cust_id)   { sql += ' AND R.CUST_ID=?';     params.push(cust_id); }
    if (driver_id) { sql += ' AND R.DRIVER_ID=?';   params.push(driver_id); }
    sql += ' ORDER BY R.REQUEST_TIME DESC';
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single ride
exports.getRideById = async (req, res) => {
  try {
    const [[ride]] = await db.query(
      `SELECT R.*, C.CUST_NAME, C.CUST_PHONE,
              D.DRIVER_NAME, D.DRIVER_PHONE, D.VEHICLE_NO, D.VEHICLE_TYPE
       FROM RIDE R
       LEFT JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID
       LEFT JOIN DRIVER   D ON R.DRIVER_ID=D.DRIVER_ID
       WHERE R.RIDE_ID=?`, [req.params.id]
    );
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    res.json({ success: true, data: ride });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST request a ride
exports.requestRide = async (req, res) => {
  const { CUST_ID, PICKUP_LOC, DROP_LOC, RIDE_TYPE, DISTANCE } = req.body;
  if (!CUST_ID || !PICKUP_LOC || !DROP_LOC || !DISTANCE)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  try {
    // Check active ride
    const [[activeRide]] = await db.query(
      "SELECT RIDE_ID FROM RIDE WHERE CUST_ID=? AND RIDE_STATUS IN ('Pending','Accepted','Ongoing')",
      [CUST_ID]
    );
    if (activeRide) return res.status(409).json({ success: false, message: 'You already have an active ride' });

    // Auto-assign best available driver
    const [[driver]] = await db.query(
      "SELECT * FROM DRIVER WHERE AVAIL_STATUS='Available' AND VERIFY_STATUS='Verified' ORDER BY AVG_RATING DESC LIMIT 1"
    );
    if (!driver) return res.status(404).json({ success: false, message: 'No drivers available right now' });

    const fare = calcFare(Number(DISTANCE), RIDE_TYPE || 'Standard');
    const [[{maxId}]] = await db.query("SELECT MAX(CAST(SUBSTRING(RIDE_ID,2) AS UNSIGNED)) AS maxId FROM RIDE");
    const rideId = 'R' + String((maxId || 0) + 1).padStart(3, '0');

    await db.query(
      `INSERT INTO RIDE (RIDE_ID,CUST_ID,DRIVER_ID,PICKUP_LOC,DROP_LOC,RIDE_TYPE,DISTANCE,FARE,RIDE_STATUS)
       VALUES (?,?,?,?,?,?,?,?,'Accepted')`,
      [rideId, CUST_ID, driver.DRIVER_ID, PICKUP_LOC, DROP_LOC, RIDE_TYPE || 'Standard', DISTANCE, fare]
    );
    await db.query("UPDATE DRIVER SET AVAIL_STATUS='Busy' WHERE DRIVER_ID=?", [driver.DRIVER_ID]);

    const [[newRide]] = await db.query(
      `SELECT R.*, C.CUST_NAME, D.DRIVER_NAME, D.VEHICLE_NO, D.DRIVER_PHONE
       FROM RIDE R JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID JOIN DRIVER D ON R.DRIVER_ID=D.DRIVER_ID
       WHERE R.RIDE_ID=?`, [rideId]
    );

    // Emit socket event (attached via req.io)
    if (req.io) req.io.emit('rideAccepted', newRide);

    res.status(201).json({ success: true, message: 'Ride booked successfully', data: newRide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH start ride
exports.startRide = async (req, res) => {
  try {
    const [[ride]] = await db.query("SELECT * FROM RIDE WHERE RIDE_ID=?", [req.params.id]);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Accepted') return res.status(400).json({ success: false, message: 'Ride cannot be started' });

    await db.query("UPDATE RIDE SET RIDE_STATUS='Ongoing', START_TIME=NOW() WHERE RIDE_ID=?", [req.params.id]);
    const [[updated]] = await db.query(
      `SELECT R.*, C.CUST_NAME, D.DRIVER_NAME, D.VEHICLE_NO FROM RIDE R
       JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID JOIN DRIVER D ON R.DRIVER_ID=D.DRIVER_ID WHERE R.RIDE_ID=?`,
      [req.params.id]
    );
    if (req.io) req.io.emit('rideStarted', updated);
    res.json({ success: true, message: 'Ride started', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH end ride
exports.endRide = async (req, res) => {
  try {
    const [[ride]] = await db.query("SELECT * FROM RIDE WHERE RIDE_ID=?", [req.params.id]);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Ongoing') return res.status(400).json({ success: false, message: 'Ride is not ongoing' });

    await db.query("UPDATE RIDE SET RIDE_STATUS='Completed', END_TIME=NOW() WHERE RIDE_ID=?", [req.params.id]);
    await db.query("UPDATE DRIVER SET AVAIL_STATUS='Available', TOTAL_RIDES=TOTAL_RIDES+1 WHERE DRIVER_ID=?", [ride.DRIVER_ID]);

    const [[updated]] = await db.query(
      `SELECT R.*, C.CUST_NAME, D.DRIVER_NAME FROM RIDE R
       JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID JOIN DRIVER D ON R.DRIVER_ID=D.DRIVER_ID WHERE R.RIDE_ID=?`,
      [req.params.id]
    );
    if (req.io) req.io.emit('rideCompleted', updated);
    res.json({ success: true, message: 'Ride completed', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const [[ride]] = await db.query("SELECT * FROM RIDE WHERE RIDE_ID=?", [req.params.id]);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (['Completed','Cancelled'].includes(ride.RIDE_STATUS))
      return res.status(400).json({ success: false, message: 'Cannot cancel this ride' });

    await db.query("UPDATE RIDE SET RIDE_STATUS='Cancelled' WHERE RIDE_ID=?", [req.params.id]);
    if (ride.DRIVER_ID)
      await db.query("UPDATE DRIVER SET AVAIL_STATUS='Available' WHERE DRIVER_ID=?", [ride.DRIVER_ID]);

    res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET active rides (real-time dashboard)
exports.getActiveRides = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT R.*, C.CUST_NAME, C.CUST_PHONE, D.DRIVER_NAME, D.DRIVER_PHONE, D.VEHICLE_NO, D.VEHICLE_TYPE
       FROM RIDE R
       JOIN CUSTOMER C ON R.CUST_ID=C.CUST_ID
       JOIN DRIVER   D ON R.DRIVER_ID=D.DRIVER_ID
       WHERE R.RIDE_STATUS IN ('Accepted','Ongoing')
       ORDER BY R.REQUEST_TIME DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
