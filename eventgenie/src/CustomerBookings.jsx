 import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import UPIPayment from './UPIPayment';
import './CustomerBookings.css';

const CustomerBookings = ({ customerId }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (customerId) {
            fetchBookings();
        }
    }, [customerId]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/bookings/customer/${customerId}`);
            if (response.ok) {
                const data = await response.json();
                setBookings(data);
            } else {
                toast.error('Failed to fetch bookings');
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentClick = (booking) => {
        setSelectedBooking(booking);
        setShowPayment(true);
    };

    const handlePaymentSuccess = (updatedBooking) => {
        setBookings(prev => 
            prev.map(booking => 
                booking._id === updatedBooking._id ? updatedBooking : booking
            )
        );
        setShowPayment(false);
        setSelectedBooking(null);
        toast.success('Payment submitted successfully! Waiting for vendor verification.');
    };

    const handlePaymentCancel = () => {
        setShowPayment(false);
        setSelectedBooking(null);
    };

    const handlePaymentError = (errorMessage) => {
        toast.error(`Payment failed: ${errorMessage}`);
        setShowPayment(false);
        setSelectedBooking(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return '#ffc107';
            case 'approved':
                return '#17a2b8';
            case 'rejected':
                return '#dc3545';
            case 'payment_pending_verification':
                return '#ff9800';
            case 'advance_paid':
                return '#28a745';
            case 'payment_failed':
                return '#dc3545';
            case 'completed':
                return '#28a745';
            case 'cancelled':
                return '#6c757d';
            default:
                return '#6c757d';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pending Approval';
            case 'approved':
                return 'Approved - Payment Required';
            case 'rejected':
                return 'Rejected';
            case 'payment_pending_verification':
                return 'Payment Pending Verification';
            case 'advance_paid':
                return 'Advance Paid';
            case 'payment_failed':
                return 'Payment Failed';
            case 'completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const getTimeRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        
        const now = new Date();
        const expiry = new Date(expiryDate);
        const diff = expiry - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m remaining`;
    };

    if (loading) {
        return (
            <div className="bookings-loading">
                <div className="loading-spinner"></div>
                <p>Loading your bookings...</p>
            </div>
        );
    }

    if (showPayment && selectedBooking) {
        return (
            <div className="payment-container">
                <UPIPayment
                    bookingId={selectedBooking._id}
                    amount={selectedBooking.advanceAmount}
                    vendorName={selectedBooking.vendorName}
                    serviceName={selectedBooking.serviceName}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                />
            </div>
        );
    }

    return (
        <div className="customer-bookings">
            <h2>My Bookings</h2>
            
            {bookings.length === 0 ? (
                <div className="no-bookings">
                    <p>You haven't made any bookings yet.</p>
                    <a href="/services" className="btn-primary">Browse Services</a>
                </div>
            ) : (
                <div className="bookings-grid">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="booking-card">
                            <div className="booking-header">
                                <h3>{booking.serviceName}</h3>
                                <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(booking.status) }}
                                >
                                    {getStatusText(booking.status)}
                                </span>
                            </div>
                            
                            <div className="booking-details">
                                <div className="detail-row">
                                    <span className="label">Event Date:</span>
                                    <span className="value">{booking.eventDate}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Vendor:</span>
                                    <span className="value">{booking.vendorName}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Total Amount:</span>
                                    <span className="value">{formatCurrency(booking.totalAmount)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Advance Amount:</span>
                                    <span className="value">{formatCurrency(booking.advanceAmount)}</span>
                                </div>
                                
                                {booking.advancePaymentExpiry && booking.status === 'approved' && (
                                    <div className="detail-row">
                                        <span className="label">Payment Deadline:</span>
                                        <span className="value time-remaining">
                                            {getTimeRemaining(booking.advancePaymentExpiry)}
                                        </span>
                                    </div>
                                )}
                                
                                {booking.notes && (
                                    <div className="detail-row">
                                        <span className="label">Notes:</span>
                                        <span className="value">{booking.notes}</span>
                                    </div>
                                )}
                                
                                {booking.vendorNotes && (
                                    <div className="detail-row">
                                        <span className="label">Vendor Notes:</span>
                                        <span className="value">{booking.vendorNotes}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="booking-actions">
                                {booking.status === 'approved' && !booking.advanceAmountPaid && (
                                    <button 
                                        className="btn-pay"
                                        onClick={() => handlePaymentClick(booking)}
                                        disabled={getTimeRemaining(booking.advancePaymentExpiry) === 'Expired'}
                                    >
                                        {getTimeRemaining(booking.advancePaymentExpiry) === 'Expired' 
                                            ? 'Payment Expired' 
                                            : 'Pay Advance'
                                        }
                                    </button>
                                )}
                                
                                {booking.status === 'advance_paid' && (
                                    <div className="payment-confirmed">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Payment Confirmed</span>
                                    </div>
                                )}
                                
                                {booking.status === 'completed' && (
                                    <div className="booking-completed">
                                        <i className="fas fa-star"></i>
                                        <span>Service Completed</span>
                                    </div>
                                )}
                                
                                {booking.status === 'rejected' && (
                                    <div className="booking-rejected">
                                        <i className="fas fa-times-circle"></i>
                                        <span>Booking Rejected</span>
                                    </div>
                                )}
                                
                                {booking.status === 'payment_failed' && (
                                    <div className="payment-failed">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <span>Payment Verification Failed</span>
                                        <button 
                                            className="btn-retry"
                                            onClick={() => handlePaymentClick(booking)}
                                        >
                                            Retry Payment
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerBookings;
