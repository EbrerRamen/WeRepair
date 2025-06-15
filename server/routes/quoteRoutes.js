const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Submit a new quote
router.post('/submit', protect, upload.array('files', 5), async (req, res) => {
  try {
    console.log('Received quote submission request');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    const { deviceType, issueDescription } = req.body;
    
    if (!deviceType || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Device type and issue description are required'
      });
    }

    // Process uploaded files
    const processedFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype
    })) : [];

    const quote = new Quote({
      userId: req.user._id,
      deviceType,
      issueDescription,
      files: processedFiles
    });

    await quote.save();
    console.log('Quote saved successfully:', quote);

    res.status(201).json({
      success: true,
      message: 'Quote request submitted successfully',
      quote
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quote request',
      error: error.message
    });
  }
});

// Get user's quotes
router.get('/my-quotes', protect, async (req, res) => {
  try {
    const quotes = await Quote.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      quotes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quotes',
      error: error.message
    });
  }
});

// Get a single quote
router.get('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.json({
      success: true,
      quote
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quote',
      error: error.message
    });
  }
});

module.exports = router; 