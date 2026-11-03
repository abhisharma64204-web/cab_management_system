const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  FEEDBACK_ID:   { type: String, required: true, unique: true },
  RIDE_ID:       { type: String, required: true },
  CUST_ID:       { type: String, required: true },
  DRIVER_ID:     { type: String, required: true },
  RATING:        { type: Number, required: true, min: 1, max: 5 },
  COMMENTS:      { type: String, default: '' },
  FEEDBACK_DATE: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
