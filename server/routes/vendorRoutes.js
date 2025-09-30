const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const Service = require('../models/Service');

// Check username uniqueness across customers and vendors
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Check in both customers and vendors collections
        const existingCustomer = await Customer.findOne({ username });
        const existingVendor = await Vendor.findOne({ username });

        if (existingCustomer || existingVendor) {
            return res.json({ available: false, message: 'Username already taken' });
        }

        res.json({ available: true, message: 'Username available' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Vendor Registration
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, businessName, email, phone, about, categories, profilePhoto, upiId } = req.body;

        // Check if vendor already exists
        const existingVendor = await Vendor.findOne({
            $or: [{ username }, { email }]
        });

        if (existingVendor) {
            return res.status(400).json({
                message: 'Username or email already exists'
            });
        }

        // Check if username is taken by a customer
        const existingCustomer = await Customer.findOne({ username });

        if (existingCustomer) {
            return res.status(400).json({
                message: 'Username already taken by another user'
            });
        }

        const vendor = new Vendor({
            username,
            password, // In production, hash the password
            name,
            businessName,
            email,
            phone,
            about: about || '',
            categories: categories || [],
            profilePhoto: profilePhoto || '',
            upiId: upiId || ''
        });

        await vendor.save();
        res.status(201).json({
            message: 'Vendor registered successfully',
            vendor: {
                id: vendor._id,
                username: vendor.username,
                name: vendor.name,
                businessName: vendor.businessName,
                email: vendor.email,
                phone: vendor.phone,
                about: vendor.about,
                categories: vendor.categories,
                profilePhoto: vendor.profilePhoto,
                status: vendor.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Vendor Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const vendor = await Vendor.findOne({ username, password });

        if (!vendor) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if vendor is approved
        if (vendor.status === 'pending') {
            return res.status(403).json({ 
                message: 'Your account is pending approval. Please wait for admin approval.' 
            });
        }

        if (vendor.status === 'rejected') {
            return res.status(403).json({ 
                message: 'Your account has been rejected. Please contact admin for more information.' 
            });
        }

        res.json({
            message: 'Login successful',
            vendor: {
                id: vendor._id,
                username: vendor.username,
                name: vendor.name,
                businessName: vendor.businessName,
                email: vendor.email,
                phone: vendor.phone,
                about: vendor.about,
                categories: vendor.categories,
                profilePhoto: vendor.profilePhoto,
                status: vendor.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Vendor Profile
router.get('/profile/:id', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Vendor Profile
router.put('/profile/:id', async (req, res) => {
    try {
        const { username, password, name, businessName, email, phone, profilePhoto, about, categories } = req.body;

        // If username is being updated, check for uniqueness across both customers and vendors
        if (username) {
            const existingCustomer = await Customer.findOne({ username });
            const existingVendor = await Vendor.findOne({ username, _id: { $ne: req.params.id } });

            if (existingCustomer || existingVendor) {
                return res.status(400).json({
                    message: 'Username already taken by another user'
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (password) updateData.password = password;
        if (name) updateData.name = name;
        if (businessName) updateData.businessName = businessName;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
        if (about !== undefined) updateData.about = about;
        if (categories) updateData.categories = categories;

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            vendor: {
                id: vendor._id,
                username: vendor.username,
                name: vendor.name,
                businessName: vendor.businessName,
                email: vendor.email,
                phone: vendor.phone,
                about: vendor.about,
                categories: vendor.categories,
                profilePhoto: vendor.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Vendor's Services
router.get('/services/:vendorId', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const services = await Service.find({ vendorUsername: vendor.username });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add New Service (Vendor only)
router.post('/services/:vendorId', async (req, res) => {
    try {
        const { name, provider, price, category, foodType, images, description, address } = req.body;
        const { vendorId } = req.params;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Validate images array
        if (!images || images.length === 0) {
            return res.status(400).json({ message: 'At least one image is required' });
        }

        const service = new Service({
            name,
            provider,
            vendorUsername: vendor.username,
            price,
            category,
            foodType: foodType || 'both',
            images,
            description,
            address
        });

        await service.save();

        res.status(201).json({
            message: 'Service created successfully',
            service
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Service (Vendor ownership check)
router.put('/services/:vendorId/:serviceId', async (req, res) => {
    try {
        const { name, provider, price, category, foodType, images, description, address } = req.body;
        const { vendorId, serviceId } = req.params;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if service exists and belongs to vendor
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.vendorUsername !== vendor.username) {
            return res.status(403).json({
                message: 'You can only edit your own services'
            });
        }

        // Update service
        const updateData = {};
        if (name) updateData.name = name;
        if (provider) updateData.provider = provider;
        if (price) updateData.price = price;
        if (category) updateData.category = category;
        if (foodType) updateData.foodType = foodType;
        if (images) updateData.images = images;
        if (description) updateData.description = description;
        if (address) updateData.address = address;

        const updatedService = await Service.findByIdAndUpdate(
            serviceId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Service updated successfully',
            service: updatedService
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Service (Vendor ownership check)
router.delete('/services/:vendorId/:serviceId', async (req, res) => {
    try {
        const { vendorId, serviceId } = req.params;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if service exists and belongs to vendor
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.vendorUsername !== vendor.username) {
            return res.status(403).json({
                message: 'You can only delete your own services'
            });
        }

        await Service.findByIdAndDelete(serviceId);

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Vendor's Bookings
router.get('/bookings/:vendorId', async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Get all services for this vendor
        const services = await Service.find({ vendorUsername: vendor.username });

        // Extract all bookings from all services
        const allBookings = [];
        services.forEach(service => {
            service.bookings.forEach(booking => {
                allBookings.push({
                    ...booking.toObject(),
                    serviceId: service._id,
                    serviceName: service.name,
                    serviceCategory: service.category,
                    servicePrice: service.price
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

// Accept a booking (Vendor only)
router.post('/accept-booking/:vendorId/:serviceId/:bookingId', async (req, res) => {
    try {
        const { vendorId, serviceId, bookingId } = req.params;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if service exists and belongs to vendor
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.vendorUsername !== vendor.username) {
            return res.status(403).json({
                message: 'You can only manage bookings for your own services'
            });
        }

        // Find the booking
        const booking = service.bookings.id(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking is pending
        if (booking.status !== 'pending') {
            return res.status(400).json({ 
                message: `Booking cannot be accepted. Current status: ${booking.status}` 
            });
        }

        // Accept the booking
        booking.status = 'confirmed';
        await service.save();

        res.json({ 
            message: 'Booking accepted successfully', 
            booking: {
                ...booking.toObject(),
                serviceId: service._id,
                serviceName: service.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reject a booking (Vendor only)
router.post('/reject-booking/:vendorId/:serviceId/:bookingId', async (req, res) => {
    try {
        const { vendorId, serviceId, bookingId } = req.params;

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Check if service exists and belongs to vendor
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        if (service.vendorUsername !== vendor.username) {
            return res.status(403).json({
                message: 'You can only manage bookings for your own services'
            });
        }

        // Find the booking
        const booking = service.bookings.id(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check if booking is pending
        if (booking.status !== 'pending') {
            return res.status(400).json({ 
                message: `Booking cannot be rejected. Current status: ${booking.status}` 
            });
        }

        // Reject the booking
        booking.status = 'cancelled';
        await service.save();

        res.json({ 
            message: 'Booking rejected successfully', 
            booking: {
                ...booking.toObject(),
                serviceId: service._id,
                serviceName: service.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 