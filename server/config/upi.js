const QRCode = require('qrcode');

// UPI Payment configuration
const upiConfig = {
    // Generate UPI QR code for payment
    generateUPIQR: async (upiId, amount, name, description) => {
        try {
            // Create UPI payment URL
            const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(description)}&cu=INR`;
            
            // Generate QR code
            const qrCodeDataURL = await QRCode.toDataURL(upiUrl);
            
            return {
                upiUrl,
                qrCodeDataURL,
                upiId,
                amount,
                name,
                description
            };
        } catch (error) {
            console.error('Error generating UPI QR code:', error);
            throw error;
        }
    },

    // Validate UPI ID format
    validateUPIId: (upiId) => {
        // Basic UPI ID validation (format: name@bank)
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
        return upiRegex.test(upiId);
    },

    // Create payment request
    createPaymentRequest: (upiId, amount, name, description) => {
        return {
            upiId,
            amount,
            name,
            description,
            currency: 'INR',
            timestamp: new Date().toISOString()
        };
    }
};

module.exports = upiConfig;
