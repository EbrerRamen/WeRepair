const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    required: true
  },
  issueDescription: {
    type: String,
    required: true
  },
  deliveryMethod: {
    type: String,
    enum: ['dropoff', 'pickup'],
    default: 'dropoff',
    required: true
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  postalCode: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'quoted', 'accepted', 'rejected'],
    default: 'pending'
  },
  files: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  quote: {
    estimatedCost: Number,
    estimatedTime: Number,
    notes: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  rejection: {
    reason: String,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quote', quoteSchema); 