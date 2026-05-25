const express = require('express');
const router = express.Router();
const { User, Transaction } = require('../database/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET api/wallet
// @desc    Get user wallet balance and transaction ledger
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: req.user.id });
    
    // Sort transactions by date descending for better UI usability
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      balance: user.walletBalance,
      transactions
    });
  } catch (err) {
    console.error("Fetch wallet error:", err);
    res.status(500).json({ success: false, message: 'Server database error loading wallet accounts' });
  }
});

// @route   POST api/wallet/top-up
// @desc    Add funds to in-app wallet balance
router.post('/top-up', authMiddleware, async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'Please specify a valid top-up amount greater than zero' });
  }

  const deposit = parseFloat(amount);

  try {
    // 1. Credit balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { walletBalance: deposit } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Log credit transaction
    await Transaction.create({
      user: req.user.id,
      type: 'Credit',
      amount: deposit,
      description: 'Wallet Balance Top-up'
    });

    // 3. Fetch full ledger again to sync
    const transactions = await Transaction.find({ user: req.user.id });
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      message: `Successfully loaded PKR ${deposit.toLocaleString()} into your wallet!`,
      balance: updatedUser.walletBalance,
      transactions
    });

  } catch (err) {
    console.error("Wallet top-up error:", err);
    res.status(500).json({ success: false, message: 'Server database error during deposit transaction' });
  }
});

module.exports = router;
