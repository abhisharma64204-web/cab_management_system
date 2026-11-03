const Customer = require('../models/Customer');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// GET /api/reports/dashboard - Stats summary dashboard layout metrics
const getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch counts across collections
    const totalCustomers  = await Customer.countDocuments();
    const verifiedDrivers = await Driver.countDocuments({ VERIFY_STATUS: 'Verified' });
    const pendingDrivers  = await Driver.countDocuments({ VERIFY_STATUS: 'Pending' });
    const totalRides      = await Ride.countDocuments();
    const completedRides  = await Ride.countDocuments({ RIDE_STATUS: 'Completed' });
    const activeRides     = await Ride.countDocuments({ RIDE_STATUS: { $in: ['Accepted', 'Ongoing'] } });

    // 2. Today's ride count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRides = await Ride.countDocuments({ REQUEST_TIME: { $gte: startOfToday } });

    // 3. Aggregate earnings using MongoDB aggregate pipelines
    const todayRevenueGroup = await Ride.aggregate([
      { $match: { RIDE_STATUS: 'Completed', REQUEST_TIME: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$FARE' } } }
    ]);
    const totalRevenueGroup = await Ride.aggregate([
      { $match: { RIDE_STATUS: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$FARE' } } }
    ]);
    const todayRevenue = todayRevenueGroup.length > 0 ? todayRevenueGroup[0].total : 0;
    const totalRevenue = totalRevenueGroup.length > 0 ? totalRevenueGroup[0].total : 0;

    // 4. Platform average rating
    const avgRatingGroup = await Driver.aggregate([
      { $match: { VERIFY_STATUS: 'Verified' } },
      { $group: { _id: null, avg: { $avg: '$AVG_RATING' } } }
    ]);
    const platformRating = avgRatingGroup.length > 0 && avgRatingGroup[0].avg
      ? parseFloat(avgRatingGroup[0].avg.toFixed(1))
      : 5.0;

    // Return snake_case keys matching AdminDashboard expectations
    res.json({
      success: true,
      data: {
        total_customers:  totalCustomers,
        verified_drivers: verifiedDrivers,
        pending_drivers:  pendingDrivers,
        total_rides:      totalRides,
        completed_rides:  completedRides,
        active_rides:     activeRides,
        today_rides:      todayRides,
        today_revenue:    todayRevenue,
        total_revenue:    totalRevenue,
        platform_rating:  platformRating,
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
