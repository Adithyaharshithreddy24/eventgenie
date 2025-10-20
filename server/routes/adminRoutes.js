const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const Service = require('../models/Service');

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOne({ username, password });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            admin: {
                id: admin._id,
                username: admin.username
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all vendors with their status
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await Vendor.find({}, {
            username: 1,
            name: 1,
            businessName: 1,
            email: 1,
            phone: 1,
            status: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get pending vendors only
router.get('/vendors/pending', async (req, res) => {
    try {
        const vendors = await Vendor.find({ status: 'pending' }, {
            username: 1,
            name: 1,
            businessName: 1,
            email: 1,
            phone: 1,
            about: 1,
            categories: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        res.json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve vendor
router.put('/vendors/:id/approve', async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: 'accepted' },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({
            message: 'Vendor approved successfully',
            vendor: {
                id: vendor._id,
                username: vendor.username,
                name: vendor.name,
                businessName: vendor.businessName,
                status: vendor.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reject vendor (update status to rejected)
router.put('/vendors/:id/reject', async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            { status: 'rejected' },
            { new: true }
        );

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({
            message: 'Vendor rejected successfully',
            vendor: {
                id: vendor._id,
                username: vendor.username,
                name: vendor.name,
                businessName: vendor.businessName,
                status: vendor.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all customers
router.get('/customers', async (req, res) => {
    try {
        const customers = await Customer.find({}, {
            username: 1,
            name: 1,
            email: 1,
            phone: 1,
            address: 1,
            createdAt: 1
        }).sort({ createdAt: -1 });

        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all services
router.get('/services', async (req, res) => {
    try {
        const services = await Service.find({}, {
            name: 1,
            provider: 1,
            vendorUsername: 1,
            price: 1,
            category: 1,
            foodType: 1,
            description: 1,
            address: 1,
            createdAt: 1,
            bookings: 1
        }).populate('vendorUsername', 'businessName name').sort({ createdAt: -1 });

        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all bookings across all services
router.get('/bookings', async (req, res) => {
    try {
        const services = await Service.find({}).populate('vendorUsername', 'businessName name');
        const allBookings = [];

        services.forEach(service => {
            service.bookings.forEach(booking => {
                allBookings.push({
                    id: booking._id,
                    serviceId: service._id,
                    serviceName: service.name,
                    serviceCategory: service.category,
                    servicePrice: service.price,
                    vendorBusinessName: service.vendorUsername?.businessName || 'Unknown',
                    vendorName: service.vendorUsername?.name || 'Unknown',
                    customerUsername: booking.customerUsername,
                    customerName: booking.customerName,
                    customerPhone: booking.customerPhone,
                    customerEmail: booking.customerEmail,
                    bookedForDate: booking.bookedForDate,
                    dateBooked: booking.dateBooked,
                    status: booking.status,
                    totalAmount: booking.totalAmount
                });
            });
        });

        // Sort by booking date (newest first)
        allBookings.sort((a, b) => new Date(b.dateBooked) - new Date(a.dateBooked));

        res.json(allBookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get detailed customer information
router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Get customer's booking history
        const services = await Service.find({});
        const customerBookings = [];

        services.forEach(service => {
            service.bookings.forEach(booking => {
                // Prefer matching by stored customerId; fallback to username if present
                if ((booking.customerId && String(booking.customerId) === String(customer._id)) ||
                    (booking.customerUsername && booking.customerUsername === customer.username)) {
                    customerBookings.push({
                        serviceId: service._id,
                        serviceName: service.name,
                        serviceCategory: service.category,
                        servicePrice: service.price,
                        vendorBusinessName: service.provider,
                        bookedForDate: booking.bookedForDate,
                        dateBooked: booking.dateBooked,
                        status: booking.status,
                        totalAmount: booking.totalAmount
                    });
                }
            });
        });

        res.json({
            customer,
            bookings: customerBookings
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get detailed vendor information
router.get('/vendors/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Get vendor's services
        // In schema, services reference vendor via vendorUsername as ObjectId. Also support legacy username string.
        const services = await Service.find({ $or: [
            { vendorUsername: vendor._id },
            { vendorUsername: vendor.username }
        ] });
        
        // Get vendor's booking statistics
        let totalBookings = 0;
        let totalRevenue = 0;
        let pendingBookings = 0;
        let confirmedBookings = 0;

        services.forEach(service => {
            service.bookings.forEach(booking => {
                totalBookings++;
                // Treat confirmed/completed/advance_paid as revenue-realized
                if (booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'advance_paid') {
                    confirmedBookings++;
                    totalRevenue += booking.totalAmount || 0;
                } else if (booking.status === 'pending') {
                    pendingBookings++;
                }
            });
        });

        // Prepare concise offered services list for modal rendering
        const offeredServices = services.map(s => ({
            _id: s._id,
            name: s.name,
            category: s.category,
            price: s.price,
            createdAt: s.createdAt
        }));

        res.json({
            vendor,
            services: services.length,
            totalBookings,
            totalRevenue,
            pendingBookings,
            confirmedBookings,
            offeredServices,
            storedRevenue: vendor.revenue || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get detailed service information
router.get('/services/:id', async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate('vendorUsername', 'businessName name email phone');
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Calculate service statistics
        let totalBookings = service.bookings.length;
        let totalRevenue = 0;
        let pendingBookings = 0;
        let confirmedBookings = 0;

        service.bookings.forEach(booking => {
            if (booking.status === 'confirmed') {
                confirmedBookings++;
                totalRevenue += booking.totalAmount || 0;
            } else if (booking.status === 'pending') {
                pendingBookings++;
            }
        });

        res.json({
            service,
            statistics: {
                totalBookings,
                totalRevenue,
                pendingBookings,
                confirmedBookings
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 