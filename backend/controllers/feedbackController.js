const Feedback = require('../models/Feedback');
const Ride     = require('../models/Ride');
const Driver   = require('../models/Driver');
const Customer = require('../models/Customer');
const Payment  = require('../models/Payment');

// GET all feedbacks (enriched with names)
exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ FEEDBACK_DATE: -1 }).lean();
    const enriched = await Promise.all(feedbacks.map(async (f) => {
      const cust = await Customer.findOne({ CUST_ID:   f.CUST_ID   }).select('CUST_NAME').lean();
      const drv  = await Driver.findOne  ({ DRIVER_ID: f.DRIVER_ID }).select('DRIVER_NAME').lean();
      const ride = await Ride.findOne    ({ RIDE_ID:   f.RIDE_ID   }).select('PICKUP_LOC DROP_LOC').lean();
      return {
        ...f,
        CUST_NAME:   cust?.CUST_NAME   || '',
        DRIVER_NAME: drv?.DRIVER_NAME  || '',
        PICKUP_LOC:  ride?.PICKUP_LOC  || '',
        DROP_LOC:    ride?.DROP_LOC    || '',
      };
    }));
    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST submit feedback
exports.submitFeedback = async (req, res) => {
  const { RIDE_ID, CUST_ID, DRIVER_ID, RATING, COMMENTS } = req.body;
  if (!RIDE_ID || !CUST_ID || !DRIVER_ID || !RATING)
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  if (RATING < 1 || RATING > 5)
    return res.status(400).json({ success: false, message: 'Rating must be 1-5' });

  try {
    // Verify ride is completed and belongs to customer
    const ride = await Ride.findOne({ RIDE_ID, CUST_ID, RIDE_STATUS: 'Completed' });
    if (!ride) return res.status(400).json({ success: false, message: 'Ride not eligible for feedback' });

    // Check duplicate feedback
    const exist = await Feedback.findOne({ RIDE_ID });
    if (exist) return res.status(409).json({ success: false, message: 'Feedback already submitted' });

    // Check payment done
    const pay = await Payment.findOne({ RIDE_ID, PAYMENT_STATUS: 'Completed' });
    if (!pay) return res.status(400).json({ success: false, message: 'Payment must be completed first' });

    // Generate sequential FEEDBACK_ID (F001, F002...)
    const lastFb = await Feedback.findOne().sort({ FEEDBACK_ID: -1 });
    let maxId = 0;
    if (lastFb && lastFb.FEEDBACK_ID) {
      maxId = parseInt(lastFb.FEEDBACK_ID.substring(1), 10) || 0;
    }
    const fbId = 'F' + String(maxId + 1).padStart(3, '0');

    await Feedback.create({
      FEEDBACK_ID: fbId,
      RIDE_ID,
      CUST_ID,
      DRIVER_ID,
      RATING: Number(RATING),
      COMMENTS: COMMENTS || '',
    });

    // Recalculate driver AVG_RATING
    const allFb = await Feedback.find({ DRIVER_ID });
    const avgRating = allFb.reduce((sum, f) => sum + f.RATING, 0) / allFb.length;
    await Driver.findOneAndUpdate({ DRIVER_ID }, { $set: { AVG_RATING: parseFloat(avgRating.toFixed(2)) } });

    res.status(201).json({ success: true, message: 'Feedback submitted. Thank you!', data: { FEEDBACK_ID: fbId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET driver rating report
exports.getDriverRatings = async (req, res) => {
  try {
    const drivers = await Driver.find({ VERIFY_STATUS: 'Verified' }).sort({ AVG_RATING: -1 }).lean();
    const result = await Promise.all(drivers.map(async (d) => {
      const feedbacks = await Feedback.find({ DRIVER_ID: d.DRIVER_ID }).lean();
      return {
        DRIVER_ID:     d.DRIVER_ID,
        DRIVER_NAME:   d.DRIVER_NAME,
        VEHICLE_TYPE:  d.VEHICLE_TYPE,
        AVG_RATING:    d.AVG_RATING,
        TOTAL_RIDES:   d.TOTAL_RIDES,
        total_reviews: feedbacks.length,
        five_star:     feedbacks.filter(f => f.RATING === 5).length,
        four_star:     feedbacks.filter(f => f.RATING === 4).length,
        three_or_less: feedbacks.filter(f => f.RATING <= 3).length,
      };
    }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
