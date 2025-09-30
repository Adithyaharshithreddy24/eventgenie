const mongoose = require('mongoose');

// Schema for Reviews
const reviewSchema = new mongoose.Schema({
    user: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// Schema for Bookings
const bookingSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    bookedForDate: { type: String, required: true }, // Date when the service is booked for (YYYY-MM-DD)
    dateBooked: { type: Date, default: Date.now },    // Date when the booking was made
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' } // Status of the booking
});

// Main Service Schema
const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    provider: { type: String, required: true },
    vendorUsername: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true }, // e.g., venue, catering, decor, entertainment
    foodType: { type: String, enum: ['veg', 'nonveg', 'both'], default: 'both' }, // For catering services
    images: [{ type: String, required: true }], // Array of image URLs (minimum 1)
    description: { type: String, required: true },
    address: { type: String, required: true },
    reviews: [reviewSchema],
    bookings: [bookingSchema],
    blockedDates: [{ type: String }] // Array of YYYY-MM-DD strings when service is blocked
}, {
    timestamps: true
});

module.exports = mongoose.model('Service', serviceSchema);
