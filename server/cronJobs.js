const cron = require('node-cron');
const Booking = require('./models/Booking');
const Notification = require('./models/Notification');

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
