const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Quote = require('../models/Quote');
const { protect } = require('../middleware/auth');
const fs = require('fs');
const Notification = require('../models/Notification');
const User = require('../models/User');

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

    const { deviceName, deviceType, issueDescription, deliveryMethod, address, city, postalCode } = req.body;
    
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
      deliveryMethod: deliveryMethod || 'dropoff',
      address: deliveryMethod === 'pickup' ? address : '',
      city: deliveryMethod === 'pickup' ? city : '',
      postalCode: deliveryMethod === 'pickup' ? postalCode : '',
      files: processedFiles
    });

    await quote.save();
    console.log('Quote saved successfully:', quote);

    // Notify all admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        message: `New repair request submitted by ${req.user.name} for ${deviceName}.`,
        type: 'status',
        relatedRequestId: quote._id
      });
    }

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
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('quote.submittedBy', 'name')
      .populate('rejection.rejectedBy', 'name');
    
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
      .populate('userId', 'name email')
      .populate('quote.submittedBy', 'name')
      .populate('rejection.rejectedBy', 'name');
    
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
    })
    .populate('userId', 'name email')
    .populate('quote.submittedBy', 'name')
    .populate('rejection.rejectedBy', 'name');

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
      $or: [ // Allow cancellation if status is pending or quoted
        { status: 'pending' },
        { status: 'quoted' }
      ]
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

    // Create notification
    await Notification.create({
      userId: quote.userId,
      message: `Your repair request for ${quote.deviceName} was cancelled.`,
      type: 'status',
      relatedRequestId: quote._id
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
    const { deviceName, deviceType, issueDescription, deliveryMethod, address, city, postalCode } = req.body;
    const files = req.files;

    const quote = await Quote.findById(id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Update quote fields
    quote.deviceName = deviceName;
    quote.deviceType = deviceType;
    quote.issueDescription = issueDescription;
    if (deliveryMethod) {
      quote.deliveryMethod = deliveryMethod;
      quote.address = deliveryMethod === 'pickup' ? address : '';
      quote.city = deliveryMethod === 'pickup' ? city : '';
      quote.postalCode = deliveryMethod === 'pickup' ? postalCode : '';
    }

    // Add new files if any
    if (files && files.length > 0) {
      quote.files.push(...files);
    }

    const oldStatus = quote.status;
    await quote.save();
    res.json({ message: 'Quote updated successfully', quote });

    // Only create notification if status actually changed
    if (quote.status && quote.status !== oldStatus) {
      let notifMsg = `Your repair request for ${quote.deviceName} is now '${quote.status}'.`;
      if (quote.status === 'rejected' && quote.rejection && quote.rejection.reason) {
        notifMsg += ` Reason: ${quote.rejection.reason}`;
      }
      await Notification.create({
        userId: quote.userId,
        message: notifMsg,
        type: 'status',
        relatedRequestId: quote._id
      });
    }
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

// Send quote (admin only)
router.put('/:id/quote', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send quotes'
      });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Only allow sending quotes for pending requests
    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only send quotes for pending requests'
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
    quote.status = 'quoted';
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
      message: 'Quote sent successfully',
      quote
    });

    // Create notification
    await Notification.create({
      userId: quote.userId,
      message: `A quote has been sent for your repair request: ${quote.deviceName}.`,
      type: 'status',
      relatedRequestId: quote._id
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending quote',
      error: error.message
    });
  }
});

// Accept quote (user only)
router.put('/:id/accept', protect, async (req, res) => {
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

    // Only allow accepting quoted requests
    if (quote.status !== 'quoted') {
      return res.status(400).json({
        success: false,
        message: 'Can only accept quoted requests'
      });
    }

    quote.status = 'accepted';
    quote.updatedAt = Date.now();
    await quote.save();

    res.json({
      success: true,
      message: 'Quote accepted successfully',
      quote
    });

    // Create notification
    await Notification.create({
      userId: quote.userId,
      message: `Your repair request for ${quote.deviceName} was accepted!`,
      type: 'status',
      relatedRequestId: quote._id
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

    // Only allow rejecting pending requests
    if (quote.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending requests'
      });
    }

    // Validate rejection reason
    const { reason } = req.body;
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Update quote with rejection data
    quote.status = 'rejected';
    quote.rejection = {
      reason: reason.trim(),
      rejectedBy: req.user._id,
      rejectedAt: Date.now()
    };
    quote.updatedAt = Date.now();
    await quote.save();

    res.json({
      success: true,
      message: 'Quote rejected successfully',
      quote
    });

    // Create notification
    await Notification.create({
      userId: quote.userId,
      message: `Your repair request for ${quote.deviceName} was rejected. Reason: ${reason.trim()}`,
      type: 'status',
      relatedRequestId: quote._id
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

// Notification routes

// Get notifications for logged-in user
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

module.exports = router; 