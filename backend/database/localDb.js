const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'local_db.json');

// Helper to load database
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        users: [],
        vehicles: [],
        bookings: [],
        transactions: [],
        damageReports: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    console.error("Failed to read local DB file, using memory storage:", err);
    return { users: [], vehicles: [], bookings: [], transactions: [], damageReports: [] };
  }
}

// Helper to save database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to local DB file:", err);
  }
}

// Mimic a Mongoose collection / model
class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    const db = readDB();
    let items = db[this.collectionName] || [];
    
    // Simple filter matching
    return items.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined && item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    const db = readDB();
    const items = db[this.collectionName] || [];
    return items.find(item => item._id === id) || null;
  }

  async create(data) {
    const db = readDB();
    if (!db[this.collectionName]) {
      db[this.collectionName] = [];
    }
    
    const newItem = {
      _id: 'local_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    
    db[this.collectionName].push(newItem);
    writeDB(db);
    return newItem;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const db = readDB();
    const items = db[this.collectionName] || [];
    const index = items.findIndex(item => item._id === id);
    
    if (index === -1) return null;
    
    // If update has $inc or $push, handle separately (simple simulation)
    let updatedItem = { ...items[index] };
    
    if (update.$inc) {
      for (let key in update.$inc) {
        updatedItem[key] = (updatedItem[key] || 0) + update.$inc[key];
      }
      delete update.$inc;
    }
    
    if (update.$push) {
      for (let key in update.$push) {
        if (!Array.isArray(updatedItem[key])) {
          updatedItem[key] = [];
        }
        updatedItem[key].push(update.$push[key]);
      }
      delete update.$push;
    }

    updatedItem = {
      ...updatedItem,
      ...update,
      updatedAt: new Date().toISOString()
    };
    
    items[index] = updatedItem;
    writeDB(db);
    return updatedItem;
  }

  async deleteOne(query = {}) {
    const db = readDB();
    let items = db[this.collectionName] || [];
    const initialLength = items.length;
    
    items = items.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) {
          return false;
        }
      }
      return true;
    });
    
    db[this.collectionName] = items;
    writeDB(db);
    return { deletedCount: initialLength - items.length };
  }

  async deleteMany(query = {}) {
    const db = readDB();
    if (Object.keys(query).length === 0) {
      const initialLength = (db[this.collectionName] || []).length;
      db[this.collectionName] = [];
      writeDB(db);
      return { deletedCount: initialLength };
    }
    let items = db[this.collectionName] || [];
    const initialLength = items.length;
    
    items = items.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) {
          return false;
        }
      }
      return true;
    });
    
    db[this.collectionName] = items;
    writeDB(db);
    return { deletedCount: initialLength - items.length };
  }
}

module.exports = {
  readDB,
  writeDB,
  User: new LocalModel('users'),
  Vehicle: new LocalModel('vehicles'),
  Booking: new LocalModel('bookings'),
  Transaction: new LocalModel('transactions'),
  DamageReport: new LocalModel('damageReports'),
  isLocal: true
};
