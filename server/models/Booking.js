const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    vendorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Vendor', 
        required: true 
    },
    serviceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service', 
        required: true 
    },
    eventDate: { 
        type: String, 
        required: true 
    }, // YYYY-MM-DD format
    totalAmount: { 
        type: Number, 
        required: true 
    },
    advanceAmount: { 
        type: Number, 
        required: true 
    }, // 5% of total amount
    advanceAmountPaid: { 
        type: Boolean, 
        default: false 
    },
    upiTransactionId: { 
        type: String 
    }, // UPI transaction ID
    advancePaymentExpiry: { 
        type: Date 
    }, // 12 hours from vendor approval
    status: { 
        type: String,
        default: 'pending' 
    },
    vendorApprovalDate: { 
        type: Date 
    },
    advancePaymentDate: { 
        type: Date 
    },
    customerName: { 
        type: String, 
        required: true 
    },
    customerEmail: { 
        type: String, 
        required: true 
    },
    customerPhone: { 
        type: String, 
        required: true 
    },
    serviceName: { 
        type: String, 
        required: true 
    },
    vendorName: { 
        type: String, 
        required: true 
    },
    notes: { 
        type: String 
    },
    vendorNotes: { 
        type: String 
    }
}, {
    timestamps: true
});

// Index for efficient queries
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ vendorId: 1, status: 1 });
bookingSchema.index({ advancePaymentExpiry: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
