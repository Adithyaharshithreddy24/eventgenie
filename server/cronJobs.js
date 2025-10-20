const cron = require('node-cron');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');
const Vendor = require('./models/Vendor');
const Customer = require('./models/Customer');

// 48h prior reminder for remaining 95%
cron.schedule('0 * * * *', async () => {
    try {
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Find bookings with eventDate ~48h ahead and advance already paid
        const candidates = await Booking.find({
            status: { $in: ['advance_paid', 'confirmed'] },
            advanceAmountPaid: true
        });

        for (const booking of candidates) {
            const eventDate = new Date(booking.eventDate);
            const diffHrs = (eventDate - now) / (1000 * 60 * 60);
            if (diffHrs <= 48 && diffHrs > 47) {
                // Send notification with QR for remaining 95%
                const remainingAmount = Math.max(0, Math.round(booking.totalAmount * 0.95));
                const vendor = await Vendor.findById(booking.vendorId);
                if (!vendor?.upiId) continue;
                const { generateUPIQR } = require('./config/upi');
                const qr = await generateUPIQR(vendor.upiId, remainingAmount, vendor.businessName || vendor.name || 'Vendor', `Remaining 95% for ${booking.serviceName}`);

                const customerNotification = new Notification({
                    recipientId: booking.customerId,
                    recipientType: 'customer',
                    type: 'final_payment_request',
                    title: 'Final Payment Due (95%)',
                    message: `Please complete remaining 95% (₹${remainingAmount}) for ${booking.serviceName}.`,
                    bookingId: booking._id,
                    serviceId: booking.serviceId,
                    actionUrl: `/bookings/${booking._id}`,
                    metadata: { upi: qr }
                });
                await customerNotification.save();
            }
        }
    } catch (e) {
        console.error('Error scheduling 48h payment reminders:', e);
    }
});

// Run every hour to check for expired payments
cron.schedule('0 * * * *', async () => {
    try {
        console.log('Running expired payment check...');
        
        const now = new Date();
        
        // Find bookings with expired payments
        const expiredBookings = await Booking.find({
            status: 'approved',
            advancePaymentExpiry: { $lt: now },
            advanceAmountPaid: false
        });

        for (const booking of expiredBookings) {
            // Update booking status to cancelled
            booking.status = 'cancelled';
            await booking.save();

            // Create notification for customer
            const customerNotification = new Notification({
                recipientId: booking.customerId,
                recipientType: 'customer',
                type: 'payment_expired',
                title: 'Payment Expired',
                message: `Your advance payment for ${booking.serviceName} has expired. The booking has been cancelled.`,
                bookingId: booking._id,
                serviceId: booking.serviceId,
                actionUrl: `/bookings/${booking._id}`
            });

            await customerNotification.save();

            // Create notification for vendor
            const vendorNotification = new Notification({
                recipientId: booking.vendorId,
                recipientType: 'vendor',
                type: 'payment_expired',
                title: 'Payment Expired',
                message: `Advance payment for ${booking.serviceName} has expired. The booking has been cancelled.`,
                bookingId: booking._id,
                serviceId: booking.serviceId,
                actionUrl: `/vendor/bookings/${booking._id}`
            });

            await vendorNotification.save();
        }

        console.log(`Processed ${expiredBookings.length} expired bookings`);
    } catch (error) {
        console.error('Error in expired payment cron job:', error);
    }
});

console.log('Cron jobs initialized');
