const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (email) user.email = email;
    // Update phone regardless of whether it's empty or not
    user.phone = phone || null;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Admin only routes
// Get all users
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/:userId/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 