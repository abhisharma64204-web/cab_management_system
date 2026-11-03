const express = require('express');
const router  = express.Router();
const c = require('../controllers/reportController');

router.get('/dashboard',     c.getDashboardStats);
router.get('/daily-trips',   c.getDailyTripsReport);
router.get('/revenue-type',  c.getRevenueByTypeReport);
router.get('/top-customers', c.getTopCustomersReport);

module.exports = router;
