const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    categories: [{
        type: String
    }],
    upiId: {
        type: String,
        required: false
    }, // UPI ID for payments (e.g., vendor@bank)
    upiQrCode: {
        type: String,
        required: false
    }, // Generated UPI QR code data URL
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vendor', vendorSchema); 