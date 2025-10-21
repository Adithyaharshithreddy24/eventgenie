const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
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

// Customer Registration
router.post('/register', async (req, res) => {
    try {
        const { username, password, name, email, phone, address, profilePhoto } = req.body;

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
            $or: [{ username }, { email }]
        });

        if (existingCustomer) {
            return res.status(400).json({
                message: 'Username or email already exists'
            });
        }

        // Check if username is taken by a vendor
        const existingVendor = await Vendor.findOne({ username });

        if (existingVendor) {
            return res.status(400).json({
                message: 'Username already taken by another user'
            });
        }

        const customer = new Customer({
            username,
            password, // In production, hash the password
            name,
            email,
            phone,
            address,
            profilePhoto: profilePhoto || ''
        });

        await customer.save();
        res.status(201).json({
            message: 'Customer registered successfully',
            customer: {
                id: customer._id,
                username: customer.username,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                profilePhoto: customer.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Customer Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const customer = await Customer.findOne({ username, password });

        if (!customer) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            customer: {
                id: customer._id,
                username: customer.username,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                profilePhoto: customer.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Customer Profile
router.get('/profile/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('bookedServiceIds', 'name provider price category images');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Customer Profile
router.put('/profile/:id', async (req, res) => {
    try {
        const { username, password, name, email, phone, address, profilePhoto } = req.body;

        // If username is being updated, check for uniqueness across both customers and vendors
        if (username) {
            const existingCustomer = await Customer.findOne({ username, _id: { $ne: req.params.id } });
            const existingVendor = await Vendor.findOne({ username });

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
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({
            message: 'Profile updated successfully',
            customer: {
                id: customer._id,
                username: customer.username,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                profilePhoto: customer.profilePhoto
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Book a Service
router.post('/book-service/:customerId/:serviceId', async (req, res) => {
    try {
        const { bookedForDate } = req.body;
        const { customerId, serviceId } = req.params;

        console.log('Booking service:', { customerId, serviceId, bookedForDate });

        // Check if customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.log('Customer not found:', customerId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            console.log('Service not found:', serviceId);
            return res.status(404).json({ message: 'Service not found' });
        }

        console.log('Found customer:', customer.username);
        console.log('Found service:', service.name);

        // Check if the date is already booked for this specific service
        const isAlreadyBooked = service.bookings.some(
            (booking) => booking.bookedForDate === bookedForDate && booking.status !== 'cancelled'
        );

        if (isAlreadyBooked) {
            console.log('Date already booked for this service:', bookedForDate);
            return res.status(400).json({
                message: 'This date is already booked for this service',
                serviceName: service.name,
                bookedForDate: bookedForDate
            });
        }

        // Double-check availability by re-fetching the service
        const freshService = await Service.findById(serviceId);
        const isStillAvailable = !freshService.bookings.some(
            (booking) => booking.bookedForDate === bookedForDate && booking.status !== 'cancelled'
        );

        if (!isStillAvailable) {
            console.log('Service no longer available during booking:', serviceId);
            return res.status(400).json({
                message: 'Service is no longer available for this date',
                serviceName: freshService.name,
                bookedForDate: bookedForDate
            });
        }

        // Add booking to service
        const newBooking = {
            customerId: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            bookedForDate,
            dateBooked: new Date()
        };

        freshService.bookings.push(newBooking);
        await freshService.save();

        console.log('Added booking to service:', newBooking);

        // Add service to customer's booked services (if not already there)
        if (!customer.bookedServiceIds.includes(serviceId)) {
            customer.bookedServiceIds.push(serviceId);
            await customer.save();
            console.log('Added service to customer bookedServiceIds');
        } else {
            console.log('Service already in customer bookedServiceIds');
        }

        res.json({
            message: 'Service booked successfully',
            booking: {
                serviceId,
                serviceName: freshService.name,
                bookedForDate,
                dateBooked: new Date()
            }
        });
    } catch (error) {
        console.error('Error booking service:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add Review to Service
router.post('/review/:customerId/:serviceId', async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const { customerId, serviceId } = req.params;

        // Check if customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if service exists
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Check if customer has booked this service
        if (!customer.bookedServiceIds.includes(serviceId)) {
            return res.status(403).json({
                message: 'You can only review services you have booked'
            });
        }

        // Check if customer has already reviewed this service
        const existingReview = service.reviews.find(
            review => review.user === customer.username
        );

        if (existingReview) {
            return res.status(400).json({
                message: 'You have already reviewed this service'
            });
        }

        // Add review
        service.reviews.push({
            user: customer.username,
            rating,
            comment,
            date: new Date()
        });

        await service.save();

        res.json({
            message: 'Review added successfully',
            review: {
                user: customer.username,
                rating,
                comment,
                date: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Customer's Booked Services
router.get('/booked-services/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId)
            .populate('bookedServiceIds');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer.bookedServiceIds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Customer's Detailed Bookings with dates and service info
router.get('/detailed-bookings/:customerId', async (req, res) => {
    try {
        console.log('Fetching detailed bookings for customer:', req.params.customerId);

        const customer = await Customer.findById(req.params.customerId);
        if (!customer) {
            console.log('Customer not found:', req.params.customerId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        console.log('Customer found:', customer.username);
        console.log('Customer bookedServiceIds:', customer.bookedServiceIds);

        // Get all services that the customer has booked
        const services = await Service.find({
            _id: { $in: customer.bookedServiceIds }
        });

        console.log('Found services:', services.length);
        services.forEach((service, index) => {
            console.log(`Service ${index + 1}:`, {
                id: service._id,
                name: service.name,
                bookings: service.bookings.length
            });
        });

        // Create detailed bookings array
        const allBookings = [];

        for (const service of services) {
            // Find bookings for this customer in this service
            const customerBookings = service.bookings.filter(
                booking => booking.customerId.toString() === customer._id.toString()
            );

            console.log(`Service ${service.name} has ${customerBookings.length} bookings for customer`);

            for (const booking of customerBookings) {
                const bookingData = {
                    bookingId: booking._id,
                    serviceId: service._id,
                    serviceName: service.name,
                    provider: service.provider,
                    price: service.price,
                    category: service.category,
                    serviceCategory: service.category, // Add serviceCategory for frontend compatibility
                    images: service.images,
                    description: service.description,
                    bookedForDate: booking.bookedForDate,
                    dateBooked: booking.dateBooked,
                    status: booking.status, // Add status here
                    hasReviewed: service.reviews.some(review => review.user === customer.username)
                };

                console.log('Adding booking:', {
                    serviceName: bookingData.serviceName,
                    bookedForDate: bookingData.bookedForDate,
                    dateBooked: bookingData.dateBooked
                });

                allBookings.push(bookingData);
            }
        }

        // Group bookings by booking time (same dateBooked = same booking session)
        const groupedBookings = {};

        allBookings.forEach(booking => {
            const bookingTime = booking.dateBooked;
            if (!groupedBookings[bookingTime]) {
                groupedBookings[bookingTime] = {
                    bookingTime: bookingTime,
                    dateBooked: new Date(bookingTime).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    services: []
                };
            }
            groupedBookings[bookingTime].services.push(booking);
        });

        // Convert to array and sort by booking time (most recent first)
        const detailedBookings = Object.values(groupedBookings).sort((a, b) =>
            new Date(b.bookingTime) - new Date(a.bookingTime)
        );

        console.log('Total booking sessions to return:', detailedBookings.length);
        detailedBookings.forEach((session, index) => {
            console.log(`Session ${index + 1}:`, {
                dateBooked: session.dateBooked,
                servicesCount: session.services.length
            });
        });

        res.json(detailedBookings);
    } catch (error) {
        console.error('Error in detailed-bookings route:', error);
        res.status(500).json({ message: error.message });
    }
});

// Bulk Book Multiple Services
router.post('/bulk-book-services/:customerId', async (req, res) => {
    try {
        const { services } = req.body; // Array of { serviceId, bookedForDate }
        const { customerId } = req.params;

        console.log('Bulk booking services for customer:', customerId);
        console.log('Services to book:', services);

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({ message: 'Services array is required and cannot be empty' });
        }

        // Check if customer exists
        const customer = await Customer.findById(customerId);
        if (!customer) {
            console.log('Customer not found:', customerId);
            return res.status(404).json({ message: 'Customer not found' });
        }

        // First, validate all services and check availability in a single transaction
        const validationResults = [];
        const servicesToBook = [];

        for (const serviceBooking of services) {
            const { serviceId, bookedForDate } = serviceBooking;

            try {
                // Check if service exists
                const service = await Service.findById(serviceId);
                if (!service) {
                    validationResults.push({
                        serviceId,
                        error: 'Service not found',
                        available: false
                    });
                    continue;
                }

                // Check if the date is already booked for this specific service
                const isAlreadyBooked = service.bookings.some(
                    (booking) => booking.bookedForDate === bookedForDate && booking.status !== 'cancelled'
                );

                if (isAlreadyBooked) {
                    console.log('Date already booked for this service:', bookedForDate);
                    validationResults.push({
                        serviceId,
                        serviceName: service.name,
                        error: 'This date is already booked for this service',
                        available: false
                    });
                    continue;
                }

                // Service is available, add to booking list
                servicesToBook.push({
                    serviceId,
                    service,
                    bookedForDate
                });

                validationResults.push({
                    serviceId,
                    serviceName: service.name,
                    available: true
                });

            } catch (error) {
                console.error('Error validating service:', serviceId, error);
                validationResults.push({
                    serviceId,
                    error: error.message,
                    available: false
                });
            }
        }

        // If no services are available, return error immediately
        if (servicesToBook.length === 0) {
            return res.status(400).json({
                message: 'No services are available for the selected date',
                validationResults
            });
        }

        // Now perform the actual booking with additional validation
        const results = [];
        const errors = [];

        for (const bookingData of servicesToBook) {
            const { serviceId, service, bookedForDate } = bookingData;

            try {
                // Re-fetch the service to ensure we have the latest data
                const freshService = await Service.findById(serviceId);
                if (!freshService) {
                    errors.push({ serviceId, error: 'Service not found during booking' });
                    continue;
                }

                // Double-check availability (in case another user booked it)
                const isStillAvailable = !freshService.bookings.some(
                    (booking) => booking.bookedForDate === bookedForDate && booking.status !== 'cancelled'
                );

                if (!isStillAvailable) {
                    console.log('Service no longer available during booking:', serviceId);
                    errors.push({
                        serviceId,
                        serviceName: freshService.name,
                        error: 'Service is no longer available for this date'
                    });
                    continue;
                }

                // Add booking to service
                const newBooking = {
                    customerId: customer._id,
                    customerName: customer.name,
                    customerEmail: customer.email,
                    customerPhone: customer.phone,
                    bookedForDate,
                    dateBooked: new Date()
                };

                freshService.bookings.push(newBooking);
                await freshService.save();

                // Add service to customer's booked services (if not already there)
                if (!customer.bookedServiceIds.includes(serviceId)) {
                    customer.bookedServiceIds.push(serviceId);
                }

                results.push({
                    serviceId,
                    serviceName: freshService.name,
                    bookedForDate,
                    success: true
                });

                console.log('Successfully booked service:', freshService.name);

            } catch (error) {
                console.error('Error booking service:', serviceId, error);
                errors.push({ serviceId, error: error.message });
            }
        }

        // Save customer if any services were added
        if (results.length > 0) {
            await customer.save();
        }

        // Return detailed results
        const response = {
            message: `Successfully booked ${results.length} out of ${services.length} services`,
            results,
            validationResults,
            totalRequested: services.length,
            successfullyBooked: results.length,
            failedBookings: errors.length
        };

        if (errors.length > 0) {
            response.errors = errors;
        }

        res.json(response);

    } catch (error) {
        console.error('Error in bulk booking:', error);
        res.status(500).json({ message: error.message });
    }
});

// Cancel a Booking
router.post('/cancel-booking/:serviceId/:bookingId', async (req, res) => {
    try {
        const { serviceId, bookingId } = req.params;
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        // Find the booking
        const booking = service.bookings.id(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        // Check if already canceled
        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking already canceled' });
        }
        // Check if event is more than 48 hours away
        const eventDate = new Date(booking.bookedForDate);
        const now = new Date();
        const diffMs = eventDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours < 48) {
            return res.status(400).json({ message: 'Cannot cancel booking within 48 hours of the event date' });
        }
        // Cancel the booking
        booking.status = 'cancelled';
        await service.save();
        res.json({ message: 'Booking canceled successfully', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 