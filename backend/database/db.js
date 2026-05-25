const mongoose = require('mongoose');
const dotenv = require('dotenv');
const localDb = require('./localDb');

dotenv.config();

let useLocal = true;
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  console.log("Found MONGO_URI, attempting to connect to MongoDB...");
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to MongoDB successfully!");
    useLocal = false;
  })
  .catch(err => {
    console.error("MongoDB connection failed! Falling back to Local JSON database.", err.message);
    useLocal = true;
  });
} else {
  console.log("No MONGO_URI found in environment. Using Local JSON database.");
  useLocal = true;
}

// Proxies to dynamically fetch Mongoose or local database models
module.exports = {
  get useLocal() { return useLocal; },
  
  get User() {
    return useLocal ? localDb.User : require('./models/User');
  },
  
  get Vehicle() {
    return useLocal ? localDb.Vehicle : require('./models/Vehicle');
  },
  
  get Booking() {
    return useLocal ? localDb.Booking : require('./models/Booking');
  },
  
  get Transaction() {
    return useLocal ? localDb.Transaction : require('./models/Transaction');
  },
  
  get DamageReport() {
    return useLocal ? localDb.DamageReport : require('./models/DamageReport');
  }
};
