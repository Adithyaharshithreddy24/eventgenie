import React, { useState, useEffect } from 'react';
import './UPIPayment.css';

const UPIPayment = ({ bookingId, amount, vendorName, serviceName, onPaymentSuccess, onPaymentError }) => {
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [showVerification, setShowVerification] = useState(false);

    useEffect(() => {
        createPayment();
    }, [bookingId]);

    const createPayment = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create payment');
            }

            const data = await response.json();
            setPaymentData(data);
        } catch (error) {
            setError(error.message);
            onPaymentError?.(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentComplete = async () => {
        if (!transactionId.trim()) {
            setError('Please enter the transaction ID');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:5001/api/bookings/${bookingId}/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transactionId: transactionId.trim(),
                    upiId: paymentData.upiId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Payment verification failed');
            }

            const result = await response.json();
            onPaymentSuccess?.(result);
        } catch (error) {
            setError(error.message);
            onPaymentError?.(error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyUPIUrl = () => {
        if (paymentData?.upiUrl) {
            navigator.clipboard.writeText(paymentData.upiUrl);
            alert('UPI URL copied to clipboard!');
        }
    };

    if (loading && !paymentData) {
        return (
            <div className="upi-payment-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Creating payment...</p>
                </div>
            </div>
        );
    }

    if (error && !paymentData) {
        return (
            <div className="upi-payment-container">
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3>Payment Error</h3>
                    <p>{error}</p>
                    <button onClick={createPayment} className="retry-btn">
                        <i className="fas fa-redo"></i> Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="upi-payment-container">
            <div className="payment-header">
                <h2><i className="fas fa-mobile-alt"></i> UPI Payment</h2>
                <p>Scan QR code or use UPI ID to complete payment</p>
            </div>

            <div className="payment-details">
                <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">₹{amount}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Vendor:</span>
                    <span className="value">{vendorName}</span>
                </div>
                <div className="detail-row">
                    <span className="label">Service:</span>
                    <span className="value">{serviceName}</span>
                </div>
                <div className="detail-row">
                    <span className="label">UPI ID:</span>
                    <span className="value upi-id">{paymentData?.upiId}</span>
                </div>
            </div>

            {paymentData?.qrCodeDataURL && (
                <div className="qr-section">
                    <h3>Scan QR Code</h3>
                    <div className="qr-container">
                        <img 
                            src={paymentData.qrCodeDataURL} 
                            alt="UPI QR Code" 
                            className="qr-code"
                        />
                    </div>
                    <button onClick={copyUPIUrl} className="copy-btn">
                        <i className="fas fa-copy"></i> Copy UPI URL
                    </button>
                </div>
            )}

            <div className="payment-instructions">
                <h3>How to Pay:</h3>
                <ol>
                    <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                    <li>Scan the QR code above or enter UPI ID manually</li>
                    <li>Enter the amount: <strong>₹{amount}</strong></li>
                    <li>Add a note: "Advance payment for {serviceName}"</li>
                    <li>Complete the payment</li>
                    <li>Copy the transaction ID and enter it below</li>
                </ol>
            </div>

            <div className="verification-section">
                <h3>Payment Verification</h3>
                <div className="input-group">
                    <label htmlFor="transaction-id">Transaction ID:</label>
                    <input
                        type="text"
                        id="transaction-id"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID from your UPI app"
                        className="transaction-input"
                    />
                </div>
                
                {error && (
                    <div className="error-message">
                        <i className="fas fa-exclamation-circle"></i>
                        {error}
                    </div>
                )}

                <button 
                    onClick={handlePaymentComplete}
                    disabled={loading || !transactionId.trim()}
                    className="verify-btn"
                >
                    {loading ? (
                        <>
                            <div className="spinner-small"></div>
                            Verifying...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-check"></i>
                            Verify Payment
                        </>
                    )}
                </button>
            </div>

            <div className="payment-note">
                <p><i className="fas fa-info-circle"></i> 
                    <strong>Note:</strong> This is a 5% advance payment. After submission, the vendor will verify your payment before confirming the booking.
                </p>
            </div>
        </div>
    );
};

export default UPIPayment;
