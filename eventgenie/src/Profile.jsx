import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import ServiceDetailsModal from "./ServiceDetailsModal.jsx";
import PopupModal from "./PopupModal.jsx";
import CustomerBookings from "./CustomerBookings.jsx";

function renderStars(rating) {
    // Handle undefined, null, or NaN ratings
    if (!rating || isNaN(rating) || rating < 0) {
        rating = 0;
    }

    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    // Ensure we don't create arrays with negative lengths
    const safeFullStars = Math.max(0, fullStars);
    const safeEmptyStars = Math.max(0, emptyStars);

    return (
        <span>
            {Array(safeFullStars).fill().map((_, i) => <i key={"full-" + i} className="fas fa-star" style={{ color: '#f39c12' }}></i>)}
            {halfStar && <i className="fas fa-star-half-alt" style={{ color: '#f39c12' }}></i>}
            {Array(safeEmptyStars).fill().map((_, i) => <i key={"empty-" + i} className="far fa-star" style={{ color: '#f39c12' }}></i>)}
        </span>
    );
}

function Profile({ customer, logout, toggleService }) {
    const navigate = useNavigate();
    const [editingProfile, setEditingProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({
        name: customer?.name || '',
        username: customer?.username || '',
        password: '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        about: customer?.about || 'I love planning and organizing events!'
    });
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detailedBookings, setDetailedBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [popupModal, setPopupModal] = useState({
        isOpen: false,
        message: '',
        type: 'info'
    });

    if (!customer) {
        navigate('/login');
        return null;
    }

    console.log('Profile component - customer data:', customer);
    console.log('Profile component - customer ID:', customer.id);

    // Fetch detailed bookings when component mounts
    useEffect(() => {
        const fetchDetailedBookings = async () => {
            try {
                setBookingsLoading(true);
                console.log('Fetching detailed bookings for customer:', customer.id);

                const response = await fetch(`http://localhost:5001/api/customers/detailed-bookings/${customer.id}`);
                console.log('Detailed bookings response status:', response.status);

                if (response.ok) {
                    const bookings = await response.json();
                    console.log('Fetched detailed bookings:', bookings);
                    console.log('Number of bookings:', bookings.length);

                    // Log each booking for debugging
                    bookings.forEach((booking, index) => {
                        console.log(`Booking ${index + 1}:`, {
                            serviceName: booking.serviceName,
                            serviceId: booking.serviceId,
                            bookedForDate: booking.bookedForDate,
                            dateBooked: booking.dateBooked,
                            hasReviewed: booking.hasReviewed
                        });
                    });

                    // Log the structure of the first booking to understand the data format
                    if (bookings.length > 0) {
                        console.log('First booking structure:', JSON.stringify(bookings[0], null, 2));
                    }

                    setDetailedBookings(bookings);
                } else {
                    const errorData = await response.json();
                    console.error('Failed to fetch detailed bookings:', errorData);
                    showPopup('Failed to load booking history', 'error');
                }
            } catch (error) {
                console.error('Error fetching detailed bookings:', error);
                showPopup('Network error while loading booking history', 'error');
            } finally {
                setBookingsLoading(false);
            }
        };

        if (customer && customer.id) {
            fetchDetailedBookings();
        }
    }, [customer?.id]);

    const handleProfileChange = (e) => {
        setEditProfileData({
            ...editProfileData,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updateData = { ...editProfileData };
            // Only include password if it's not empty
            if (!updateData.password) {
                delete updateData.password;
            }

            const response = await fetch(`http://localhost:5001/api/customers/profile/${customer.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                showPopup('Profile updated successfully!', 'success');
                setEditingProfile(false);
                // Update the customer data in parent component
                Object.assign(customer, updateData);
                // Clear password field
                setEditProfileData(prev => ({ ...prev, password: '' }));
            } else {
                const errorData = await response.json();
                showPopup(errorData.message || 'Failed to update profile', 'error');
            }
        } catch (error) {
            showPopup('Network error. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openServiceModal = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const closeServiceModal = () => {
        setIsModalOpen(false);
        setSelectedService(null);
    };

    const handleAddToCart = (service) => {
        toggleService(service);
    };

    // Review functionality
    const openReviewModal = (booking) => {
        setSelectedBookingForReview(booking);
        setReviewData({ rating: 5, comment: '' });
        setShowReviewModal(true);
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setSelectedBookingForReview(null);
        setReviewData({ rating: 5, comment: '' });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBookingForReview) return;

        setReviewLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/customers/review/${customer.id}/${selectedBookingForReview.serviceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData),
            });

            if (response.ok) {
                showPopup('Review submitted successfully!', 'success');
                closeReviewModal();
                // Refresh bookings to update review status
                const bookingsResponse = await fetch(`http://localhost:5001/api/customers/detailed-bookings/${customer.id}`);
                if (bookingsResponse.ok) {
                    const updatedBookings = await bookingsResponse.json();
                    setDetailedBookings(updatedBookings);
                }
            } else {
                const errorData = await response.json();
                showPopup(errorData.message || 'Failed to submit review', 'error');
            }
        } catch (error) {
            showPopup('Network error. Please try again.', 'error');
        } finally {
            setReviewLoading(false);
        }
    };

    // Helper function to show popup messages
    const showPopup = (message, type = 'info') => {
        setPopupModal({
            isOpen: true,
            message,
            type
        });
    };

    // Helper function to close popup
    const closePopup = () => {
        setPopupModal({
            isOpen: false,
            message: '',
            type: 'info'
        });
    };

    // Helper function to group bookings by date
    const groupBookingsByDate = (bookings) => {
        // Flatten the booking sessions into individual bookings
        const allBookings = [];
        bookings.forEach(session => {
            if (session.services && Array.isArray(session.services)) {
                session.services.forEach(booking => {
                    allBookings.push(booking);
                });
            }
        });

        const grouped = {};
        allBookings.forEach(booking => {
            const date = booking.bookedForDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(booking);
        });

        // Sort dates and bookings within each date
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        const sortedGrouped = {};
        sortedDates.forEach(date => {
            sortedGrouped[date] = grouped[date].sort((a, b) => new Date(b.dateBooked) - new Date(a.dateBooked));
        });

        return sortedGrouped;
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <section id="profile" className="page active">
            <div className="container">
                <h2 className="section-title">My Profile</h2>

                <div className="profile-layout" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '40px',
                    marginTop: '30px'
                }}>
                    <div className="profile-photo-section" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div className="profile-photo-container" style={{
                            position: 'relative',
                            width: '200px',
                            height: '200px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                        }}>
                            <img
                                src={customer.profilePhoto || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                                alt="Profile"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '1.5rem' }}>
                                {customer.name}
                            </h3>
                            <p style={{ margin: '0', color: '#666', fontSize: '1rem' }}>
                                @{customer.username}
                            </p>
                        </div>
                        <div className="profile-actions" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '40px'
                        }}>
                            <button className="btn secondary-btn" onClick={logout} style={{
                                padding: '12px 24px',
                                fontSize: '1rem'
                            }}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>

                    <div className="profile-info-section">
                        {editingProfile ? (
                            <form onSubmit={handleProfileSave} style={{
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '30px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}>
                                <h4 style={{ marginBottom: '24px', color: '#333', fontSize: '1.3rem' }}>
                                    Edit Profile Information
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editProfileData.name}
                                            onChange={handleProfileChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={editProfileData.username}
                                            onChange={handleProfileChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editProfileData.email}
                                            onChange={handleProfileChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={editProfileData.phone}
                                            onChange={handleProfileChange}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                        New Password (leave blank to keep current)
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={editProfileData.password}
                                        onChange={handleProfileChange}
                                        placeholder="Enter new password"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={editProfileData.address}
                                        onChange={handleProfileChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                        About
                                    </label>
                                    <textarea
                                        name="about"
                                        value={editProfileData.about}
                                        onChange={handleProfileChange}
                                        rows="4"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div className="form-actions" style={{
                                    display: 'flex',
                                    gap: '16px',
                                    marginTop: '30px'
                                }}>
                                    <button type="submit" className="btn primary-btn" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn secondary-btn"
                                        onClick={() => {
                                            setEditingProfile(false);
                                            setEditProfileData({
                                                name: customer?.name || '',
                                                username: customer?.username || '',
                                                password: '',
                                                email: customer?.email || '',
                                                phone: customer?.phone || '',
                                                address: customer?.address || '',
                                                about: customer?.about || 'I love planning and organizing events!'
                                            });
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="profile-info" style={{
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '30px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h4 style={{ margin: '0', color: '#333', fontSize: '1.3rem' }}>
                                        Profile Information
                                    </h4>
                                    <button
                                        className="btn primary-btn"
                                        onClick={() => setEditingProfile(true)}
                                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                                    >
                                        <i className="fas fa-edit"></i> Edit Profile
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="info-item">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                            Full Name
                                        </label>
                                        <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                            {customer.name}
                                        </p>
                                    </div>

                                    <div className="info-item">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                            Username
                                        </label>
                                        <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                            @{customer.username}
                                        </p>
                                    </div>

                                    <div className="info-item">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                            Email
                                        </label>
                                        <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                            {customer.email}
                                        </p>
                                    </div>

                                    <div className="info-item">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                            Phone
                                        </label>
                                        <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                            {customer.phone}
                                        </p>
                                    </div>
                                </div>

                                <div className="info-item" style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                        Address
                                    </label>
                                    <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                        {customer.address}
                                    </p>
                                </div>

                                <div className="info-item" style={{ marginTop: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                        About
                                    </label>
                                    <p style={{ margin: '0', fontSize: '1rem', color: '#333', lineHeight: '1.6' }}>
                                        {customer.about || 'I love planning and organizing events!'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="past-bookings-section" style={{ marginTop: '40px' }}>
                    <CustomerBookings customerId={customer.id} />

                    <div className="bookings-container" style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '30px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        marginTop: '20px'
                    }}>
                        {bookingsLoading ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#666'
                            }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '16px', color: '#6c63ff' }}></i>
                                <p>Loading your bookings...</p>
                            </div>
                        ) : detailedBookings.length > 0 ? (
                            <div className="bookings-list">
                                {(() => {
                                    const groupedBookings = groupBookingsByDate(detailedBookings);
                                    
                                    // Separate pending and (confirmed+cancelled) bookings
                                    const pendingBookings = [];
                                    const confirmedOrCancelledBookings = [];
                                    
                                    Object.entries(groupedBookings).forEach(([date, bookings]) => {
                                        const pendingForDate = bookings.filter(booking => booking.status === 'pending');
                                        const confirmedOrCancelledForDate = bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'cancelled');
                                        
                                        if (pendingForDate.length > 0) {
                                            pendingBookings.push({ date, bookings: pendingForDate });
                                        }
                                        if (confirmedOrCancelledForDate.length > 0) {
                                            confirmedOrCancelledBookings.push({ date, bookings: confirmedOrCancelledForDate });
                                        }
                                    });

                                    return (
                                        <>
                                            {/* Pending Bookings Section */}
                                            {pendingBookings.length > 0 && (
                                                <div style={{ marginBottom: '40px' }}>
                                                    <h4 style={{
                                                        margin: '0 0 20px 0',
                                                        color: '#856404',
                                                        fontSize: '1.3rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <i className="fas fa-clock" style={{ color: '#ffc107' }}></i>
                                                        Pending Bookings
                                                        <span style={{
                                                            background: '#ffc107',
                                                            color: '#856404',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {pendingBookings.reduce((total, group) => total + group.bookings.length, 0)}
                                                        </span>
                                                    </h4>
                                                    {pendingBookings.map(({ date, bookings }) => (
                                                        <div key={`pending-${date}`} className="booking-date-group" style={{
                                                            border: '2px solid #ffeaa7',
                                                            borderRadius: '12px',
                                                            padding: '24px',
                                                            marginBottom: '20px',
                                                            background: '#fffbf0'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                marginBottom: '16px',
                                                                paddingBottom: '12px',
                                                                borderBottom: '2px solid #ffeaa7'
                                                            }}>
                                                                <div>
                                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#856404' }}>
                                                                        <i className="fas fa-calendar" style={{ marginRight: '8px', color: '#ffc107' }}></i>
                                                                        {formatDate(date)}
                                                                    </h4>
                                                                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#856404' }}>
                                                                        {bookings.length} Service{bookings.length !== 1 ? 's' : ''} pending confirmation
                                                                    </p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <span style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#fff3cd',
                                                                        borderRadius: '20px',
                                                                        fontSize: '0.9rem',
                                                                        color: '#856404',
                                                                        fontWeight: '500',
                                                                        border: '1px solid #ffeaa7'
                                                                    }}>
                                                                        Pending
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '20px',
                                                                justifyContent: 'flex-start',
                                                                alignItems: 'stretch'
                                                            }}>
                                                                {bookings.map((booking) => {
                                                                    const imageUrl = booking.images && booking.images.length > 0 ? booking.images[0] : 'https://via.placeholder.com/300x200?text=No+Image';
                                                                    const bookedForDate = booking.bookedForDate ? new Date(booking.bookedForDate).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    }) : 'Date not specified';

                                                                    return (
                                                                        <div key={booking.bookingId || `${booking.serviceId}-${booking.bookedForDate}`} className="service-card" style={{
                                                                            background: '#fff',
                                                                            borderRadius: '12px',
                                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                                            overflow: 'hidden',
                                                                            border: '2px solid #ffeaa7',
                                                                            width: '100%',
                                                                            minWidth: '220px',
                                                                            maxWidth: '320px',
                                                                            flexShrink: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            marginBottom: '0',
                                                                            transition: 'box-shadow 0.2s, transform 0.2s'
                                                                        }}>
                                                                            <div className="service-image-container" style={{
                                                                                width: '100%',
                                                                                height: '160px',
                                                                                overflow: 'hidden',
                                                                                position: 'relative',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                background: '#f5f5f5'
                                                                            }}>
                                                                                <img
                                                                                    src={imageUrl}
                                                                                    alt={booking.serviceName || 'Service'}
                                                                                    className="service-image"
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        objectFit: 'cover',
                                                                                        borderTopLeftRadius: '12px',
                                                                                        borderTopRightRadius: '12px'
                                                                                    }}
                                                                                    onError={(e) => {
                                                                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                                                    }}
                                                                                />
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    top: '8px',
                                                                                    right: '8px',
                                                                                    background: 'rgba(255, 193, 7, 0.9)',
                                                                                    color: '#856404',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '0.8rem',
                                                                                    fontWeight: '600'
                                                                                }}>
                                                                                    Pending
                                                                                </div>
                                                                            </div>
                                                                            <div className="service-info" style={{
                                                                                padding: '16px',
                                                                                width: '100%',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'flex-start',
                                                                                flex: 1
                                                                            }}>
                                                                                <div style={{ width: '100%' }}>
                                                                                    <h5 className="service-name" style={{
                                                                                        fontSize: '1.2rem',
                                                                                        fontFamily: 'Montserrat, sans-serif',
                                                                                        marginBottom: '4px',
                                                                                        color: '#856404',
                                                                                        fontWeight: '600',
                                                                                        lineHeight: '1.3'
                                                                                    }}>
                                                                                        {booking.serviceName || 'Service Name Not Available'}
                                                                                    </h5>

                                                                                    <p className="service-provider" style={{
                                                                                        margin: '0 0 8px 0',
                                                                                        fontSize: '0.95rem',
                                                                                        color: '#856404'
                                                                                    }}>
                                                                                        by {booking.provider || 'Provider Not Available'}
                                                                                    </p>

                                                                                    <p className="service-category" style={{
                                                                                        margin: '0 0 8px 0',
                                                                                        fontSize: '0.9rem',
                                                                                        color: '#856404',
                                                                                        textTransform: 'capitalize',
                                                                                        display: 'inline-block',
                                                                                        backgroundColor: '#fff3cd',
                                                                                        padding: '3px 10px',
                                                                                        borderRadius: '15px'
                                                                                    }}>
                                                                                        {booking.category || 'Category Not Available'}
                                                                                    </p>

                                                                                    <p className="service-price" style={{
                                                                                        fontSize: '1.1rem',
                                                                                        fontWeight: '600',
                                                                                        color: '#856404',
                                                                                        margin: '0 0 12px 0'
                                                                                    }}>
                                                                                        ₹{booking.price ? booking.price.toLocaleString() : 'Price Not Available'}
                                                                                    </p>
                                                                                </div>

                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    gap: '8px',
                                                                                    marginTop: 'auto',
                                                                                    width: '100%'
                                                                                }}>
                                                                                    <button
                                                                                        className="btn primary-btn"
                                                                                        style={{
                                                                                            padding: '8px 12px',
                                                                                            fontSize: '0.8rem',
                                                                                            flex: 1,
                                                                                            backgroundColor: '#ffc107',
                                                                                            borderColor: '#ffc107',
                                                                                            color: '#856404'
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            const serviceData = {
                                                                                                _id: booking.serviceId,
                                                                                                name: booking.serviceName,
                                                                                                provider: booking.provider,
                                                                                                price: booking.price,
                                                                                                category: booking.category,
                                                                                                images: booking.images,
                                                                                                description: booking.description
                                                                                            };
                                                                                            toggleService(serviceData);
                                                                                        }}
                                                                                        disabled={!booking.serviceId}
                                                                                    >
                                                                                        <i className="fas fa-plus"></i> Book Again
                                                                                    </button>
                                                                                </div>
                                                                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#856404', fontWeight: 'bold' }}>Pending Confirmation</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Confirmed & Cancelled Bookings Section */}
                                            {confirmedOrCancelledBookings.length > 0 && (
                                                <div>
                                                    <h4 style={{
                                                        margin: '0 0 20px 0',
                                                        color: '#155724',
                                                        fontSize: '1.3rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
                                                        Confirmed & Cancelled Bookings
                                                        <span style={{
                                                            background: '#28a745',
                                                            color: '#fff',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '500'
                                                        }}>
                                                            {confirmedOrCancelledBookings.reduce((total, group) => total + group.bookings.length, 0)}
                                                        </span>
                                                    </h4>
                                                    {confirmedOrCancelledBookings.map(({ date, bookings }) => (
                                                        <div key={`confirmed-cancelled-${date}`} className="booking-date-group" style={{
                                                            border: '1px solid #e9ecef',
                                                            borderRadius: '12px',
                                                            padding: '24px',
                                                            marginBottom: '20px',
                                                            background: '#fafafa'
                                                        }}>
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                marginBottom: '16px',
                                                                paddingBottom: '12px',
                                                                borderBottom: '2px solid #e9ecef'
                                                            }}>
                                                                <div>
                                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#333' }}>
                                                                        <i className="fas fa-calendar" style={{ marginRight: '8px', color: '#6c63ff' }}></i>
                                                                        {formatDate(date)}
                                                                    </h4>
                                                                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                                                                        {bookings.length} Service{bookings.length !== 1 ? 's' : ''} on this date
                                                                    </p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <span style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#d4edda',
                                                                        borderRadius: '20px',
                                                                        fontSize: '0.9rem',
                                                                        color: '#155724',
                                                                        fontWeight: '500',
                                                                        border: '1px solid #c3e6cb'
                                                                    }}>
                                                                        Confirmed
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '20px',
                                                                justifyContent: 'flex-start',
                                                                alignItems: 'stretch'
                                                            }}>
                                                                {bookings.map((booking) => {
                                                                    const imageUrl = booking.images && booking.images.length > 0 ? booking.images[0] : 'https://via.placeholder.com/300x200?text=No+Image';
                                                                    const bookedForDate = booking.bookedForDate ? new Date(booking.bookedForDate).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric'
                                                                    }) : 'Date not specified';
                                                                    const isCanceled = booking.status === 'cancelled';
                                                                    const eventDate = new Date(booking.bookedForDate);
                                                                    const now = new Date();
                                                                    const diffMs = eventDate - now;
                                                                    const diffHours = diffMs / (1000 * 60 * 60);
                                                                    const canCancel = !isCanceled && diffHours > 48;

                                                                    return (
                                                                        <div key={booking.bookingId || `${booking.serviceId}-${booking.bookedForDate}`} className="service-card" style={{
                                                                            background: isCanceled ? '#ffeaea' : '#fff',
                                                                            borderRadius: '12px',
                                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                                            overflow: 'hidden',
                                                                            border: isCanceled ? '2px solid #d9534f' : '1px solid #e9ecef',
                                                                            width: '100%',
                                                                            minWidth: '220px',
                                                                            maxWidth: '320px',
                                                                            flexShrink: 0,
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            marginBottom: '0',
                                                                            transition: 'box-shadow 0.2s, transform 0.2s'
                                                                        }}>
                                                                            <div className="service-image-container" style={{
                                                                                width: '100%',
                                                                                height: '160px',
                                                                                overflow: 'hidden',
                                                                                position: 'relative',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                background: '#f5f5f5'
                                                                            }}>
                                                                                <img
                                                                                    src={imageUrl}
                                                                                    alt={booking.serviceName || 'Service'}
                                                                                    className="service-image"
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        objectFit: 'cover',
                                                                                        borderTopLeftRadius: '12px',
                                                                                        borderTopRightRadius: '12px'
                                                                                    }}
                                                                                    onError={(e) => {
                                                                                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                                                    }}
                                                                                />
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    top: '8px',
                                                                                    right: '8px',
                                                                                    background: isCanceled ? '#f8d7da' : '#d4edda',
                                                                                    color: isCanceled ? '#721c24' : '#155724',
                                                                                    padding: '4px 8px',
                                                                                    borderRadius: '4px',
                                                                                    fontSize: '0.8rem',
                                                                                    fontWeight: '600',
                                                                                    border: isCanceled ? '1px solid #f5c6cb' : '1px solid #c3e6cb'
                                                                                }}>
                                                                                    {isCanceled ? 'Cancelled' : 'Confirmed'}
                                                                                </div>
                                                                            </div>
                                                                            <div className="service-info" style={{
                                                                                padding: '16px',
                                                                                width: '100%',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                alignItems: 'flex-start',
                                                                                flex: 1
                                                                            }}>
                                                                                <div style={{ width: '100%' }}>
                                                                                    <h5 className="service-name" style={{
                                                                                        fontSize: '1.2rem',
                                                                                        fontFamily: 'Montserrat, sans-serif',
                                                                                        marginBottom: '4px',
                                                                                        color: isCanceled ? '#d32f2f' : '#6a11cb',
                                                                                        fontWeight: '600',
                                                                                        lineHeight: '1.3'
                                                                                    }}>
                                                                                        {booking.serviceName || 'Service Name Not Available'}
                                                                                    </h5>

                                                                                    <p className="service-provider" style={{
                                                                                        margin: '0 0 8px 0',
                                                                                        fontSize: '0.95rem',
                                                                                        color: isCanceled ? '#e57373' : '#666'
                                                                                    }}>
                                                                                        by {booking.provider || 'Provider Not Available'}
                                                                                    </p>

                                                                                    <p className="service-category" style={{
                                                                                        margin: '0 0 8px 0',
                                                                                        fontSize: '0.9rem',
                                                                                        color: isCanceled ? '#e57373' : '#666',
                                                                                        textTransform: 'capitalize',
                                                                                        display: 'inline-block',
                                                                                        backgroundColor: isCanceled ? '#ffebee' : '#f5f5f5',
                                                                                        padding: '3px 10px',
                                                                                        borderRadius: '15px'
                                                                                    }}>
                                                                                        {booking.category || 'Category Not Available'}
                                                                                    </p>

                                                                                    <p className="service-price" style={{
                                                                                        fontSize: '1.1rem',
                                                                                        fontWeight: '600',
                                                                                        color: isCanceled ? '#d32f2f' : '#2575fc',
                                                                                        margin: '0 0 12px 0'
                                                                                    }}>
                                                                                        ₹{booking.price ? booking.price.toLocaleString() : 'Price Not Available'}
                                                                                    </p>
                                                                                </div>

                                                                                <div style={{
                                                                                    display: 'flex',
                                                                                    gap: '8px',
                                                                                    marginTop: 'auto',
                                                                                    width: '100%'
                                                                                }}>
                                                                                    <button
                                                                                        className="btn primary-btn"
                                                                                        style={{
                                                                                            padding: '8px 12px',
                                                                                            fontSize: '0.8rem',
                                                                                            flex: 1
                                                                                        }}
                                                                                        onClick={() => {
                                                                                            const serviceData = {
                                                                                                _id: booking.serviceId,
                                                                                                name: booking.serviceName,
                                                                                                provider: booking.provider,
                                                                                                price: booking.price,
                                                                                                category: booking.category,
                                                                                                images: booking.images,
                                                                                                description: booking.description
                                                                                            };
                                                                                            toggleService(serviceData);
                                                                                        }}
                                                                                        disabled={!booking.serviceId}
                                                                                    >
                                                                                        <i className="fas fa-plus"></i> Book Again
                                                                                    </button>

                                                                                    {!booking.hasReviewed && !isCanceled ? (
                                                                                        <button
                                                                                            className="btn secondary-btn"
                                                                                            style={{
                                                                                                padding: '8px 12px',
                                                                                                fontSize: '0.8rem',
                                                                                                flex: 1
                                                                                            }}
                                                                                            onClick={() => openReviewModal(booking)}
                                                                                            disabled={!booking.serviceId}
                                                                                        >
                                                                                            <i className="fas fa-star"></i> Review
                                                                                        </button>
                                                                                    ) : !isCanceled ? (
                                                                                        <span style={{
                                                                                            padding: '8px 12px',
                                                                                            fontSize: '0.8rem',
                                                                                            color: '#28a745',
                                                                                            backgroundColor: '#d4edda',
                                                                                            borderRadius: '6px',
                                                                                            textAlign: 'center',
                                                                                            flex: 1
                                                                                        }}>
                                                                                            <i className="fas fa-check"></i> Reviewed
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                    {isCanceled ? (
                                                                                        <span style={{ color: '#d9534f', fontWeight: 'bold' }}>Cancelled</span>
                                                                                    ) : (
                                                                                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>Confirmed</span>
                                                                                    )}
                                                                                    {canCancel && !isCanceled && (
                                                                                        <button
                                                                                            style={{
                                                                                                background: '#d9534f',
                                                                                                color: '#fff',
                                                                                                border: 'none',
                                                                                                borderRadius: '6px',
                                                                                                padding: '6px 16px',
                                                                                                fontWeight: 'bold',
                                                                                                cursor: 'pointer',
                                                                                                marginLeft: '10px'
                                                                                            }}
                                                                                            onClick={async () => {
                                                                                                try {
                                                                                                    setLoading(true);
                                                                                                    const response = await fetch(`http://localhost:5001/api/customers/cancel-booking/${booking.serviceId}/${booking.bookingId}`, {
                                                                                                        method: 'POST',
                                                                                                    });
                                                                                                    if (response.ok) {
                                                                                                        showPopup('Booking canceled successfully', 'success');
                                                                                                        // Refresh bookings
                                                                                                        await fetchDetailedBookings();
                                                                                                    } else {
                                                                                                        const errorData = await response.json();
                                                                                                        console.error('Cancel booking error:', response.status, errorData);
                                                                                                        showPopup(errorData.message || 'Failed to cancel booking', 'error');
                                                                                                    }
                                                                                                } catch (error) {
                                                                                                console.log("");
                                                                                                } finally {
                                                                                                    setLoading(false);
                                                                                                }
                                                                                            }}
                                                                                            disabled={loading}
                                                                                        >
                                                                                            Cancel
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* No Bookings Message */}
                                            {pendingBookings.length === 0 && confirmedOrCancelledBookings.length === 0 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '40px 20px',
                                                    color: '#666'
                                                }}>
                                                    <i className="fas fa-calendar-check" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}></i>
                                                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No bookings yet</h4>
                                                    <p style={{ margin: '0' }}>Your booking history will appear here once you book services.</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#666'
                            }}>
                                <i className="fas fa-calendar-check" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}></i>
                                <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No bookings yet</h4>
                                <p style={{ margin: '0' }}>Your booking history will appear here once you book services.</p>
                            </div>
                        )}
                    </div>
                </div>


            </div>

            <ServiceDetailsModal
                service={selectedService}
                isOpen={isModalOpen}
                onClose={closeServiceModal}
                onAddToCart={handleAddToCart}
                isSelected={false}
            />

            {/* Review Modal */}
            {showReviewModal && selectedBookingForReview && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '30px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#333' }}>Add Review</h3>
                            <button
                                onClick={closeReviewModal}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{selectedBookingForReview.serviceName}</h4>
                            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>by {selectedBookingForReview.provider}</p>
                        </div>

                        <form onSubmit={handleReviewSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                    Rating
                                </label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '1.5rem',
                                                cursor: 'pointer',
                                                color: star <= reviewData.rating ? '#f39c12' : '#ddd'
                                            }}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span style={{ marginLeft: '8px', color: '#666' }}>
                                        {reviewData.rating} out of 5
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                    Comment
                                </label>
                                <textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="Share your experience with this service..."
                                    required
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={closeReviewModal}
                                    className="btn secondary-btn"
                                    style={{ padding: '10px 20px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn primary-btn"
                                    style={{ padding: '10px 20px' }}
                                    disabled={reviewLoading}
                                >
                                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Popup Modal for alerts */}
            <PopupModal
                isOpen={popupModal.isOpen}
                message={popupModal.message}
                type={popupModal.type}
                onClose={closePopup}
            />
        </section>
    );
}

export default Profile;
