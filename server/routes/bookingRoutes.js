const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const upiConfig = require('../config/upi');

// Create a new booking request
router.post('/create', async (req, res) => {
    try {
        const { customerId, serviceId, eventDate, notes } = req.body;

        // Get service and vendor details
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const vendor = await Vendor.findOne({ username: service.vendorUsername });
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if service is available for the selected date
        if (service.blockedDates && service.blockedDates.includes(eventDate)) {
            return res.status(400).json({ message: 'Service is not available for the selected date' });
        }

        // Calculate amounts
        const totalAmount = service.price;
        const advanceAmount = Math.round(totalAmount * 0.05); // 5% advance

        // Create booking
        const booking = new Booking({
            customerId,
            vendorId: vendor._id,
            serviceId,
            eventDate,
            totalAmount,
            advanceAmount,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            serviceName: service.name,
            vendorName: vendor.name,
            notes
        });

        await booking.save();

        // Also add booking to the old system for compatibility with customer bookings display
        const oldSystemBooking = {
            customerId: customer._id,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            bookedForDate: eventDate,
            dateBooked: new Date(),
            status: 'pending'
        };
        
        if (!service.bookings) {
            service.bookings = [];
        }
        service.bookings.push(oldSystemBooking);
        
        // Add service to customer's booked services (if not already there)
        if (!customer.bookedServiceIds.includes(serviceId)) {
            customer.bookedServiceIds.push(serviceId);
        }
        
        // Save both service and customer
        await Promise.all([service.save(), customer.save()]);

        // Create notification for vendor
        const vendorNotification = new Notification({
            recipientId: vendor._id,
            recipientType: 'vendor',
            type: 'booking_request',
            title: 'New Booking Request',
            message: `${customer.name} has requested to book ${service.name} for ${eventDate}`,
            bookingId: booking._id,
            serviceId,
            actionUrl: `/vendor/bookings/${booking._id}`
        });

        console.log('Creating vendor notification:', {
            recipientId: vendor._id,
            recipientType: 'vendor',
            vendorId: vendor._id,
            vendorName: vendor.name
        });

        await vendorNotification.save();
        console.log('Vendor notification saved successfully');

        res.status(201).json({
            message: 'Booking request created successfully',
            booking
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get bookings for customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const bookings = await Booking.find({ customerId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching customer bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get bookings for vendor
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const bookings = await Booking.find({ vendorId }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching vendor bookings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Vendor approve/reject booking
router.put('/:bookingId/approve', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, vendorNotes } = req.body; // status: 'approved' or 'rejected'

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = status;
        booking.vendorNotes = vendorNotes;
        booking.vendorApprovalDate = new Date();

        if (status === 'approved') {
            // Set payment expiry to 12 hours from now
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 12);
            booking.advancePaymentExpiry = expiryDate;
        }

        await booking.save();

        // Update the old system booking status
        const service = await Service.findById(booking.serviceId);
        if (service && service.bookings) {
            const oldBooking = service.bookings.find(b => 
                b.customerId.toString() === booking.customerId.toString() && 
                b.bookedForDate === booking.eventDate
            );
            if (oldBooking) {
                oldBooking.status = status === 'approved' ? 'confirmed' : 'cancelled';
                await service.save();
            }
        }

        // Create notification for customer
        const notificationType = status === 'approved' ? 'booking_approved' : 'booking_rejected';
        const notificationTitle = status === 'approved' ? 'Booking Approved' : 'Booking Rejected';
        const notificationMessage = status === 'approved' 
            ? `Your booking for ${booking.serviceName} has been approved. Please pay the advance amount of ₹${booking.advanceAmount} within 12 hours.`
            : `Your booking for ${booking.serviceName} has been rejected.`;

        const customerNotification = new Notification({
            recipientId: booking.customerId,
            recipientType: 'customer',
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            bookingId: booking._id,
            serviceId: booking.serviceId,
            actionUrl: status === 'approved' ? `/payment/${booking._id}` : `/bookings/${booking._id}`,
            metadata: status === 'approved' ? {
                advanceAmount: booking.advanceAmount,
                expiryDate: booking.advancePaymentExpiry
            } : {}
        });

        await customerNotification.save();

        res.json({
            message: `Booking ${status} successfully`,
            booking
        });

    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create UPI payment for advance amount
router.post('/:bookingId/create-payment', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'approved') {
            return res.status(400).json({ message: 'Booking must be approved before payment' });
        }

        if (booking.advanceAmountPaid) {
            return res.status(400).json({ message: 'Advance payment already completed' });
        }

        // Check if payment has expired
        if (new Date() > booking.advancePaymentExpiry) {
            booking.status = 'cancelled';
            await booking.save();
            return res.status(400).json({ message: 'Payment time has expired' });
        }

        // Get vendor details
        const vendor = await Vendor.findById(booking.vendorId);
        if (!vendor || !vendor.upiId) {
            return res.status(400).json({ message: 'Vendor UPI ID not found' });
        }

        // Generate UPI QR code
        const paymentData = await upiConfig.generateUPIQR(
            vendor.upiId,
            booking.advanceAmount,
            vendor.businessName,
            `Advance payment for ${booking.serviceName} - EventGenie`
        );

        res.json({
            upiId: vendor.upiId,
            qrCodeDataURL: paymentData.qrCodeDataURL,
            upiUrl: paymentData.upiUrl,
            amount: booking.advanceAmount,
            vendorName: vendor.businessName,
            serviceName: booking.serviceName
        });

    } catch (error) {
        console.error('Error creating UPI payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Verify UPI payment
router.post('/:bookingId/verify-payment', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { transactionId, upiId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Get vendor details
        const vendor = await Vendor.findById(booking.vendorId);
        if (!vendor || vendor.upiId !== upiId) {
            return res.status(400).json({ message: 'Invalid UPI ID' });
        }

        // In a real implementation, you would verify the transaction with the bank/UPI provider
        // For now, we'll simulate successful payment verification
        // TODO: Integrate with actual UPI payment verification API

        // Update booking - mark as pending vendor verification
        booking.upiTransactionId = transactionId;
        booking.advancePaymentDate = new Date();
        booking.status = 'payment_pending_verification';
        booking.paymentVerificationStatus = 'pending';

        await booking.save();

        // Create notification for vendor
        const vendorNotification = new Notification({
            recipientId: booking.vendorId,
            recipientType: 'vendor',
            type: 'payment_pending_verification',
            title: 'Payment Verification Required',
            message: `Customer has submitted payment for ₹${booking.advanceAmount}. Please verify the transaction ID: ${transactionId}`,
            bookingId: booking._id,
            serviceId: booking.serviceId,
            actionUrl: `/vendor/bookings/${booking._id}`
        });

            await vendorNotification.save();

            // Create notification for customer
            const customerNotification = new Notification({
                recipientId: booking.customerId,
                recipientType: 'customer',
                type: 'payment_submitted',
                title: 'Payment Submitted',
                message: `Your payment of ₹${booking.advanceAmount} has been submitted. Waiting for vendor verification.`,
                bookingId: booking._id,
                serviceId: booking.serviceId,
                actionUrl: `/bookings/${booking._id}`
            });

            await customerNotification.save();

            res.json({
                message: 'Payment submitted successfully. Waiting for vendor verification.',
                booking
            });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Vendor verify payment
router.post('/:bookingId/verify-payment-by-vendor', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { verificationStatus, notes } = req.body; // verificationStatus: 'verified' or 'failed'

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status !== 'payment_pending_verification') {
            return res.status(400).json({ message: 'Payment is not pending verification' });
        }

        // Update booking based on verification result
        if (verificationStatus === 'verified') {
            booking.status = 'advance_paid';
            booking.advanceAmountPaid = true;
            booking.paymentVerificationStatus = 'verified';
            booking.vendorPaymentVerificationDate = new Date();
            booking.vendorPaymentVerificationNotes = notes || 'Payment verified successfully';

            // Block the date on the service and update old system
            const service = await Service.findById(booking.serviceId);
            if (service) {
                // Initialize blockedDates if it doesn't exist
                if (!service.blockedDates) {
                    service.blockedDates = [];
                }
                
                if (!service.blockedDates.includes(booking.eventDate)) {
                    service.blockedDates.push(booking.eventDate);
                }
                
                // Update the old system booking status to confirmed
                if (service.bookings) {
                    const oldBooking = service.bookings.find(b => 
                        b.customerId.toString() === booking.customerId.toString() && 
                        b.bookedForDate === booking.eventDate
                    );
                    if (oldBooking) {
                        oldBooking.status = 'confirmed';
                    }
                }
                
                await service.save();
            }

            // Update vendor revenue and customer expenditure
            try {
                const vendor = await Vendor.findById(booking.vendorId);
                const customer = await Customer.findById(booking.customerId);
                if (vendor) {
                    vendor.revenue = (vendor.revenue || 0) + (booking.advanceAmount || 0);
                    await vendor.save();
                }
                if (customer) {
                    customer.expenditure = (customer.expenditure || 0) + (booking.advanceAmount || 0);
                    await customer.save();
                }
            } catch (e) {
                console.error('Failed to update revenue/expenditure on advance verification:', e?.message || e);
            }

            // Create notification for customer
            const customerNotification = new Notification({
                recipientId: booking.customerId,
                recipientType: 'customer',
                type: 'payment_verified',
                title: 'Payment Verified',
                message: `Your payment of ₹${booking.advanceAmount} has been verified by the vendor. Booking confirmed!`,
                bookingId: booking._id,
                serviceId: booking.serviceId,
                actionUrl: `/bookings/${booking._id}`
            });

            await customerNotification.save();

            res.json({
                message: 'Payment verified successfully. Booking confirmed.',
                booking
            });
        } else if (verificationStatus === 'failed') {
            booking.status = 'payment_failed';
            booking.paymentVerificationStatus = 'failed';
            booking.vendorPaymentVerificationDate = new Date();
            booking.vendorPaymentVerificationNotes = notes || 'Payment verification failed';

            // Update the old system booking status to cancelled
            const service = await Service.findById(booking.serviceId);
            if (service && service.bookings) {
                const oldBooking = service.bookings.find(b => 
                    b.customerId.toString() === booking.customerId.toString() && 
                    b.bookedForDate === booking.eventDate
                );
                if (oldBooking) {
                    oldBooking.status = 'cancelled';
                    await service.save();
                }
            }

            // Create notification for customer
            const customerNotification = new Notification({
                recipientId: booking.customerId,
                recipientType: 'customer',
                type: 'payment_failed',
                title: 'Payment Verification Failed',
                message: `Your payment verification failed. Please contact the vendor or try again.`,
                bookingId: booking._id,
                serviceId: booking.serviceId,
                actionUrl: `/bookings/${booking._id}`
            });

            await customerNotification.save();

            res.json({
                message: 'Payment verification failed. Customer notified.',
                booking
            });
        } else {
            return res.status(400).json({ message: 'Invalid verification status' });
        }

        await booking.save();

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get booking by ID
router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
