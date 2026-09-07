const express = require('express');
const router  = express.Router();
const c = require('../controllers/driverController');

router.get('/',                    c.getAllDrivers);
router.get('/available',           c.getAvailableDrivers);
router.get('/earnings',            c.getDriverEarnings);
router.get('/:id',                 c.getDriverById);
router.get('/:id/rides',           c.getDriverRides);
router.post('/register',           c.registerDriver);
router.post('/login',              c.loginDriver);
router.put('/:id',                 c.updateDriver);
router.patch('/:id/availability',  c.toggleAvailability);
router.patch('/:id/verify',        c.verifyDriver);
router.delete('/:id',              c.deleteDriver);

module.exports = router;
