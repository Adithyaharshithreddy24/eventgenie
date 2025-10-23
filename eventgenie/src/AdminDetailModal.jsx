import React, { useState, useEffect } from 'react';
import './admin-portal.css';

function AdminDetailModal({ isOpen, onClose, entityType, entityId, entityData }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && entityId && entityType) {
            fetchEntityDetails();
        }
    }, [isOpen, entityId, entityType]);

    const fetchEntityDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/${entityType}/${entityId}`);
            if (response.ok) {
                const data = await response.json();
                setDetails(data);
            } else {
                console.error('Failed to fetch details');
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderCustomerDetails = () => {
        if (!details) return null;
        const { customer, bookings } = details;

        return (
            <div className="entity-details">
                <div className="detail-section">
                    <h3>Customer Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Name:</label>
                            <span>{customer.name}</span>
                        </div>
                        <div className="detail-item">
                            <label>Username:</label>
                            <span>{customer.username}</span>
                        </div>
                        <div className="detail-item">
                            <label>Email:</label>
                            <span>{customer.email}</span>
                        </div>
                        <div className="detail-item">
                            <label>Phone:</label>
                            <span>{customer.phone}</span>
                        </div>
                        <div className="detail-item">
                            <label>Address:</label>
                            <span>{customer.address}</span>
                        </div>
                        <div className="detail-item">
                            <label>Member Since:</label>
                            <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="detail-section">
                    <h3>Customer Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <label>Total Bookings:</label>
                            <span className="stat-value">{bookings.length}</span>
                        </div>
                        <div className="stat-item">
                            <label>Total Expenditure (stored):</label>
                            <span className="stat-value revenue">₹{customer.expenditure || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="detail-section">
                    <h3>Booking History ({bookings.length})</h3>
                    {bookings.length > 0 ? (
                        <div className="bookings-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Service</th>
                                        <th>Category</th>
                                        <th>Vendor</th>
                                        <th>Booked For</th>
                                        <th>Booked On</th>
                                        <th>Status</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking, index) => (
                                        <tr key={index}>
                                            <td>{booking.serviceName}</td>
                                            <td>{booking.serviceCategory}</td>
                                            <td>{booking.vendorBusinessName}</td>
                                            <td>{new Date(booking.bookedForDate).toLocaleDateString()}</td>
                                            <td>{new Date(booking.dateBooked).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status ${booking.status}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td>₹{booking.servicePrice}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-data">No bookings found</p>
                    )}
                </div>

            </div>
        );
    };

    const renderVendorDetails = () => {
        if (!details) return null;
        const { vendor, services, totalBookings, totalRevenue, pendingBookings, confirmedBookings, offeredServices, storedRevenue } = details;

        return (
            <div className="entity-details">
                <div className="detail-section">
                    <h3>Vendor Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Name:</label>
                            <span>{vendor.name}</span>
                        </div>
                        <div className="detail-item">
                            <label>Business Name:</label>
                            <span>{vendor.businessName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Username:</label>
                            <span>{vendor.username}</span>
                        </div>
                        <div className="detail-item">
                            <label>Email:</label>
                            <span>{vendor.email}</span>
                        </div>
                        <div className="detail-item">
                            <label>Phone:</label>
                            <span>{vendor.phone}</span>
                        </div>
                        <div className="detail-item">
                            <label>Status:</label>
                            <span className={`status ${vendor.status}`}>{vendor.status}</span>
                        </div>
                        <div className="detail-item">
                            <label>About:</label>
                            <span>{vendor.about || 'No description provided'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Services:</label>
                            <span>{vendor.categories?.join(', ') || 'None specified'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Member Since:</label>
                            <span>{new Date(vendor.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Business Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <label>Total Services:</label>
                            <span className="stat-value">{services}</span>
                        </div>
                        <div className="stat-item">
                            <label>Total Bookings:</label>
                            <span className="stat-value">{totalBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Confirmed Bookings:</label>
                            <span className="stat-value confirmed">{confirmedBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Pending Bookings:</label>
                            <span className="stat-value pending">{pendingBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Total Revenue (computed):</label>
                            <span className="stat-value revenue">₹{totalRevenue}</span>
                        </div>
                        <div className="stat-item">
                            <label>Revenue (stored):</label>
                            <span className="stat-value revenue">₹{storedRevenue}</span>
                        </div>
                    </div>
                </div>

                {Array.isArray(offeredServices) && offeredServices.length > 0 && (
                    <div className="detail-section">
                        <h3>Services Offered</h3>
                        <div className="bookings-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offeredServices.map((s) => (
                                        <tr key={s._id}>
                                            <td>{s.name}</td>
                                            <td>{s.category}</td>
                                            <td>₹{s.price}</td>
                                            <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderServiceDetails = () => {
        if (!details) return null;
        const { service, statistics } = details;

        return (
            <div className="entity-details">
                <div className="detail-section">
                    <h3>Service Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Service Name:</label>
                            <span>{service.name}</span>
                        </div>
                        <div className="detail-item">
                            <label>Provider:</label>
                            <span>{service.provider}</span>
                        </div>
                        <div className="detail-item">
                            <label>Category:</label>
                            <span>{service.category}</span>
                        </div>
                        <div className="detail-item">
                            <label>Price:</label>
                            <span>₹{service.price}</span>
                        </div>
                        <div className="detail-item">
                            <label>Food Type:</label>
                            <span>{service.foodType || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Description:</label>
                            <span>{service.description || 'No description provided'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Address:</label>
                            <span>{service.address || 'No address provided'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Created:</label>
                            <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3>Service Statistics</h3>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <label>Total Bookings:</label>
                            <span className="stat-value">{statistics.totalBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Confirmed Bookings:</label>
                            <span className="stat-value confirmed">{statistics.confirmedBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Pending Bookings:</label>
                            <span className="stat-value pending">{statistics.pendingBookings}</span>
                        </div>
                        <div className="stat-item">
                            <label>Total Revenue:</label>
                            <span className="stat-value revenue">₹{statistics.totalRevenue}</span>
                        </div>
                    </div>
                </div>

                {service.bookings && service.bookings.length > 0 && (
                    <div className="detail-section">
                        <h3>Recent Bookings</h3>
                        <div className="bookings-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Booked For</th>
                                        <th>Booked On</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {service.bookings.slice(0, 5).map((booking, index) => (
                                        <tr key={index}>
                                            <td>{booking.customerName}</td>
                                            <td>{new Date(booking.bookedForDate).toLocaleDateString()}</td>
                                            <td>{new Date(booking.dateBooked).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status ${booking.status}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td>₹{booking.totalAmount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderBookingDetails = () => {
        if (!entityData) return null;

        return (
            <div className="entity-details">
                <div className="detail-section">
                    <h3>Booking Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Service:</label>
                            <span>{entityData.serviceName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Category:</label>
                            <span>{entityData.serviceCategory}</span>
                        </div>
                        <div className="detail-item">
                            <label>Vendor:</label>
                            <span>{entityData.vendorBusinessName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Customer:</label>
                            <span>{entityData.customerName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Customer Email:</label>
                            <span>{entityData.customerEmail}</span>
                        </div>
                        <div className="detail-item">
                            <label>Customer Phone:</label>
                            <span>{entityData.customerPhone}</span>
                        </div>
                        <div className="detail-item">
                            <label>Booked For:</label>
                            <span>{new Date(entityData.bookedForDate).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <label>Booked On:</label>
                            <span>{new Date(entityData.dateBooked).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <label>Status:</label>
                            <span className={`status ${entityData.status}`}>{entityData.status}</span>
                        </div>
                        <div className="detail-item">
                            <label>Total Amount:</label>
                            <span>₹{entityData.totalAmount}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <div className="loading">Loading details...</div>;
        }

        switch (entityType) {
            case 'customers':
                return renderCustomerDetails();
            case 'vendors':
                return renderVendorDetails();
            case 'services':
                return renderServiceDetails();
            case 'bookings':
                return renderBookingDetails();
            default:
                return <div>Unknown entity type</div>;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{entityType.charAt(0).toUpperCase() + entityType.slice(1)} Details</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

export default AdminDetailModal; 