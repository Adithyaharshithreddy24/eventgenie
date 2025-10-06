const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get notifications for a user (customer or vendor)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, unreadOnly = false, recipientType } = req.query;

        let query = { recipientId: userId };
        if (recipientType) {
            query.recipientType = recipientType;
        }
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark all notifications as read for a user
router.put('/:userId/read-all', async (req, res) => {
    try {
        const { userId } = req.params;
        
        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get unread notification count
router.get('/:userId/unread-count', async (req, res) => {
    try {
        const { userId } = req.params;
        const { recipientType } = req.query;
        
        const countQuery = { recipientId: userId, isRead: false };
        if (recipientType) {
            countQuery.recipientType = recipientType;
        }

        const count = await Notification.countDocuments(countQuery);

        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findByIdAndDelete(notificationId);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
