const Ride = require('../models/Ride');
const Customer = require('../models/Customer');
const Driver = require('../models/Driver');

const FARE_RATES = { Standard: 12, Premium: 20, SUV: 18, Auto: 8 };
const BASE_FARE  = 40;

const calcFare = (dist, type) => Math.round(BASE_FARE + dist * (FARE_RATES[type] || 12));

// GET all rides with dynamic query filters
exports.getAllRides = async (req, res) => {
  try {
    const { status, cust_id, driver_id } = req.query;
    let queryFilter = {};

    if (status) queryFilter.RIDE_STATUS = status;
    if (cust_id) queryFilter.CUST_ID = cust_id;
    if (driver_id) queryFilter.DRIVER_ID = driver_id;

    const rides = await Ride.find(queryFilter).sort({ REQUEST_TIME: -1 }).lean();

    // Map relational fields to match original SQL JOIN outputs
    const enrichedRides = await Promise.all(rides.map(async (ride) => {
      const cust = await Customer.findOne({ CUST_ID: ride.CUST_ID }).select('CUST_NAME').lean();
      const drv = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID }).select('DRIVER_NAME VEHICLE_NO').lean();
      return {
        ...ride,
        CUST_NAME: cust?.CUST_NAME || '',
        DRIVER_NAME: drv?.DRIVER_NAME || '',
        VEHICLE_NO: drv?.VEHICLE_NO || ''
      };
    }));

    res.json({ success: true, data: enrichedRides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single ride
exports.getRideById = async (req, res) => {
  try {
    const ride = await Ride.findOne({ RIDE_ID: req.params.id }).lean();
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

    const cust = await Customer.findOne({ CUST_ID: ride.CUST_ID }).select('CUST_NAME CUST_PHONE').lean();
    const drv = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID }).select('DRIVER_NAME DRIVER_PHONE VEHICLE_NO VEHICLE_TYPE').lean();

    const formattedData = {
      ...ride,
      CUST_NAME: cust?.CUST_NAME || '',
      CUST_PHONE: cust?.CUST_PHONE || '',
      DRIVER_NAME: drv?.DRIVER_NAME || '',
      DRIVER_PHONE: drv?.DRIVER_PHONE || '',
      VEHICLE_NO: drv?.VEHICLE_NO || '',
      VEHICLE_TYPE: drv?.VEHICLE_TYPE || ''
    };

    res.json({ success: true, data: formattedData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST request and auto-assign a ride
exports.requestRide = async (req, res) => {
  const { CUST_ID, PICKUP_LOC, DROP_LOC, RIDE_TYPE, DISTANCE } = req.body;
  if (!CUST_ID || !PICKUP_LOC || !DROP_LOC || !DISTANCE)
    return res.status(400).json({ success: false, message: 'Required fields missing' });

  try {
    // Check for existing active ride bookings
    const activeRide = await Ride.findOne({
      CUST_ID,
      RIDE_STATUS: { $in: ['Pending', 'Accepted', 'Ongoing'] }
    });
    if (activeRide) return res.status(409).json({ success: false, message: 'You already have an active ride' });

    // Auto-assign best available driver
    const driver = await Driver.findOne({ AVAIL_STATUS: 'Available', VERIFY_STATUS: 'Verified' }).sort({ AVG_RATING: -1 });
    if (!driver) return res.status(404).json({ success: false, message: 'No drivers available right now' });

    const fare = calcFare(Number(DISTANCE), RIDE_TYPE || 'Standard');
    
    // Generate system incremental unique RIDE_ID
    const lastRide = await Ride.findOne().sort({ RIDE_ID: -1 });
    let maxId = 0;
    if (lastRide && lastRide.RIDE_ID) {
      maxId = parseInt(lastRide.RIDE_ID.substring(1), 10) || 0;
    }
    const rideId = 'R' + String(maxId + 1).padStart(3, '0');

    // Save transaction document to cluster instance
    const newRide = await Ride.create({
      RIDE_ID: rideId,
      CUST_ID,
      DRIVER_ID: driver.DRIVER_ID,
      PICKUP_LOC,
      DROP_LOC,
      RIDE_TYPE: RIDE_TYPE || 'Standard',
      DISTANCE: Number(DISTANCE),
      FARE: fare,
      RIDE_STATUS: 'Accepted',
      REQUEST_TIME: new Date()
    });

    // Update driver state to Busy
    await Driver.findOneAndUpdate({ DRIVER_ID: driver.DRIVER_ID }, { $set: { AVAIL_STATUS: 'Busy' } });

    // Fetch details for socket layout data synchronization
    const cust = await Customer.findOne({ CUST_ID }).select('CUST_NAME').lean();
    
    const socketPayload = {
      ...newRide.toObject(),
      CUST_NAME: cust?.CUST_NAME || '',
      DRIVER_NAME: driver.DRIVER_NAME,
      VEHICLE_NO: driver.VEHICLE_NO,
      DRIVER_PHONE: driver.DRIVER_PHONE
    };

    // Emit live real-time event
    if (req.io) req.io.emit('rideAccepted', socketPayload);

    res.status(201).json({ success: true, message: 'Ride booked successfully', data: socketPayload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH start ride
exports.startRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ RIDE_ID: req.params.id });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Accepted') return res.status(400).json({ success: false, message: 'Ride cannot be started' });

    ride.RIDE_STATUS = 'Ongoing';
    ride.START_TIME = new Date();
    await ride.save();

    const cust = await Customer.findOne({ CUST_ID: ride.CUST_ID }).select('CUST_NAME').lean();
    const drv = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID }).select('DRIVER_NAME VEHICLE_NO').lean();

    const updatedPayload = {
      ...ride.toObject(),
      CUST_NAME: cust?.CUST_NAME || '',
      DRIVER_NAME: drv?.DRIVER_NAME || '',
      VEHICLE_NO: drv?.VEHICLE_NO || ''
    };

    if (req.io) req.io.emit('rideStarted', updatedPayload);
    res.json({ success: true, message: 'Ride started', data: updatedPayload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH end ride
exports.endRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ RIDE_ID: req.params.id });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (ride.RIDE_STATUS !== 'Ongoing') return res.status(400).json({ success: false, message: 'Ride is not ongoing' });

    ride.RIDE_STATUS = 'Completed';
    ride.END_TIME = new Date();
    await ride.save();

    // Free up driver and increment completed ride score counters
    await Driver.findOneAndUpdate(
      { DRIVER_ID: ride.DRIVER_ID },
      { $set: { AVAIL_STATUS: 'Available' }, $inc: { TOTAL_RIDES: 1 } }
    );

    const cust = await Customer.findOne({ CUST_ID: ride.CUST_ID }).select('CUST_NAME').lean();
    const drv = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID }).select('DRIVER_NAME').lean();

    const completedPayload = {
      ...ride.toObject(),
      CUST_NAME: cust?.CUST_NAME || '',
      DRIVER_NAME: drv?.DRIVER_NAME || ''
    };

    if (req.io) req.io.emit('rideCompleted', completedPayload);
    res.json({ success: true, message: 'Ride completed', data: completedPayload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ RIDE_ID: req.params.id });
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });
    if (['Completed', 'Cancelled'].includes(ride.RIDE_STATUS))
      return res.status(400).json({ success: false, message: 'Cannot cancel this ride' });

    ride.RIDE_STATUS = 'Cancelled';
    await ride.save();

    if (ride.DRIVER_ID) {
      await Driver.findOneAndUpdate({ DRIVER_ID: ride.DRIVER_ID }, { $set: { AVAIL_STATUS: 'Available' } });
    }

    res.json({ success: true, message: 'Ride cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET active rides for live tracking panel synchronization metrics logs
exports.getActiveRides = async (req, res) => {
  try {
    const rides = await Ride.find({ RIDE_STATUS: { $in: ['Accepted', 'Ongoing'] } }).sort({ REQUEST_TIME: -1 }).lean();

    const enrichedActiveRides = await Promise.all(rides.map(async (ride) => {
      const cust = await Customer.findOne({ CUST_ID: ride.CUST_ID }).select('CUST_NAME CUST_PHONE').lean();
      const drv = await Driver.findOne({ DRIVER_ID: ride.DRIVER_ID }).select('DRIVER_NAME DRIVER_PHONE VEHICLE_NO VEHICLE_TYPE').lean();
      return {
        ...ride,
        CUST_NAME: cust?.CUST_NAME || '',
        CUST_PHONE: cust?.CUST_PHONE || '',
        DRIVER_NAME: drv?.DRIVER_NAME || '',
        DRIVER_PHONE: drv?.DRIVER_PHONE || '',
        VEHICLE_NO: drv?.VEHICLE_NO || '',
        VEHICLE_TYPE: drv?.VEHICLE_TYPE || ''
      };
    }));

    res.json({ success: true, data: enrichedActiveRides });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
