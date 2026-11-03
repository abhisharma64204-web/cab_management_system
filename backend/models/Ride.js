const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  RIDE_ID: { type: String, required: true, unique: true },
  CUST_ID: { type: String, required: true },
  DRIVER_ID: { type: String, default: null },
  PICKUP_LOC: { type: String, required: true },
  DROP_LOC: { type: String, required: true },
  RIDE_TYPE: { type: String, default: 'Standard' },
  DISTANCE: { type: Number, required: true },
  FARE: { type: Number, required: true },
  RIDE_STATUS: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Ongoing', 'Completed', 'Cancelled'], 
    default: 'Accepted' 
  },
  REQUEST_TIME: { type: Date, default: Date.now },
  START_TIME: { type: Date, default: null },
  END_TIME: { type: Date, default: null }
});

module.exports = mongoose.model('Ride', RideSchema);
