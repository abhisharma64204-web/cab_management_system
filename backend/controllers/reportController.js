const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// GET /api/reports/dashboard - Stats summary dashboard layout metrics
const getDashboardStats = async (req, res) => {
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

    // Safely extract values from array index
    const todayRevenue = todayRevenueGroup.length > 0 ? todayRevenueGroup[0].total : 0;
    const totalRevenue = totalRevenueGroup.length > 0 ? totalRevenueGroup[0].total : 0;

    // 3. Aggregate driver average ratings safely
    const avgRatingGroup = await Driver.aggregate([
      { $group: { _id: null, avg: { $avg: '$AVG_RATING' } } }
    ]);
    const platformRating = avgRatingGroup.length > 0 && avgRatingGroup[0].avg ? parseFloat(avgRatingGroup[0].avg.toFixed(1)) : 5.0;

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
const getDailyTripsReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/revenue-type
const getRevenueByTypeReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/top-customers
const getTopCustomersReport = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Export with explicit names matching exactly what routes/reports.js uses
module.exports = {
  getDashboardStats,
  getDailyTripsReport,
  getRevenueByTypeReport,
  getTopCustomersReport
};
