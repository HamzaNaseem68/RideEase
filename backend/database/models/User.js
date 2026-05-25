const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  cnicUploaded: {
    type: Boolean,
    default: false
  },
  licenseUploaded: {
    type: Boolean,
    default: false
  },
  cnicUrl: {
    type: String,
    default: ''
  },
  licenseUrl: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
