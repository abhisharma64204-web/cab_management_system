const Customer = require('../models/Customer');
const Ride     = require('../models/Ride');
const Driver   = require('../models/Driver');
const Payment  = require('../models/Payment');
const Feedback = require('../models/Feedback');

// GET all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const rows = await Customer.find()
      .select('CUST_ID CUST_NAME CUST_PHONE CUST_EMAIL CUST_ADDRESS CUST_CITY REG_DATE IS_ACTIVE')
      .sort({ REG_DATE: -1 });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single customer
exports.getCustomerById = async (req, res) => {
  try {
    const row = await Customer.findOne({ CUST_ID: req.params.id })
      .select('CUST_ID CUST_NAME CUST_PHONE CUST_EMAIL CUST_ADDRESS CUST_CITY REG_DATE');

    if (!row) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: row });
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
    // Check if user already exists
    const exist = await Customer.findOne({ $or: [{ CUST_EMAIL }, { CUST_PHONE }] });
    if (exist) return res.status(409).json({ success: false, message: 'Email or phone already registered' });

    // Generate custom incremental CUST_ID (C001, C002...)
    const lastCustomer = await Customer.findOne().sort({ CUST_ID: -1 });
    let maxId = 0;
    if (lastCustomer && lastCustomer.CUST_ID) {
      maxId = parseInt(lastCustomer.CUST_ID.substring(1), 10) || 0;
    }
    const newId = 'C' + String(maxId + 1).padStart(3, '0');

    // Create the customer document in MongoDB
    const newCustomer = await Customer.create({
      CUST_ID: newId,
      CUST_NAME,
      CUST_PHONE,
      CUST_EMAIL,
      CUST_ADDRESS: CUST_ADDRESS || '',
      CUST_CITY: CUST_CITY || '',
      CUST_PASSWORD,
      REG_DATE: new Date(),
      IS_ACTIVE: 1
    });

    res.status(201).json({ 
      success: true, 
      message: 'Customer registered', 
      data: { CUST_ID: newId, CUST_NAME, CUST_EMAIL } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST login
exports.loginCustomer = async (req, res) => {
  const { CUST_EMAIL, CUST_PASSWORD } = req.body;
  try {
    const cust = await Customer.findOne({ 
      CUST_EMAIL, 
      CUST_PASSWORD, 
      IS_ACTIVE: 1 
    }).select('CUST_ID CUST_NAME CUST_EMAIL CUST_PHONE CUST_CITY');

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
    const result = await Customer.findOneAndUpdate(
      { CUST_ID: req.params.id },
      { $set: { CUST_NAME, CUST_PHONE, CUST_ADDRESS, CUST_CITY } },
      { new: true }
    );
    
    if (!result) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE customer
exports.deleteCustomer = async (req, res) => {
  try {
    const result = await Customer.findOneAndUpdate(
      { CUST_ID: req.params.id },
      { $set: { IS_ACTIVE: 0 } }
    );

    if (!result) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET customer booking history (rides enriched with payment & feedback)
exports.getCustomerHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ CUST_ID: req.params.id }).sort({ REQUEST_TIME: -1 }).lean();

    const enriched = await Promise.all(rides.map(async (ride) => {
      const drv      = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID })
                             .select('DRIVER_NAME VEHICLE_NO').lean();
      const payment  = await Payment.findOne({ RIDE_ID: ride.RIDE_ID }).lean();
      const feedback = await Feedback.findOne({ RIDE_ID: ride.RIDE_ID }).lean();
      return {
        ...ride,
        DRIVER_NAME:    drv?.DRIVER_NAME    || '',
        VEHICLE_NO:     drv?.VEHICLE_NO     || '',
        PAYMENT_STATUS: payment?.PAYMENT_STATUS || null,
        PAYMENT_METHOD: payment?.PAYMENT_METHOD || null,
        RATING:         feedback?.RATING        || null,
        COMMENTS:       feedback?.COMMENTS      || null,
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
