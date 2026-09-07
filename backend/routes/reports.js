const express = require('express');
const router  = express.Router();
const c = require('../controllers/reportController');

router.get('/dashboard',     c.getDashboardStats);
router.get('/daily-trips',   c.getDailyTrips);
router.get('/revenue-type',  c.getRevenueByType);
router.get('/top-customers', c.getTopCustomers);

module.exports = router;
