const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderModel: {
        type: String,
        enum: ['Customer', 'Vendor', 'Admin', 'System'],
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'messages.senderModel',
        required: function () { return this.senderModel !== 'System'; }
    },
    receiverModel: {
        type: String,
        enum: ['Customer', 'Vendor', 'Admin'],
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'messages.receiverModel',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const chatSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    participants: [{
        role: { type: String, enum: ['Customer', 'Vendor', 'Admin'], required: true },
        model: { type: String, enum: ['Customer', 'Vendor', 'Admin'], required: true },
        user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'participants.model' },
        name: { type: String, required: true }
    }],
    serviceCategory: {
        type: String,
        enum: ['Venue', 'Catering', 'Decor', 'Entertainment'],
        required: true
    },
    messages: [messageSchema],
    lastMessageAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Frequently queried combinations
chatSchema.index({ customer: 1, vendor: 1, serviceCategory: 1 }, { unique: true });
chatSchema.index({ customer: 1, lastMessageAt: -1 });
chatSchema.index({ vendor: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
