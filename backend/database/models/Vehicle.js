const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['car', 'bike']
  },
  image: {
    type: String,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: true
  },
  fuelType: {
    type: String,
    required: true,
    enum: ['Petrol', 'CNG', 'Electric', 'Hybrid', 'Diesel']
  },
  transmission: {
    type: String,
    enum: ['Automatic', 'Manual'],
    default: 'Automatic'
  },
  seatingCapacity: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  description: {
    type: String,
    default: ''
  },
  badges: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
