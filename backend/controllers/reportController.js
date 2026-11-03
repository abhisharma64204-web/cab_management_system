const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// GET /api/reports/dashboard - Stats summary dashboard layout metrics
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch counts across your collections
    const totalCustomers = await Customer.countDocuments();
    const verifiedDrivers = await Driver.countDocuments({ VERIFY_STATUS: 'Verified' });
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ RIDE_STATUS: 'Completed' });
    const activeRides = await Ride.countDocuments({ RIDE_STATUS: { $in: ['Accepted', 'Ongoing'] } });

    // 2. Aggregate earnings using MongoDB aggregate pipelines
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRevenueGroup = await Ride.aggregate([
      { $match: { RIDE_STATUS: 'Completed', REQUEST_TIME: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$FARE' } } }
    ]);

    const totalRevenueGroup = await Ride.aggregate([
      { $match: { RIDE_STATUS: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$FARE' } } }
    ]);

    // ✅ Fix: Safely extract values from array index [0]
    const todayRevenue = todayRevenueGroup[0]?.total || 0;
    const totalRevenue = totalRevenueGroup[0]?.total || 0;

    // 3. Aggregate driver average ratings safely
    const avgRatingGroup = await Driver.aggregate([
      { $group: { _id: null, avg: { $avg: '$AVG_RATING' } } }
    ]);
    const platformRating = avgRatingGroup[0]?.avg ? parseFloat(avgRatingGroup[0].avg.toFixed(1)) : 5.0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        verifiedDrivers,
        totalRides,
        completedRides,
        activeRides,
        todayRevenue,
        totalRevenue,
        platformRating
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/daily-trips
exports.getDailyTripsReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/revenue-type
exports.getRevenueByTypeReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/top-customers
exports.getTopCustomersReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
