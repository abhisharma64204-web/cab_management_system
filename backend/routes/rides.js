const express = require('express');
const router  = express.Router();
const c = require('../controllers/rideController');

router.get('/',           c.getAllRides);
router.get('/active',     c.getActiveRides);
router.get('/:id',        c.getRideById);
router.post('/',          c.requestRide);
router.patch('/:id/start',  c.startRide);
router.patch('/:id/end',    c.endRide);
router.patch('/:id/cancel', c.cancelRide);

module.exports = router;
