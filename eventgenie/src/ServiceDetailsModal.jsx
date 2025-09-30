import React, { useState } from 'react';
import './style.css';

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <span>
            {Array(fullStars).fill().map((_, i) => <i key={"full-" + i} className="fas fa-star" style={{ color: '#f39c12' }}></i>)}
            {halfStar && <i className="fas fa-star-half-alt" style={{ color: '#f39c12' }}></i>}
            {Array(emptyStars).fill().map((_, i) => <i key={"empty-" + i} className="far fa-star" style={{ color: '#f39c12' }}></i>)}
        </span>
    );
}

function ServiceDetailsModal({ service, onClose, onAddToCart, selectedDate, showDatePopup, onCloseDatePopup }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!service) return null;

    // Calculate average rating
    const getAverageRating = () => {
        if (!service.reviews || service.reviews.length === 0) return 0;
        const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
        return totalRating / service.reviews.length;
    };

    const avgRating = getAverageRating();
    const images = service.images && service.images.length > 0 ? service.images : [service.image];
    const currentImage = images[currentImageIndex] || 'https://via.placeholder.com/400x300?text=No+Image';

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleAddToCart = () => {
        // Check if date is selected
        if (!selectedDate) {
            if (showDatePopup && onCloseDatePopup) {
                showDatePopup();
            }
            return;
        }

        // Add the selected date to the service object
        const serviceWithDate = {
            ...service,
            selectedDate: selectedDate
        };

        onAddToCart(serviceWithDate);
    };

    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content" style={{
                width: '1000px',
                height: '900px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                margin: '50px auto',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <span className="close" onClick={onClose}>&times;</span>

                <div className="service-details" style={{
                    padding: '30px',
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Header Section */}
                    <div style={{
                        display: 'flex',
                        gap: '30px',
                        marginBottom: '30px',
                        flexShrink: 0
                    }}>
                        {/* Image */}
                        <div style={{
                            width: '400px',
                            height: '300px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative'
                        }}>
                            <img
                                src={currentImage}
                                alt={service.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                }}
                            />

                            {/* Image Navigation */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            cursor: 'pointer',
                                            fontSize: '18px'
                                        }}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            cursor: 'pointer',
                                            fontSize: '18px'
                                        }}
                                    >
                                        ›
                                    </button>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'rgba(0,0,0,0.7)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}>
                                        {currentImageIndex + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: '2.5rem',
                                marginBottom: '10px',
                                color: '#333',
                                fontWeight: '600'
                            }}>
                                {service.name}
                            </h1>

                            <p style={{
                                fontSize: '1.2rem',
                                color: '#666',
                                marginBottom: '15px',
                                fontWeight: '500'
                            }}>
                                by {service.provider}
                            </p>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: '10px'
                                }}>
                                    {renderStars(avgRating)}
                                    <span style={{
                                        fontSize: '1.1rem',
                                        color: '#666',
                                        fontWeight: '500'
                                    }}>
                                        {avgRating.toFixed(1)}
                                    </span>
                                    {service.reviews && service.reviews.length > 0 && (
                                        <span style={{
                                            fontSize: '0.9rem',
                                            color: '#888'
                                        }}>
                                            ({service.reviews.length} reviews)
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: '#6c63ff',
                                marginBottom: '20px'
                            }}>
                                ₹{service.price}
                            </div>

                            {/* Availability Status */}
                            {service.selectedDate && (
                                <div style={{
                                    marginBottom: '20px',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: service.isAvailable ? '#e8f5e8' : '#ffebee',
                                    border: `1px solid ${service.isAvailable ? '#4caf50' : '#f44336'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <i
                                        className={`fas ${service.isAvailable ? 'fa-check-circle' : 'fa-times-circle'}`}
                                        style={{
                                            color: service.isAvailable ? '#4caf50' : '#f44336',
                                            fontSize: '1.2rem'
                                        }}
                                    ></i>
                                    <span style={{
                                        color: service.isAvailable ? '#2e7d32' : '#c62828',
                                        fontWeight: '600'
                                    }}>
                                        {service.isAvailable ? 'Available' : 'Not Available'} for {new Date(service.selectedDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}

                            <div style={{ marginBottom: '20px' }}>
                                <span style={{
                                    backgroundColor: '#f0f0f0',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    color: '#555',
                                    textTransform: 'capitalize'
                                }}>
                                    {service.category}
                                </span>
                                {service.foodType && (
                                    <span style={{
                                        backgroundColor: '#e8f5e8',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        color: '#2d5a2d',
                                        marginLeft: '10px',
                                        textTransform: 'capitalize'
                                    }}>
                                        {service.foodType}
                                    </span>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <i className="fas fa-map-marker-alt" style={{
                                    color: '#666',
                                    marginRight: '8px'
                                }}></i>
                                <span style={{
                                    fontSize: '1rem',
                                    color: '#666',
                                    fontWeight: '500'
                                }}>
                                    {service.address}
                                </span>
                            </div>

                            <button
                                className="btn primary-btn"
                                onClick={handleAddToCart}
                                style={{
                                    padding: '12px 30px',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    opacity: service.isAvailable !== false ? 1 : 0.5,
                                    cursor: service.isAvailable !== false ? 'pointer' : 'not-allowed'
                                }}
                                disabled={service.isAvailable === false}
                                title={service.availabilityStatus === 'Blocked' ? 'Service is blocked by vendor for this date' : (service.isAvailable === false ? 'Service is not available for this date' : '')}
                            >
                                {service.isAvailable !== false
                                    ? 'Add to Cart'
                                    : (service.availabilityStatus === 'Blocked' ? 'Blocked by Vendor' : 'Not Available')}
                            </button>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div style={{
                        marginBottom: '30px',
                        flexShrink: 0
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            Description
                        </h2>
                        <p style={{
                            fontSize: '1.1rem',
                            lineHeight: '1.6',
                            color: '#555',
                            textAlign: 'justify'
                        }}>
                            {service.description}
                        </p>
                    </div>

                    {/* Reviews Section */}
                    <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            marginBottom: '15px',
                            color: '#333',
                            fontWeight: '600'
                        }}>
                            Customer Reviews
                        </h2>

                        {(!service.reviews || service.reviews.length === 0) ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#666'
                            }}>
                                <i className="fas fa-comments" style={{ fontSize: '2rem', marginBottom: '15px', opacity: 0.5 }}></i>
                                <p>No reviews yet. Be the first to review this service!</p>
                            </div>
                        ) : (
                            <div style={{
                                overflowY: 'auto',
                                flex: 1,
                                paddingRight: '10px'
                            }}>
                                {service.reviews.map((review, index) => (
                                    <div key={index} style={{
                                        background: '#f8f9fa',
                                        padding: '20px',
                                        marginBottom: '15px',
                                        borderRadius: '12px',
                                        border: '1px solid #e9ecef'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            marginBottom: '10px'
                                        }}>
                                            <div>
                                                <strong style={{ fontSize: '1.1rem' }}>{review.user}</strong>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {renderStars(review.rating)}
                                                <div style={{
                                                    fontSize: '0.8rem',
                                                    color: '#666',
                                                    marginTop: '5px'
                                                }}>
                                                    {new Date(review.date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            lineHeight: '1.5',
                                            color: '#555'
                                        }}>
                                            {review.comment}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ServiceDetailsModal; 