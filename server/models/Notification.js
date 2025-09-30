const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    }, // Customer or Vendor ID
    recipientType: { 
        type: String, 
        enum: ['customer', 'vendor'], 
        required: true 
    },
    type: { 
  type: String, 
  required: true 
},
    title: { 
        type: String, 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking' 
    },
    serviceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service' 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    actionUrl: { 
        type: String 
    }, // URL to navigate to when notification is clicked
    metadata: { 
        type: mongoose.Schema.Types.Mixed 
    } // Additional data like payment amounts, expiry times, etc.
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
