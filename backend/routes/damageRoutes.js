const express = require('express');
const router = express.Router();
const { DamageReport, Booking } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   POST api/damage
// @desc    Submit a damage report for a completed/active rental trip
router.post('/', authMiddleware, async (req, res) => {
  const { bookingId, description, photos } = req.body;

  if (!bookingId || !description) {
    return res.status(400).json({ success: false, message: 'Please specify the Booking ID and a description of the damages' });
  }

  try {
    // 1. Verify booking validity and ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Reference booking profile not found' });
    }

    // Verify booking matches current user
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: You can only file reports on your own booking rentals' });
    }

    // 2. Register Damage Report with administrative pending status
    const report = await DamageReport.create({
      user: req.user.id,
      booking: bookingId,
      vehicle: booking.vehicle,
      description,
      photos: photos || ['uploads/damage_simulated.jpg'], // simulated damage image if none uploaded
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Damage report received. This has been flagged for admin review and safety inspections.',
      report
    });

  } catch (err) {
    console.error("Damage report error:", err);
    res.status(500).json({ success: false, message: 'Server database error recording damage report log' });
  }
});

// @route   GET api/damage/admin/list
// @desc    Get all damage reports for review (Admin only)
router.get('/admin/list', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied: Administrative privileges required' });
  }

  try {
    const reports = await DamageReport.find({});
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    console.error("Fetch reports error:", err);
    res.status(500).json({ success: false, message: 'Server error retrieving damage reports' });
  }
});

module.exports = router;
