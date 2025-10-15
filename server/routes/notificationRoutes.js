const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get notifications for a user (customer or vendor)
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, unreadOnly = false, recipientType } = req.query;

        console.log('Notification fetch - userId:', userId, 'recipientType:', recipientType);

        // Convert userId to ObjectId if it's a valid ObjectId string
        let recipientId = userId;
        try {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                recipientId = new mongoose.Types.ObjectId(userId);
            }
        } catch (error) {
            console.log('Invalid ObjectId format:', userId);
        }

        let query = { recipientId: recipientId };
        if (recipientType) {
            query.recipientType = recipientType;
        }
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        console.log('Notification fetch - Query:', query);

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        console.log('Notification fetch - Found notifications:', notifications.length);

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
        
        console.log('Notification unread-count - userId:', userId, 'recipientType:', recipientType);
        
        // Convert userId to ObjectId if it's a valid ObjectId string
        let recipientId = userId;
        try {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                recipientId = new mongoose.Types.ObjectId(userId);
            }
        } catch (error) {
            console.log('Invalid ObjectId format:', userId);
        }
        
        const countQuery = { recipientId: recipientId, isRead: false };
        if (recipientType) {
            countQuery.recipientType = recipientType;
        }

        console.log('Notification unread-count - Query:', countQuery);

        const count = await Notification.countDocuments(countQuery);
        
        console.log('Notification unread-count - Count:', count);

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
