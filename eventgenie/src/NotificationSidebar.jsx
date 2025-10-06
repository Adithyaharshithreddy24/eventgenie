import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './NotificationSidebar.css';
import API_BASE_URL from './config/api';

const NotificationSidebar = ({ userId, userType, isOpen , onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}?recipientType=${userType}`);
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    // Listen for refresh notifications event
    useEffect(() => {
        const handleRefreshNotifications = () => {
            fetchNotifications();
            fetchUnreadCount();
        };

        window.addEventListener('refreshNotifications', handleRefreshNotifications);
        return () => {
            window.removeEventListener('refreshNotifications', handleRefreshNotifications);
        };
    }, [userId]);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}/unread-count?recipientType=${userType}`);
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (response.ok) {
                setNotifications(prev => 
                    prev.map(notif => 
                        notif._id === notificationId 
                            ? { ...notif, isRead: true }
                            : notif
                    )
                );
                fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}/read-all`, {
                method: 'PUT'
            });
            if (response.ok) {
                setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Failed to mark notifications as read');
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'booking_request':
                return '📋';
            case 'booking_approved':
                return '✅';
            case 'booking_rejected':
                return '❌';
            case 'payment_request':
                return '💰';
            case 'payment_received':
                return '💳';
            case 'payment_expired':
                return '⏰';
            case 'booking_confirmed':
                return '🎉';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'booking_approved':
            case 'payment_received':
            case 'booking_confirmed':
                return 'success';
            case 'booking_rejected':
            case 'payment_expired':
                return 'error';
            case 'payment_request':
                return 'warning';
            default:
                return 'info';
        }
    };

    useEffect(() => {
        if (userId) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [userId]);

    useEffect(() => {
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            if (userId) {
                fetchUnreadCount();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [userId]);

    if (!isOpen) return null;
  
    return (
        <div className="notification-sidebar-overlay" onClick={onClose}>
            <div className="notification-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="notification-actions">
                        {unreadCount > 0 && (
                            <button 
                                className="mark-all-read-btn"
                                onClick={markAllAsRead}
                            >
                                Mark all read
                            </button>
                        )}
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="notification-content">
                    {loading ? (
                        <div className="loading">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="no-notifications">
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification._id} 
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getNotificationColor(notification.type)}`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead(notification._id);
                                        }
                                        if (notification.actionUrl) {
                                            window.location.href = notification.actionUrl;
                                        }
                                    }}
                                >
                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>
                                        <div className="notification-time">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="unread-indicator"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSidebar;
