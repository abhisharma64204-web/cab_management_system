const db = require('../config/db');

// GET all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT CUST_ID, CUST_NAME, CUST_PHONE, CUST_EMAIL, CUST_ADDRESS, CUST_CITY, REG_DATE, IS_ACTIVE FROM CUSTOMER ORDER BY REG_DATE DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single customer
exports.getCustomerById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT CUST_ID, CUST_NAME, CUST_PHONE, CUST_EMAIL, CUST_ADDRESS, CUST_CITY, REG_DATE FROM CUSTOMER WHERE CUST_ID = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST register customer
exports.registerCustomer = async (req, res) => {
  const { CUST_NAME, CUST_PHONE, CUST_EMAIL, CUST_ADDRESS, CUST_CITY, CUST_PASSWORD } = req.body;

  if (!CUST_NAME || !CUST_PHONE || !CUST_EMAIL || !CUST_PASSWORD)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  try {
    const [[exist]] = await db.query('SELECT CUST_ID FROM CUSTOMER WHERE CUST_EMAIL=? OR CUST_PHONE=?', [CUST_EMAIL, CUST_PHONE]);
    if (exist) return res.status(409).json({ success: false, message: 'Email or phone already registered' });

    const [[{maxId}]] = await db.query("SELECT MAX(CAST(SUBSTRING(CUST_ID,2) AS UNSIGNED)) AS maxId FROM CUSTOMER");
    const newId = 'C' + String((maxId || 0) + 1).padStart(3, '0');

    await db.query(
      'INSERT INTO CUSTOMER (CUST_ID,CUST_NAME,CUST_PHONE,CUST_EMAIL,CUST_ADDRESS,CUST_CITY,CUST_PASSWORD,REG_DATE) VALUES (?,?,?,?,?,?,?,CURDATE())',
      [newId, CUST_NAME, CUST_PHONE, CUST_EMAIL, CUST_ADDRESS || '', CUST_CITY || '', CUST_PASSWORD]
    );
    res.status(201).json({ success: true, message: 'Customer registered', data: { CUST_ID: newId, CUST_NAME, CUST_EMAIL } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST login
exports.loginCustomer = async (req, res) => {
  const { CUST_EMAIL, CUST_PASSWORD } = req.body;
  try {
    const [[cust]] = await db.query(
      'SELECT CUST_ID,CUST_NAME,CUST_EMAIL,CUST_PHONE,CUST_CITY FROM CUSTOMER WHERE CUST_EMAIL=? AND CUST_PASSWORD=? AND IS_ACTIVE=1',
      [CUST_EMAIL, CUST_PASSWORD]
    );
    if (!cust) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, message: 'Login successful', data: cust });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT update customer
exports.updateCustomer = async (req, res) => {
  const { CUST_NAME, CUST_PHONE, CUST_ADDRESS, CUST_CITY } = req.body;
  try {
    await db.query(
      'UPDATE CUSTOMER SET CUST_NAME=?,CUST_PHONE=?,CUST_ADDRESS=?,CUST_CITY=? WHERE CUST_ID=?',
      [CUST_NAME, CUST_PHONE, CUST_ADDRESS, CUST_CITY, req.params.id]
    );
    res.json({ success: true, message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE customer
exports.deleteCustomer = async (req, res) => {
  try {
    await db.query('UPDATE CUSTOMER SET IS_ACTIVE=0 WHERE CUST_ID=?', [req.params.id]);
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET customer booking history
exports.getCustomerHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT R.*, D.DRIVER_NAME, D.VEHICLE_NO, D.VEHICLE_TYPE,
              P.PAYMENT_STATUS, P.PAYMENT_METHOD,
              F.RATING, F.COMMENTS
       FROM RIDE R
       LEFT JOIN DRIVER  D ON R.DRIVER_ID = D.DRIVER_ID
       LEFT JOIN PAYMENT P ON R.RIDE_ID   = P.RIDE_ID
       LEFT JOIN FEEDBACK F ON R.RIDE_ID  = F.RIDE_ID
       WHERE R.CUST_ID = ?
       ORDER BY R.REQUEST_TIME DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
