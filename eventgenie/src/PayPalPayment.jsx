import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { toast } from 'react-toastify';
import './PayPalPayment.css';

const PayPalPayment = ({ booking, onPaymentSuccess, onPaymentCancel }) => {
    const [loading, setLoading] = useState(false);
    const [paymentCreated, setPaymentCreated] = useState(false);

    const paypalClientId = 'AfrJqA9lu6MHtb6m4x2BFbEKn6mIYo3NFYRFWDQCdsM34D5V8cxqSFoo7dEDrhxBuAoh4_RTu_KUCUlv';

    const createOrder = async () => {
        try {
            setLoading(true);
            console.log('Creating payment for booking:', booking._id);
            
            const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Payment creation response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Payment creation error:', errorData);
                throw new Error(errorData.message || 'Failed to create payment');
            }

            const data = await response.json();
            console.log('Payment creation success:', data);
            setPaymentCreated(true);
            return data.orderId;
        } catch (error) {
            console.error('Error creating payment:', error);
            toast.error(error.message || 'Failed to create payment');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const onApprove = async (data, actions) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/capture-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: data.orderID
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment capture failed');
            }

            const result = await response.json();
            toast.success('Payment completed successfully!');
            onPaymentSuccess(result.booking);
        } catch (error) {
            console.error('Error capturing payment:', error);
            toast.error(error.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const onError = (err) => {
        console.error('PayPal error:', err);
        toast.error('Payment failed. Please try again.');
    };

    const onCancel = () => {
        toast.info('Payment cancelled');
        onPaymentCancel();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const getTimeRemaining = () => {
        if (!booking.advancePaymentExpiry) return null;
        
        const now = new Date();
        const expiry = new Date(booking.advancePaymentExpiry);
        const diff = expiry - now;
        
        if (diff <= 0) return 'Expired';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m remaining`;
    };

    const timeRemaining = getTimeRemaining();

    return (
        <div className="paypal-payment-container">
            <div className="payment-header">
                <h2>Advance Payment</h2>
                <div className="payment-details">
                    <div className="service-info">
                        <h3>{booking.serviceName}</h3>
                        <p>Event Date: {booking.eventDate}</p>
                        <p>Vendor: {booking.vendorName}</p>
                    </div>
                    
                    <div className="amount-info">
                        <div className="total-amount">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(booking.totalAmount)}</span>
                        </div>
                        <div className="advance-amount">
                            <span>Advance Payment (5%):</span>
                            <span>{formatCurrency(booking.advanceAmount)}</span>
                        </div>
                    </div>

                    {timeRemaining && (
                        <div className={`time-remaining ${timeRemaining === 'Expired' ? 'expired' : ''}`}>
                            {timeRemaining}
                        </div>
                    )}
                </div>
            </div>

            {timeRemaining === 'Expired' ? (
                <div className="payment-expired">
                    <p>Payment time has expired. This booking has been cancelled.</p>
                    <button 
                        className="btn-secondary"
                        onClick={onPaymentCancel}
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <div className="payment-actions">
                    <PayPalScriptProvider options={{ 
                        "client-id": paypalClientId,
                        currency: "USD"
                    }}>
                        <PayPalButtons
                            createOrder={createOrder}
                            onApprove={onApprove}
                            onError={onError}
                            onCancel={onCancel}
                            style={{
                                layout: "vertical",
                                color: "blue",
                                shape: "rect",
                                label: "pay"
                            }}
                            disabled={loading}
                        />
                    </PayPalScriptProvider>

                    <div className="payment-note">
                        <p>
                            <strong>Important:</strong> You have 12 hours from vendor approval to complete this payment. 
                            After the time expires, your booking will be automatically cancelled.
                        </p>
                    </div>

                    <button 
                        className="btn-secondary"
                        onClick={onPaymentCancel}
                        disabled={loading}
                    >
                        Cancel Payment
                    </button>
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Processing payment...</p>
                </div>
            )}
        </div>
    );
};

export default PayPalPayment;
