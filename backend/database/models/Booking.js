const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  pickupDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  insuranceSelected: {
    type: Boolean,
    default: false
  },
  deliverySelected: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  cnicUrl: {
    type: String
  },
  licenseUrl: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
