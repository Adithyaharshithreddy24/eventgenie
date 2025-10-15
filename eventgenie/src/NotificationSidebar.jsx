import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import './NotificationSidebar.css';
import API_BASE_URL from './config/api';

const NotificationSidebar = ({ userId, userType, isOpen , onClose }) => {
    const [customerNotifications, setCustomerNotifications] = useState([]);
    const [vendorNotifications, setVendorNotifications] = useState([]);
    const [customerUnreadCount, setCustomerUnreadCount] = useState(0);
    const [vendorUnreadCount, setVendorUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const customerUrl = `${API_BASE_URL}/api/notifications/${userId}?recipientType=customer`;
            const vendorUrl = `${API_BASE_URL}/api/notifications/${userId}?recipientType=vendor`;
            const [customerRes, vendorRes] = await Promise.all([
                fetch(customerUrl),
                fetch(vendorUrl)
            ]);

            if (customerRes.ok) {
                const customerData = await customerRes.json();
                setCustomerNotifications(Array.isArray(customerData) ? customerData : []);
            } else {
                const errorText = await customerRes.text();
                console.error('NotificationSidebar fetchNotifications - Customer error response:', errorText);
            }

            if (vendorRes.ok) {
                const vendorData = await vendorRes.json();
                setVendorNotifications(Array.isArray(vendorData) ? vendorData : []);
            } else {
                const errorText = await vendorRes.text();
                console.error('NotificationSidebar fetchNotifications - Vendor error response:', errorText);
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
            const [customerRes, vendorRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/notifications/${userId}/unread-count?recipientType=customer`),
                fetch(`${API_BASE_URL}/api/notifications/${userId}/unread-count?recipientType=vendor`)
            ]);
            if (customerRes.ok) {
                const customerData = await customerRes.json();
                setCustomerUnreadCount(customerData.count || 0);
            }
            if (vendorRes.ok) {
                const vendorData = await vendorRes.json();
                setVendorUnreadCount(vendorData.count || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notificationId, recipientType) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });
            if (response.ok) {
                if (recipientType === 'customer') {
                    setCustomerNotifications(prev => prev.map(notif => notif._id === notificationId ? { ...notif, isRead: true } : notif));
                } else if (recipientType === 'vendor') {
                    setVendorNotifications(prev => prev.map(notif => notif._id === notificationId ? { ...notif, isRead: true } : notif));
                }
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
                setCustomerNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
                setVendorNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
                setCustomerUnreadCount(0);
                setVendorUnreadCount(0);
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

    const activeRecipientType = userType === 'vendor' ? 'vendor' : 'customer';
    const activeNotifications = activeRecipientType === 'vendor' ? vendorNotifications : customerNotifications;
    const activeUnreadCount = activeRecipientType === 'vendor' ? vendorUnreadCount : customerUnreadCount;

    if (!isOpen) return null;
  
    return createPortal(
        <div className="notification-sidebar-overlay" onClick={onClose}>
            <div className="notification-sidebar" onClick={(e) => e.stopPropagation()}>
                <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="notification-actions">
                        {activeUnreadCount > 0 && (
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
                    ) : activeNotifications.length === 0 ? (
                        <div className="no-notifications">
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {activeNotifications.map((notification) => (
                                <div 
                                    key={notification._id} 
                                    className={`notification-item ${!notification.isRead ? 'unread' : ''} ${getNotificationColor(notification.type)}`}
                                    onClick={() => {
                                        if (!notification.isRead) {
                                            markAsRead(notification._id, activeRecipientType);
                                        }
                                        if (notification.actionUrl) {
                                            const url = notification.actionUrl;
                                            if (activeRecipientType === 'vendor') {
                                                // Ensure vendor dashboard context
                                                window.location.href = url.includes('/vendor') ? url : `/vendor${url.startsWith('/') ? '' : '/'}${url}`;
                                            } else {
                                                // Ensure customer dashboard context
                                                window.location.href = url.includes('/customer') ? url : `/customer${url.startsWith('/') ? '' : '/'}${url}`;
                                            }
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
        </div>,
        document.body
    );
};

export default NotificationSidebar;
