const express = require('express');
const router  = express.Router();
const c = require('../controllers/feedbackController');

router.get('/',         c.getAllFeedback);
router.get('/ratings',  c.getDriverRatings);
router.post('/',        c.submitFeedback);

module.exports = router;
