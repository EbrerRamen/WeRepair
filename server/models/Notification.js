const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['status', 'info', 'warning'],
    default: 'status'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema); 