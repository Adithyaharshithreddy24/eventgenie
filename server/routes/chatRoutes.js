const express = require('express');
const Chat = require('../models/Chat');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');

const router = express.Router();

// Helper to create system greeting message
function systemGreeting(toModel, toId) {
    return {
        senderModel: 'System',
        receiverModel: toModel,
        receiver: toId,
        content: 'Hello there! How can we assist you today?',
        timestamp: new Date(),
    };
}

// Start or get existing chat between a customer and a vendor for a service category
router.post('/start', async (req, res) => {
    try {
        const { customerId, vendorId, serviceCategory } = req.body;
        if (!customerId || !vendorId || !serviceCategory) {
            return res.status(400).json({ message: 'customerId, vendorId, serviceCategory are required' });
        }

        const validCategories = ['Venue', 'Catering', 'Decor', 'Entertainment'];
        if (!validCategories.includes(serviceCategory)) {
            return res.status(400).json({ message: 'Invalid serviceCategory' });
        }

        const customer = await Customer.findById(customerId);
        const vendor = await Vendor.findById(vendorId);
        if (!customer || !vendor) return res.status(404).json({ message: 'Customer or Vendor not found' });

        let chat = await Chat.findOne({ customer: customerId, vendor: vendorId, serviceCategory });
        if (!chat) {
            chat = new Chat({
                customer: customerId,
                vendor: vendorId,
                serviceCategory,
                participants: [
                    { role: 'Customer', model: 'Customer', user: customerId, name: customer.name },
                    { role: 'Vendor', model: 'Vendor', user: vendorId, name: vendor.name }
                ],
                messages: [systemGreeting('Customer', customerId)],
                lastMessageAt: new Date(),
            });
            await chat.save();
        }

        res.json({ chat });
    } catch (err) {
        console.error(err);
        if (err && err.code === 11000) {
            const { customerId, vendorId, serviceCategory } = req.body || {};
            const chat = await Chat.findOne({ customer: customerId, vendor: vendorId, serviceCategory });
            if (chat) return res.json({ chat });
        }
        res.status(500).json({ message: err.message });
    }
});

// Fetch chats for a customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const chats = await Chat.find({ customer: customerId }).sort({ lastMessageAt: -1 });
        res.json({ chats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Fetch chats for a vendor
router.get('/vendor/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const chats = await Chat.find({ vendor: vendorId }).sort({ lastMessageAt: -1 });
        res.json({ chats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Fetch all chats for admin (monitoring)
router.get('/admin/all', async (_req, res) => {
    try {
        const chats = await Chat.find({}).sort({ lastMessageAt: -1 });
        res.json({ chats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: start chat with any customer or vendor
router.post('/admin/start', async (req, res) => {
    try {
        const { adminId, customerId, vendorId, serviceCategory } = req.body;
        if (!adminId || !serviceCategory || (!customerId && !vendorId)) {
            return res.status(400).json({ message: 'adminId, serviceCategory and at least one participant required' });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const customer = customerId ? await Customer.findById(customerId) : null;
        const vendor = vendorId ? await Vendor.findById(vendorId) : null;

        let chat = (customerId && vendorId)
            ? await Chat.findOne({ customer: customerId, vendor: vendorId, serviceCategory })
            : null;

        if (!chat) {
            chat = new Chat({
                customer: customerId || undefined,
                vendor: vendorId || undefined,
                serviceCategory,
                participants: [
                    ...(customer ? [{ role: 'Customer', model: 'Customer', user: customerId, name: customer.name }] : []),
                    ...(vendor ? [{ role: 'Vendor', model: 'Vendor', user: vendorId, name: vendor.name }] : []),
                    { role: 'Admin', model: 'Admin', user: adminId, name: admin.name }
                ],
                messages: [systemGreeting(customer ? 'Customer' : (vendor ? 'Vendor' : 'Admin'), customerId || vendorId || adminId)],
                lastMessageAt: new Date(),
            });
            await chat.save();
        } else {
            const hasAdmin = chat.participants.some(p => p.role === 'Admin' && String(p.user) === String(adminId));
            if (!hasAdmin) {
                chat.participants.push({ role: 'Admin', model: 'Admin', user: adminId, name: admin.name });
                await chat.save();
            }
        }

        res.json({ chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: join existing chat
router.post('/admin/:chatId/join', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { adminId } = req.body;

        if (!adminId) return res.status(400).json({ message: 'adminId required' });

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const hasAdmin = chat.participants.some(p => p.role === 'Admin' && String(p.user) === String(adminId));
        if (!hasAdmin) {
            const admin = await Admin.findById(adminId);
            chat.participants.push({ role: 'Admin', model: 'Admin', user: adminId, name: admin?.name || 'Admin' });
            await chat.save();
        }

        res.json({ chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: send auto message
router.post('/admin/:chatId/auto-message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { adminId, templateKey } = req.body;

        if (!adminId) return res.status(400).json({ message: 'adminId required' });

        const templates = {
            apology: 'We apologize for the inconvenience. Our team is looking into your issue.',
            welcome: 'Hello! Admin has joined this chat to assist further.',
        };
        const content = templates[templateKey] || templates.apology;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const admin = await Admin.findById(adminId);
        if (!chat.participants.some(p => p.role === 'Admin' && String(p.user) === String(adminId))) {
            chat.participants.push({ role: 'Admin', model: 'Admin', user: adminId, name: admin?.name || 'Admin' });
        }

        const message = {
            senderModel: 'Admin',
            sender: adminId,
            receiverModel: 'Customer',
            receiver: chat.customer || adminId,
            content,
            timestamp: new Date()
        };

        chat.messages.push(message);
        chat.lastMessageAt = new Date();
        await chat.save();

        res.json({ chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send a message in a chat
router.post('/:chatId/send', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderModel, senderId, receiverModel, receiverId, content } = req.body;

        const allowedSender = ['Customer', 'Vendor', 'Admin'];
        const allowedReceiver = ['Customer', 'Vendor', 'Admin'];
        if (!allowedSender.includes(senderModel) || !allowedReceiver.includes(receiverModel)) {
            return res.status(400).json({ message: 'Invalid senderModel or receiverModel' });
        }
        if (!content || !content.trim()) return res.status(400).json({ message: 'Message content required' });

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        if (senderModel === 'Customer' && String(chat.customer) !== String(senderId)) {
            return res.status(400).json({ message: 'Sender does not belong to this chat' });
        }
        if (senderModel === 'Vendor' && String(chat.vendor) !== String(senderId)) {
            return res.status(400).json({ message: 'Sender does not belong to this chat' });
        }

        chat.messages.push({
            senderModel,
            sender: senderId,
            receiverModel,
            receiver: receiverId,
            content: content.trim(),
            timestamp: new Date(),
        });
        chat.lastMessageAt = new Date();
        await chat.save();

        res.json({ message: 'Sent', chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
