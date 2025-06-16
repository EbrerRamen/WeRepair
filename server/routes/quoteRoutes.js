const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');
const fs = require('fs');

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

    const { deviceName, deviceType, issueDescription } = req.body;
    
    if (!deviceName || !deviceType || !issueDescription) {
      return res.status(400).json({
        success: false,
        message: 'Device name, device type, and issue description are required'
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
      deviceName,
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

// Get all quotes (admin only)
router.get('/all', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access all quotes'
      });
    }

    const quotes = await Quote.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
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

// Cancel a quote request
router.delete('/:id', protect, async (req, res) => {
  try {
    const quote = await Quote.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'pending' // Only allow cancellation of pending requests
    });

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found or cannot be cancelled'
      });
    }

    // Delete associated files
    if (quote.files && quote.files.length > 0) {
      quote.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }

    // Delete the quote
    await quote.deleteOne();

    res.json({
      success: true,
      message: 'Quote request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling quote request',
      error: error.message
    });
  }
});

// Update a quote request
router.put('/:id', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceName, deviceType, issueDescription } = req.body;
    const files = req.files;

    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Update quote fields
    quote.deviceName = deviceName;
    quote.deviceType = deviceType;
    quote.issueDescription = issueDescription;

    // Add new files if any
    if (files && files.length > 0) {
      quote.files.push(...files);
    }

    await quote.save();
    res.json({ message: 'Quote updated successfully', quote });
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ message: 'Error updating quote' });
  }
});

// Remove a file from a quote request
router.delete('/:quoteId/files/:fileId', protect, async (req, res) => {
  try {
    const { quoteId, fileId } = req.params;

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Find the file in the quote's files array
    const fileIndex = quote.files.findIndex(file => file._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Remove the file from the array
    quote.files.splice(fileIndex, 1);
    await quote.save();

    res.json({ message: 'File removed successfully' });
  } catch (error) {
    console.error('Error removing file:', error);
    res.status(500).json({ message: 'Error removing file' });
  }
});

// Review a quote request (admin only)
router.put('/:id/review', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review quotes'
      });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Only allow reviewing pending quotes
    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only review pending quotes'
      });
    }

    quote.status = 'reviewed';
    quote.updatedAt = Date.now();
    await quote.save();

    res.json({
      success: true,
      message: 'Quote reviewed successfully',
      quote
    });
  } catch (error) {
    console.error('Error reviewing quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing quote',
      error: error.message
    });
  }
});

// Reject a quote request (admin only)
router.put('/:id/reject', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject quotes'
      });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Only allow rejecting reviewed quotes
    if (quote.status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject reviewed quotes'
      });
    }

    quote.status = 'rejected';
    quote.updatedAt = Date.now();
    await quote.save();

    res.json({
      success: true,
      message: 'Quote rejected successfully',
      quote
    });
  } catch (error) {
    console.error('Error rejecting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting quote',
      error: error.message
    });
  }
});

// Accept a quote request (admin only)
router.put('/:id/accept', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept quotes'
      });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Only allow accepting reviewed quotes
    if (quote.status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Can only accept reviewed quotes'
      });
    }

    // Validate quote data
    const { estimatedCost, estimatedTime, notes } = req.body;
    if (!estimatedCost || !estimatedTime) {
      return res.status(400).json({
        success: false,
        message: 'Estimated cost and time are required'
      });
    }

    // Update quote with the submitted data
    quote.status = 'accepted';
    quote.quote = {
      estimatedCost,
      estimatedTime,
      notes: notes || '',
      submittedBy: req.user._id,
      submittedAt: Date.now()
    };
    quote.updatedAt = Date.now();
    await quote.save();

    res.json({
      success: true,
      message: 'Quote accepted successfully',
      quote
    });
  } catch (error) {
    console.error('Error accepting quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting quote',
      error: error.message
    });
  }
});

module.exports = router; 