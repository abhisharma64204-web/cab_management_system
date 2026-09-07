// payments.js
const express = require('express');
const router  = express.Router();
const c = require('../controllers/paymentController');

router.get('/',                  c.getAllPayments);
router.get('/ride/:rideId',      c.getPaymentByRide);
router.post('/',                 c.createPayment);
router.patch('/:id/refund',      c.refundPayment);

module.exports = router;
