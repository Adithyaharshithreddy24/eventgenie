const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');

// Create ticket
router.post('/create', async (req, res) => {
    try {
        const { type, userId, userType, subject, message } = req.body;
        if (!type || !userId || !userType || !subject || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const ticket = new SupportTicket({ type, userId, userType, subject, message });
        await ticket.save();
        res.json({ message: 'Ticket created', ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// List tickets for admin
router.get('/admin/list', async (req, res) => {
    try {
        const { type, status } = req.query;
        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;
        const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
        res.json({ tickets });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// List tickets for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { userType } = req.query;
        const query = { userId };
        if (userType) query.userType = userType;
        const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
        res.json({ tickets });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reply to ticket (admin/vendor/customer). Auto-close on admin reply and block if closed
router.post('/:ticketId/reply', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { senderType, senderId, message } = req.body;
        if (!senderType || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (ticket.status === 'closed') {
            return res.status(400).json({ message: 'Ticket is closed' });
        }
        ticket.replies.push({ senderType, senderId, message });
        // Auto-close if admin replied
        if (senderType === 'admin') {
            ticket.status = 'closed';
        }
        await ticket.save();

        // Send notification to ticket owner on admin reply
        if (senderType === 'admin') {
            try {
                await Notification.create({
                    recipientId: ticket.userId,
                    recipientType: ticket.userType,
                    type: 'support_reply',
                    title: 'Support reply',
                    message: `Your ${ticket.type} has been answered: ${ticket.subject}`,
                    actionUrl: '/support',
                    metadata: { ticketId: ticket._id.toString() }
                });
            } catch (e) {
                // best effort
                console.error('Failed to create notification for support reply', e);
            }
        }

        res.json({ message: 'Reply added', ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update status
router.put('/:ticketId/status', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        const allowed = ['open', 'in_progress', 'resolved', 'closed'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
        const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.json({ message: 'Status updated', ticket });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;


