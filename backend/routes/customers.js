// routes/customers.js
const express = require('express');
const router  = express.Router();
const c = require('../controllers/customerController');

router.get('/',            c.getAllCustomers);
router.get('/:id',         c.getCustomerById);
router.get('/:id/history', c.getCustomerHistory);
router.post('/register',   c.registerCustomer);
router.post('/login',      c.loginCustomer);
router.put('/:id',         c.updateCustomer);
router.delete('/:id',      c.deleteCustomer);

module.exports = router;
