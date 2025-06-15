const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Register new user
router.post('/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').notEmpty().withMessage('Name is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name, phone } = req.body;
      console.log('Registration attempt for:', { email, name });

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      user = new User({
        email,
        password,
        name,
        phone
      });

      try {
        await user.save();
        console.log('User saved successfully:', email);

        // Create token
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        const userResponse = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        };

        console.log('Sending successful registration response');
        res.status(201).json({
          token,
          user: userResponse
        });
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        throw saveError;
      }
    } catch (err) {
      console.error('Registration error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      });
      
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      res.status(500).json({ 
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        details: process.env.NODE_ENV === 'development' ? {
          name: err.name,
          code: err.code
        } : undefined
      });
    }
  }
);

// Login user
router.post('/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      console.log('Login attempt for email:', email);

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found:', email);
        return res.status(400).json({ message: 'Invalid email or password' });
      }
      console.log('User found:', user.email);

      // Check password
      try {
        const isMatch = await user.comparePassword(password);
        console.log('Password match:', isMatch);
        
        if (!isMatch) {
          return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Create token
        const token = jwt.sign(
          { id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '1d' }
        );

        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone
          }
        });
      } catch (passwordError) {
        console.error('Password comparison error:', passwordError);
        throw passwordError;
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      res.status(500).json({ 
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin only route example
router.get('/admin/users', [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 