import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetCalculator from './BudgetCalculator.jsx';
import './style.css';
import ServiceDetailsModal from "./ServiceDetailsModal.jsx";

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

// Calculate average rating from reviews
function getAverageRating(service) {
    if (!service.reviews || service.reviews.length === 0) return 0;
    const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / service.reviews.length;
}

function MyCart({ selectedServices, clearSelectedServices, isLoggedIn, addBooking, toggleService }) {
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [totalBudget, setTotalBudget] = useState(0);
    const navigate = useNavigate();

    console.log('MyCart - selectedServices:', selectedServices);
    console.log('MyCart - selectedServices length:', selectedServices.length);

    const subtotal = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);
    const serviceFee = subtotal * 0.05;
    const totalCost = subtotal + serviceFee;
    const budget = totalBudget || 0; // Use the budget from BudgetCalculator
    const isOverBudget = totalCost > budget && budget > 0;

    if (!isLoggedIn) {
        navigate('/login');
        return null;
    }

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

    const handleBookServices = () => {
        if (selectedServices.length > 0 && !isOverBudget) {
            // Get the selected date from the first service (all services should have the same date)
            const selectedDate = selectedServices[0]?.selectedDate || null;
            addBooking(selectedServices, selectedDate);
            clearSelectedServices();
            setShowPopup(true);
        }
    };

    return (
        <section id="mycart" className="page active">
            <div className="container">
                <h2 className="section-title">My Cart</h2>

                {/* Event Date Display */}
                {selectedServices.length > 0 && selectedServices[0]?.selectedDate && (
                    <div style={{
                        background: '#e8f5e8',
                        border: '1px solid #4caf50',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <i className="fas fa-calendar-check" style={{ color: '#4caf50', fontSize: '1.2rem' }}></i>
                        <div>
                            <strong style={{ color: '#2e7d32' }}>Event Date:</strong>
                            <span style={{ color: '#2e7d32', marginLeft: '8px' }}>
                                {new Date(selectedServices[0].selectedDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                )}

                <div className="cart-services-list">
                    {selectedServices.length === 0 ? (
                        <p className="empty-message">No services in your cart.</p>
                    ) : (
                        <div className="services-grid">
                            {selectedServices.map((service, idx) => {
                                const avgRating = getAverageRating(service);
                                const imageUrl = service.images && service.images.length > 0 ? service.images[0] : service.image;

                                return (
                                    <div
                                        key={service._id || idx}
                                        className="service-card selected"
                                        style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
                                        onClick={() => openServiceModal(service)}
                                    >
                                        <div className="service-image-container">
                                            <img
                                                src={imageUrl}
                                                alt={service.name}
                                                className="service-image"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                        </div>
                                        <div className="service-info" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                            <h3 className="service-name">{service.name}</h3>
                                            <p className="service-provider">by {service.provider}</p>
                                            <div className="service-rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {renderStars(avgRating)}
                                                <span style={{ marginLeft: 4, color: '#888', fontSize: '0.95em' }}>{avgRating.toFixed(1)}</span>
                                                {service.reviews && service.reviews.length > 0 && (
                                                    <span style={{ marginLeft: 4, color: '#888', fontSize: '0.9em' }}>({service.reviews.length} reviews)</span>
                                                )}
                                            </div>
                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                <p className="service-price">₹{service.price}</p>
                                                <button
                                                    className="btn btn-secondary mt-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleService(service);
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        width: '100%',
                    }}>
                        <BudgetCalculator
                            selectedServices={selectedServices}
                            clearSelectedServices={clearSelectedServices}
                            isLoggedIn={isLoggedIn}
                            hideServicesList={true}
                            hideBookAll={false}
                            totalBudget={totalBudget}
                            setTotalBudget={setTotalBudget}
                            isInCart={true}
                        />
                    </div>
                </div>
                {selectedServices.length > 0 && (
                    <div className="cart-summary">
                        <div className="summary-item">
                            <span>Total Services:</span>
                            <span>{selectedServices.length}</span>
                        </div>
                        <div className="summary-item">
                            <span>Subtotal:</span>
                            <span>₹{subtotal}</span>
                        </div>
                        <div className="summary-item">
                            <span>Service Tax:</span>
                            <span>₹{serviceFee}</span>
                        </div>
                        <div className="summary-item">
                            <span>Total Cost:</span>
                            <span>₹{totalCost}</span>
                        </div>
                        {budget <= 0 && (
                            <div className="budget-warning">
                                <p>⚠️ Please enter your budget</p>
                            </div>
                        )}
                        {budget > 0 && (
                            <>
                                <div className="summary-item">
                                    <span>Budget:</span>
                                    <span>₹{budget}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Remaining:</span>
                                    <span style={{ color: isOverBudget ? '#e74c3c' : '#27ae60' }}>
                                        ₹{budget - totalCost}
                                    </span>
                                </div>
                            </>
                        )}

                        {isOverBudget && (
                            <div className="budget-warning">
                                <p>⚠️ You have exceeded your budget by ₹{totalCost - budget}</p>
                            </div>
                        )}
                        <div className="cart-actions">
                            <button
                                className="btn secondary-btn"
                                onClick={clearSelectedServices}
                            >
                                Clear Cart
                            </button>
                            <button
                                className={`btn primary-btn ${(!isLoggedIn || selectedServices.length === 0 || isOverBudget || totalCost > budget) ? 'disabled' : ''}`}
                                onClick={handleBookServices}
                                disabled={!isLoggedIn || selectedServices.length === 0 || isOverBudget || totalCost > budget}
                            >
                                Book My Services
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Service Details Modal */}
            <ServiceDetailsModal
                service={selectedService}
                isOpen={isModalOpen}
                onClose={closeServiceModal}
                onAddToCart={handleAddToCart}
                isSelected={selectedService ? selectedServices.some((s) => s._id === selectedService._id) : false}
                selectedDate={selectedServices[0]?.selectedDate || null}
            />

            {showPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <h3>Congratulations!</h3>
                        <p>Your booking is accepted!</p>
                        <button className="btn primary-btn" onClick={() => setShowPopup(false)}>Close</button>
                    </div>
                </div>
            )}
        </section>
    );
}

export default MyCart; 