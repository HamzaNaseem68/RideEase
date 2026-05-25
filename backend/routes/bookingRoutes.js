const express = require('express');
const router = express.Router();
const { Booking, Vehicle, User, Transaction } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   POST api/bookings
// @desc    Create a new booking (locks vehicle, calculates cost, charges wallet)
router.post('/', authMiddleware, async (req, res) => {
  const { vehicleId, pickupDate, returnDate, pickupLocation, insuranceSelected, deliverySelected } = req.body;

  if (!vehicleId || !pickupDate || !returnDate || !pickupLocation) {
    return res.status(400).json({ success: false, message: 'Please provide all booking details (vehicle, dates, location)' });
  }

  try {
    // 1. Fetch user to verify document uploads
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    if (!user.cnicUploaded || !user.licenseUploaded) {
      return res.status(400).json({
        success: false,
        message: 'Security policy: You must upload your CNIC and Driving License before booking a vehicle!'
      });
    }

    // 2. Fetch vehicle to verify availability
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (!vehicle.isAvailable) {
      return res.status(400).json({ success: false, message: 'This vehicle is already booked for these dates' });
    }

    // 3. Calculate Booking Math
    const pDate = new Date(pickupDate);
    const rDate = new Date(returnDate);
    const timeDiff = rDate.getTime() - pDate.getTime();
    
    // Automatically calculate total days (min 1 day)
    let totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (totalDays <= 0) totalDays = 1;

    // Fees structure
    const insuranceFee = insuranceSelected ? 1500 * totalDays : 0; // Flat 1,500 PKR per day
    const deliveryFee = deliverySelected ? 2000 : 0; // Flat 2,000 PKR delivery
    const baseCost = vehicle.pricePerDay * totalDays;
    const totalCost = baseCost + insuranceFee + deliveryFee;

    // 4. Verify Wallet Balance
    if (user.walletBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance! Booking requires PKR ${totalCost.toLocaleString()}, but your balance is PKR ${user.walletBalance.toLocaleString()}. Please top up.`
      });
    }

    // 5. Debit User Wallet & Register Transaction
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { walletBalance: -totalCost } },
      { new: true }
    );

    await Transaction.create({
      user: user._id,
      type: 'Debit',
      amount: totalCost,
      description: `Rented ${vehicle.name} for ${totalDays} days`
    });

    // 6. Mark vehicle as booked
    await Vehicle.findByIdAndUpdate(vehicle._id, { isAvailable: false });

    // 7. Create booking entry
    const newBooking = await Booking.create({
      user: user._id,
      vehicle: vehicle._id,
      pickupDate: pDate,
      returnDate: rDate,
      pickupLocation,
      totalDays,
      totalCost,
      insuranceSelected: !!insuranceSelected,
      deliverySelected: !!deliverySelected,
      status: 'Active',
      cnicUrl: user.cnicUrl,
      licenseUrl: user.licenseUrl
    });

    // Populate user and vehicle info for presentation
    const responseBooking = {
      ...newBooking,
      vehicle: {
        _id: vehicle._id,
        name: vehicle.name,
        image: vehicle.image,
        pricePerDay: vehicle.pricePerDay,
        type: vehicle.type
      },
      user: {
        name: user.name,
        email: user.email
      }
    };

    res.status(201).json({
      success: true,
      message: 'Booking confirmed! Cost deducted from wallet.',
      booking: responseBooking,
      newWalletBalance: updatedUser.walletBalance
    });

  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ success: false, message: 'Server error processing your booking' });
  }
});

// @route   GET api/bookings/history
// @desc    Get booking history of the authenticated user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id });
    
    // In-memory population to cover both mongoose and local DB proxies cleanly
    const populatedBookings = [];
    for (let booking of bookings) {
      const vehicle = await Vehicle.findById(booking.vehicle);
      populatedBookings.push({
        ...booking,
        vehicle: vehicle ? {
          _id: vehicle._id,
          name: vehicle.name,
          image: vehicle.image,
          pricePerDay: vehicle.pricePerDay,
          type: vehicle.type
        } : null
      });
    }

    res.json({ success: true, count: populatedBookings.length, bookings: populatedBookings });
  } catch (err) {
    console.error("Fetch booking history error:", err);
    res.status(500).json({ success: false, message: 'Server error fetching booking records' });
  }
});

// @route   POST api/bookings/:id/cancel
// @desc    Cancel a booking (refund user wallet, unlock vehicle)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.id || req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'Active') {
      return res.status(400).json({ success: false, message: `Booking cannot be cancelled. Current status is: ${booking.status}` });
    }

    // Refund User Wallet & Log Transaction
    const updatedUser = await User.findByIdAndUpdate(
      booking.user,
      { $inc: { walletBalance: booking.totalCost } },
      { new: true }
    );

    await Transaction.create({
      user: booking.user,
      type: 'Credit',
      amount: booking.totalCost,
      description: `Refund for cancelled rental of booking #${booking._id}`
    });

    // Make Vehicle Available Again
    await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });

    // Update Booking Status
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { status: 'Cancelled' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Booking cancelled and 100% refund credited to your wallet!',
      booking: updatedBooking,
      newWalletBalance: updatedUser.walletBalance
    });

  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ success: false, message: 'Server database error during cancellation' });
  }
});

// @route   POST api/bookings/:id/complete
// @desc    Complete a trip (returns vehicle to availability pool)
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.id || req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Trip has already been closed or cancelled' });
    }

    // Release Vehicle
    await Vehicle.findByIdAndUpdate(booking.vehicle, { isAvailable: true });

    // Complete Booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { status: 'Completed' },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Trip completed! Vehicle is now available for other rentals.',
      booking: updatedBooking
    });

  } catch (err) {
    console.error("Complete trip error:", err);
    res.status(500).json({ success: false, message: 'Server database error ending trip' });
  }
});

module.exports = router;
