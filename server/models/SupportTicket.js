const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    senderType: { type: String, enum: ['admin', 'vendor', 'customer'], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: false },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const supportTicketSchema = new mongoose.Schema({
    type: { type: String, enum: ['report', 'query'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['customer', 'vendor'], required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    replies: [replySchema]
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);


