// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Chat = require('./models/Chat');
const Notification = require('./models/Notification');
require('dotenv').config();

// Import cron jobs
require('./cronJobs');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventgenie';

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));

// Root route
app.get('/', (req, res) => {
    res.send('EventGenie Backend is Running 🚀');
});

// Start server
// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    // Client joins a conversation room by chatId
    socket.on('joinConversation', ({ chatId }) => {
        if (!chatId) return;
        socket.join(`chat:${chatId}`);
    });

    // Client sends a message; server saves to DB and emits to room
    socket.on('sendMessage', async (payload, ack) => {
        try {
            const { chatId, senderModel, senderId, receiverModel, receiverId, content } = payload || {};
            if (!chatId || !senderModel || !senderId || !receiverModel || !receiverId || !content?.trim()) {
                if (ack) ack({ ok: false, message: 'Invalid payload' });
                return;
            }
            const chat = await Chat.findById(chatId);
            if (!chat) {
                if (ack) ack({ ok: false, message: 'Chat not found' });
                return;
            }
            // Guard participants
            if (senderModel === 'Customer' && String(chat.customer) !== String(senderId)) return;
            if (senderModel === 'Vendor' && String(chat.vendor) !== String(senderId)) return;
            if (receiverModel === 'Customer' && chat.customer && String(chat.customer) !== String(receiverId)) return;
            if (receiverModel === 'Vendor' && chat.vendor && String(chat.vendor) !== String(receiverId)) return;

            const message = {
                senderModel,
                sender: senderId,
                receiverModel,
                receiver: receiverId,
                content: content.trim(),
                timestamp: new Date(),
            };
            chat.messages.push(message);
            chat.lastMessageAt = new Date();
            
            // Update unread count for the receiver
            if (receiverModel === 'Customer') {
                chat.unreadCount.customer = (chat.unreadCount.customer || 0) + 1;
            } else if (receiverModel === 'Vendor') {
                chat.unreadCount.vendor = (chat.unreadCount.vendor || 0) + 1;
            }
            
            await chat.save();

            io.to(`chat:${chatId}`).emit('receiveMessage', { chatId, message });

            // Create notification for the receiver
            try {
                let recipientType = null;
                let recipientId = null;
                let title = 'New Message';
                const messageText = content.trim();
                let actionUrl = '';

                if (receiverModel === 'Customer') {
                    recipientType = 'customer';
                    recipientId = chat.customer;
                    title = 'New message from vendor';
                    actionUrl = `/customer/profile?openChat=1&chatId=${encodeURIComponent(chatId)}&vendorId=${encodeURIComponent(String(chat.vendor))}&category=${encodeURIComponent(chat.serviceCategory)}`;
                } else if (receiverModel === 'Vendor') {
                    recipientType = 'vendor';
                    recipientId = chat.vendor;
                    title = 'New message from customer';
                    actionUrl = `/vendor/vendor-dashboard?openChat=1&chatId=${encodeURIComponent(chatId)}`;
                }

                if (recipientType && recipientId) {
                    const notif = new Notification({
                        recipientId: recipientId,
                        recipientType,
                        type: 'chat_message',
                        title,
                        message: messageText,
                        actionUrl,
                        metadata: { chatId, senderModel, senderId, receiverModel, receiverId }
                    });
                    await notif.save();
                    console.log(`Created ${recipientType} notification (socket) for ${recipientId}:`, {
                        title,
                        message: messageText,
                        actionUrl
                    });
                } else {
                    console.log('No notification created (socket) - missing recipient info:', {
                        recipientType,
                        recipientId,
                        receiverModel,
                        chatCustomer: chat.customer,
                        chatVendor: chat.vendor
                    });
                }
            } catch (e) {
                console.error('Failed to create chat notification (socket):', e?.message || e);
            }
            if (ack) ack({ ok: true });
        } catch (err) {
            if (ack) ack({ ok: false, message: err?.message || 'Failed' });
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
