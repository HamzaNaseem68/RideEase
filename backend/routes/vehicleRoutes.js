const express = require('express');
const router = express.Router();
const { Vehicle } = require('../database/db');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// @route   GET api/vehicles
// @desc    Get all vehicles (with filters)
router.get('/', async (req, res) => {
  try {
    const { type, fuelType, seatingCapacity, search } = req.query;
    
    // Construct search/filter query
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (fuelType) {
      filter.fuelType = fuelType;
    }
    
    if (seatingCapacity) {
      filter.seatingCapacity = parseInt(seatingCapacity, 10);
    }
    
    let vehicles = await Vehicle.find(filter);
    
    // Simple in-memory string search for robustness across local DB and MongoDB
    if (search) {
      const searchLower = search.toLowerCase();
      vehicles = vehicles.filter(v => 
        v.name.toLowerCase().includes(searchLower) || 
        v.description.toLowerCase().includes(searchLower)
      );
    }

    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    console.error("Fetch vehicles error:", err);
    res.status(500).json({ success: false, message: 'Server database error fetching listings' });
  }
});

// @route   GET api/vehicles/:id
// @desc    Get vehicle details by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.id || req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.json({ success: true, vehicle });
  } catch (err) {
    console.error("Fetch vehicle by ID error:", err);
    res.status(500).json({ success: false, message: 'Server error retrieving vehicle info' });
  }
});

// @route   POST api/vehicles
// @desc    Create a new vehicle (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, type, image, pricePerDay, fuelType, seatingCapacity, transmission, description, badges, location } = req.body;

  if (!name || !type || !image || !pricePerDay || !fuelType || !seatingCapacity || !location) {
    return res.status(400).json({ success: false, message: 'Please enter all required specifications' });
  }

  try {
    const newVehicle = await Vehicle.create({
      name,
      type,
      image,
      pricePerDay,
      fuelType,
      seatingCapacity,
      transmission: transmission || 'Automatic',
      description: description || '',
      badges: badges || ['Available'],
      location: {
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        address: location.address || ''
      },
      isAvailable: true
    });

    res.status(201).json({ success: true, vehicle: newVehicle });
  } catch (err) {
    console.error("Create vehicle error:", err);
    res.status(500).json({ success: false, message: 'Failed to create new vehicle profile' });
  }
});

module.exports = router;
