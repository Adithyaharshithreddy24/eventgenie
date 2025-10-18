import './style.css';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API_BASE_URL from './config/api';

function Navbar({ isLoggedIn, isVendorLoggedIn, currentCustomer, currentVendor, logout, vendorTab, setVendorTab, selectedServices = [], onNotificationClick }) {
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const isAdminLoggedIn = !!localStorage.getItem('adminSession');

    const fetchUnreadCount = async () => {
        const userId = currentCustomer?.id || currentVendor?.id;
        const recipientType = currentCustomer ? 'customer' : (currentVendor ? 'vendor' : null);

        console.log('Navbar fetchUnreadCount - userId:', userId, 'recipientType:', recipientType);

        if (!userId || !recipientType) {
            console.log('Navbar fetchUnreadCount - Missing userId or recipientType');
            return;
        }

        try {
            const url = `${API_BASE_URL}/api/notifications/${userId}/unread-count?recipientType=${recipientType}`;
            console.log('Navbar fetchUnreadCount - Fetching from:', url);

            const response = await fetch(url);
            console.log('Navbar fetchUnreadCount - Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Navbar fetchUnreadCount - Response data:', data);
                setUnreadCount(data.count);
            } else {
                const errorText = await response.text();
                console.error('Navbar fetchUnreadCount - Error response:', errorText);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        // Listen for refresh notifications event
        const handleRefreshNotifications = () => {
            fetchUnreadCount();
        };

        window.addEventListener('refreshNotifications', handleRefreshNotifications);

        return () => {
            clearInterval(interval);
            window.removeEventListener('refreshNotifications', handleRefreshNotifications);
        };
    }, [currentCustomer?.id, currentVendor?.id]);

    const handleAdminLogout = () => {
        localStorage.removeItem('adminSession');
        navigate('/');
    };
    return (
        <header className="fade-in">
            <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
                {isAdminLoggedIn && <h1>EventGenie Admin Dashboard</h1>}
                {!isAdminLoggedIn && <h1>EventGenie</h1>}
            </div>

            <nav>
                <ul className={isVendorLoggedIn ? 'flex gap-4 items-center' : ''} style={isVendorLoggedIn ? { margin: 0 } : {}}>
                    {isAdminLoggedIn ? (
                        <>
                            <li>
                                <button className="btn secondary-btn" onClick={handleAdminLogout}>
                                    <i className="fas fa-sign-out-alt"></i> Admin Logout
                                </button>
                            </li></>
                    ) :
                        isVendorLoggedIn ? (
                            <>
                                <li>
                                    <a href="#" className={vendorTab === 'services' ? 'active' : ''} onClick={e => { e.preventDefault(); setVendorTab('services'); navigate('/vendor-dashboard'); }}>
                                        <i className="fas fa-concierge-bell"></i> My Services
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className={vendorTab === 'chats' ? 'active' : ''} onClick={e => { e.preventDefault(); setVendorTab('chats'); navigate('/vendor-dashboard'); }}>
                                        <i className="fas fa-comments"></i> Chats
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className={vendorTab === 'bookings' ? 'active' : ''} onClick={e => { e.preventDefault(); setVendorTab('bookings'); navigate('/vendor-dashboard'); }}>
                                        <i className="fas fa-calendar-check"></i> Bookings
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className={vendorTab === 'block' ? 'active' : ''} onClick={e => { e.preventDefault(); setVendorTab('block'); navigate('/vendor-dashboard'); }}>
                                        <i className="fas fa-ban"></i> Block Services
                                    </a>
                                </li>
                                <li>
                                    <NavLink to="/support" className={({ isActive }) => isActive ? 'active' : ''}>Help & Support</NavLink>
                                </li>
                                <li>
                                    <a href="#" className={vendorTab === 'profile' ? 'active' : ''} onClick={e => { e.preventDefault(); setVendorTab('profile'); navigate('/vendor-dashboard'); }}>
                                        <i className="fas fa-user"></i> Profile
                                    </a>
                                </li>
                                <li>
                                    <button
                                        className="notification-btn"
                                        onClick={onNotificationClick}
                                        title="Notifications"
                                    >
                                        <i className="fas fa-bell"></i>
                                        {unreadCount > 0 && (
                                            <span className="notification-badge">{unreadCount}</span>
                                        )}
                                    </button>
                                </li>
                            </>
                        ) : isLoggedIn ? (
                            <>
                                <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
                                <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
                                <li>
                                    <NavLink to="/mycart" className={({ isActive }) => isActive ? 'active' : ''}>
                                        MyCart
                                        {selectedServices.length > 0 && (
                                            <span style={{
                                                background: '#e74c3c',
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '2px 6px',
                                                fontSize: '0.7rem',
                                                marginLeft: '4px',
                                                minWidth: '16px',
                                                display: 'inline-block',
                                                textAlign: 'center'
                                            }}>
                                                {selectedServices.length}
                                            </span>
                                        )}
                                    </NavLink>
                                </li>
                                <li><NavLink to="/support" className={({ isActive }) => isActive ? 'active' : ''}>Help & Support</NavLink></li>
                                <li><NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink></li>
                                <li>
                                    <button
                                        className="notification-btn"
                                        onClick={onNotificationClick}
                                        title="Notifications"
                                    >
                                        <i className="fas fa-bell"></i>
                                        {unreadCount > 0 && (
                                            <span className="notification-badge">{unreadCount}</span>
                                        )}
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink></li>
                                <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
                                <li><NavLink to="/budget-calculator" className={({ isActive }) => isActive ? 'active' : ''}>Budget Calculator</NavLink></li>
                                <NavLink to="/login" className={({ isActive }) => isActive ? 'btn btn-primary hover-effect active-login' : 'btn btn-primary hover-effect'}>Login/Register</NavLink>
                            </>
                        )}
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;
