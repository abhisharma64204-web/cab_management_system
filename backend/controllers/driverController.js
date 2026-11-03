const Driver = require('../models/Driver');

// GET all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const rows = await Driver.find().sort({ REG_DATE: -1 });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET available drivers only
exports.getAvailableDrivers = async (req, res) => {
  try {
    const rows = await Driver.find({ IS_AVAILABLE: 1, IS_VERIFIED: 1 });
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST register driver
exports.registerDriver = async (req, res) => {
  const { DRIVER_NAME, DRIVER_PHONE, LICENSE_NO, VEHICLE_NO, VEHICLE_TYPE } = req.body;

  if (!DRIVER_NAME || !DRIVER_PHONE || !LICENSE_NO || !VEHICLE_NO || !VEHICLE_TYPE) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  try {
    const exist = await Driver.findOne({ $or: [{ DRIVER_PHONE }, { LICENSE_NO }] });
    if (exist) return res.status(409).json({ success: false, message: 'Phone or License already registered' });

    // Generate custom sequential DRIVER_ID (D001, D002...)
    const lastDriver = await Driver.findOne().sort({ DRIVER_ID: -1 });
    let maxId = 0;
    if (lastDriver && lastDriver.DRIVER_ID) {
      maxId = parseInt(lastDriver.DRIVER_ID.substring(1), 10) || 0;
    }
    const newId = 'D' + String(maxId + 1).padStart(3, '0');

    const newDriver = await Driver.create({
      DRIVER_ID: newId,
      DRIVER_NAME,
      DRIVER_PHONE,
      LICENSE_NO,
      VEHICLE_NO,
      VEHICLE_TYPE,
      IS_AVAILABLE: 1,
      IS_VERIFIED: 1,
      AVG_RATING: 5.0
    });

    res.status(201).json({ success: true, message: 'Driver registered', data: newDriver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST driver login (Verifies via Phone and License number)
exports.loginDriver = async (req, res) => {
  const { DRIVER_PHONE, LICENSE_NO } = req.body;
  try {
    const driver = await Driver.findOne({ DRIVER_PHONE, LICENSE_NO });
    if (!driver) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    res.json({ success: true, message: 'Login successful', data: driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH toggle driver availability status
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findOne({ DRIVER_ID: req.params.id });
    if (!driver) return res.status(404).json({ success: false, message: 'Driver not found' });

    driver.IS_AVAILABLE = driver.IS_AVAILABLE === 1 ? 0 : 1;
    await driver.save();

    res.json({ success: true, message: 'Availability status toggled successfully', data: driver });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET driver total earnings summary report
exports.getDriverEarnings = async (req, res) => {
  try {
    // Standard mock object initialization to support frontend analytics dashboard
    res.json({ success: true, data: { totalEarnings: 0, completedRides: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
