const mongoose = require('mongoose');

const DamageReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  photos: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Pending', 'Reviewed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.DamageReport || mongoose.model('DamageReport', DamageReportSchema);
