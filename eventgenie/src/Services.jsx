import React, { useState, useEffect, useRef } from "react";
import "./style.css";
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

function Services({ selectedServices, toggleService }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [priceRange, setPriceRange] = useState([0, 200000000]);
    const [ratingRange, setRatingRange] = useState([0, 5]);
    const [foodType, setFoodType] = useState('all');
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [showDatePopup, setShowDatePopup] = useState(false);
    const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

    // Use refs to prevent race conditions
    const abortControllerRef = useRef(null);
    const isInitialLoadRef = useRef(true);

    const categories = [
        { key: 'all', label: 'All Services' },
        { key: 'venue', label: 'Venue' },
        { key: 'catering', label: 'Catering' },
        { key: 'decor', label: 'Decor' },
        { key: 'entertainment', label: 'Entertainment' },
    ];

    // Fetch services from database with abort controller
    const fetchServices = async (filters = {}) => {
        try {
            // Cancel previous request if it exists
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create new abort controller
            abortControllerRef.current = new AbortController();

            setLoading(true);
            setError('');

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.category && filters.category !== 'all') {
                params.append('category', filters.category);
            }
            if (filters.minPrice !== undefined) {
                params.append('minPrice', filters.minPrice);
            }
            if (filters.maxPrice !== undefined) {
                params.append('maxPrice', filters.maxPrice);
            }
            if (filters.minRating !== undefined) {
                params.append('minRating', filters.minRating);
            }
            if (filters.maxRating !== undefined) {
                params.append('maxRating', filters.maxRating);
            }
            if (filters.foodType && filters.foodType !== 'all') {
                params.append('foodType', filters.foodType);
            }
            if (filters.date) {
                params.append('date', filters.date);
            }

            const url = `http://localhost:5001/api/services${params.toString() ? `?${params.toString()}` : ''}`;
            console.log('Fetching services from:', url);

            const response = await fetch(url, {
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch services: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched services:', data);
            console.log('Number of services fetched:', data.length);

            // Only update state if this is still the current request
            if (!abortControllerRef.current.signal.aborted) {
                setServices(data);
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Request was aborted');
                return;
            }
            setError(`Failed to load services: ${err.message}`);
            console.error('Error fetching services:', err);
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setLoading(false);
            }
        }
    };

    // Initial load - fetch all services
    useEffect(() => {
        if (isInitialLoadRef.current) {
            fetchServices();
            isInitialLoadRef.current = false;
        }
    }, []);

    // Apply filters with debouncing
    useEffect(() => {
        if (isInitialLoadRef.current) return; // Skip on initial load

        const timeoutId = setTimeout(() => {
            const filters = {
                category: activeCategory,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
                minRating: ratingRange[0],
                maxRating: ratingRange[1],
                foodType: activeCategory === 'catering' ? foodType : undefined,
                date: selectedDate
            };

            console.log('=== FILTERING SERVICES ===');
            console.log('Active category:', activeCategory);
            console.log('Price range:', priceRange);
            console.log('Rating range:', ratingRange);
            console.log('Food type:', foodType);
            console.log('Selected date:', selectedDate);
            console.log('Applied filters:', filters);
            console.log('========================');

            fetchServices(filters);
        }, 300); // Reduced debounce time

        return () => clearTimeout(timeoutId);
    }, [activeCategory, priceRange, ratingRange, foodType, selectedDate]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Calculate average rating for services
    const getAverageRating = (service) => {
        if (!service.reviews || service.reviews.length === 0) return 0;
        const totalRating = service.reviews.reduce((sum, review) => sum + review.rating, 0);
        return totalRating / service.reviews.length;
    };

    // Format price for display
    const formatPrice = (price) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(1)}Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(1)}L`;
        } else if (price >= 1000) {
            return `₹${(price / 1000).toFixed(1)}K`;
        } else {
            return `₹${price}`;
        }
    };

    const handlePriceChange = (e, idx) => {
        const val = Number(e.target.value);
        setPriceRange(r => idx === 0 ? [val, r[1]] : [r[0], val]);
    };

    const handleRatingChange = (e, idx) => {
        const val = Number(e.target.value);
        setRatingRange(r => idx === 0 ? [val, r[1]] : [r[0], val]);
    };

    const handleFoodType = type => setFoodType(type);

    const clearFilters = () => {
        setActiveCategory('all');
        setPriceRange([0, 200000000]);
        setRatingRange([0, 5]);
        setFoodType('all');
        setSelectedDate('');
        setShowOnlyAvailable(true);
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
        console.log('handleAddToCart called with:', service);
        console.log('Current selectedServices:', selectedServices);
        console.log('Service ID:', service._id);
        console.log('Selected services IDs:', selectedServices.map(s => s._id));
        console.log('Service availability:', service.isAvailable);
        console.log('Selected date:', selectedDate);

        // Check if service is already in cart
        const isAlreadySelected = selectedServices.some((s) => s._id === service._id);

        if (isAlreadySelected) {
            // Remove from cart
            toggleService(service);
            return;
        }

        // Check if date is selected
        if (!selectedDate) {
            setShowDatePopup(true);
            return;
        }

        // Check if the service is available for the selected date
        // Fix: Check for both false and undefined/not set values
        if (service.isAvailable === false || service.isAvailable === undefined) {
            alert(`${service.name} is not available for ${new Date(selectedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}. Please select a different date or service.`);
            return;
        }

        // Additional safety check: if we have a selected date, ensure the service is actually available
        if (selectedDate && service.isAvailable !== true) {
            alert(`${service.name} availability cannot be determined. Please refresh the page and try again.`);
            return;
        }

        // Add the selected date to the service object
        const serviceWithDate = {
            ...service,
            selectedDate: selectedDate
        };

        // Add to cart
        toggleService(serviceWithDate);
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const closeDatePopup = () => {
        setShowDatePopup(false);
    };

    return (
        <section id="services" className="page active services-page" style={{
            width: '100%'
        }}>
            <div className="container" >
                <h2 className="section-title">Our Services</h2>

                <div className="service-tabs">
                    {categories.map((cat) => (
                        <button
                            key={cat.key}
                            className={`tab-btn${activeCategory === cat.key ? ' active' : ''}`}
                            data-category={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Main Content with Sidebar Layout */}
                <div className="main-content" style={{
                    display: 'flex',
                    gap: '24px',
                    marginTop: '24px',
                    width: '120%',
                    marginLeft: '-10%'
                }}>
                    {/* Left Sidebar - Filters */}
                    <div className="sidebar" style={{
                        width: '320px',
                        flexShrink: 0,
                        background: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        padding: '24px',
                        height: 'fit-content',
                        position: 'sticky',
                        top: '13%',
                    }}>
                        <h3 style={{
                            margin: '0 0 20px 0',
                            fontSize: '1.2rem',
                            fontWeight: '600',
                            color: '#333',
                            borderBottom: '2px solid #6c63ff',
                            paddingBottom: '8px'
                        }}>
                            <i className="fas fa-filter" style={{ marginRight: '8px' }}></i>
                            Filters
                            <button
                                className="btn secondary-btn"
                                onClick={clearFilters}
                                style={{
                                    marginLeft: '75px',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    fontWeight: '500'
                                }}
                            >
                                <i className="fas fa-times" style={{ marginRight: '8px' }}></i>
                                Clear
                            </button>
                        </h3>
                        {/* Date Filter */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontWeight: 500,
                                display: 'block',
                                marginBottom: '8px',
                                color: '#555'
                            }}>
                                <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                                Event Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                min={new Date().toISOString().split('T')[0]}
                                style={{
                                    padding: '10px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Select event date"
                            />
                        </div>
                        {/* Availability Filter */}
                        {selectedDate && (
                            <div style={{
                                marginBottom: '20px',
                                padding: '10px',
                                paddingBottom: '1px',
                                background: '#e8f5e8',
                                borderRadius: '8px',
                                border: '1px solid #c8e6c9'
                            }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: '500',
                                    color: '#2e7d32',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={showOnlyAvailable}
                                        onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                                        style={{ display: 'none' }} // Hide default checkbox
                                    />
                                    <span
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid #ccc',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {showOnlyAvailable && (
                                            <i className="fas fa-check-circle" style={{ color: '#28a745', fontSize: '1rem' }}></i>
                                        )}
                                    </span>
                                    Show only available
                                </label>

                            </div>
                        )}
                        {/* Food Type Filter */}
                        {activeCategory === 'catering' && (
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    fontWeight: 500,
                                    display: 'block',
                                    marginBottom: '12px',
                                    color: '#555'
                                }}>
                                    <i className="fas fa-utensils" style={{ marginRight: '4px' }}></i>
                                    Food Type
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="foodType"
                                            value="veg"
                                            checked={foodType === 'veg'}
                                            onChange={(e) => handleFoodType(e.target.value)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <i className="fas fa-leaf" style={{ color: '#4caf50', marginRight: '6px' }}></i>
                                        Vegetarian
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="foodType"
                                            value="nonveg"
                                            checked={foodType === 'nonveg'}
                                            onChange={(e) => handleFoodType(e.target.value)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <i className="fas fa-drumstick-bite" style={{ color: '#f44336', marginRight: '6px' }}></i>
                                        Non-Vegetarian
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="foodType"
                                            value="both"
                                            checked={foodType === 'both'}
                                            onChange={(e) => handleFoodType(e.target.value)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <i className="fas fa-utensils" style={{ color: '#ff9800', marginRight: '6px' }}></i>
                                        Veg & Non-Veg
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="foodType"
                                            value="all"
                                            checked={foodType === 'all'}
                                            onChange={(e) => handleFoodType(e.target.value)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        <i class="fa-solid fa-bowl-rice" style={{ color: 'rgb(21, 58, 122)', marginRight: '6px' }}></i>
                                        All
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Price Filter */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontWeight: 500,
                                display: 'block',
                                marginBottom: '12px',
                                color: '#555'
                            }}>
                                <i className="fa-solid fa-indian-rupee-sign" style={{ marginRight: '4px' }}></i>
                                Price filter
                            </label>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>Starting Price : </span>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>{formatPrice(priceRange[0])}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={200000000}
                                    step={500}
                                    value={priceRange[0]}
                                    onChange={e => handlePriceChange(e, 0)}
                                    style={{ width: '100%' }}
                                />
                                <span style={{ fontSize: '0.9em', color: '#666' }}>Ending Price : {formatPrice(priceRange[1])}</span>

                                <input
                                    type="range"
                                    min={0}
                                    max={200000000}
                                    step={500}
                                    value={priceRange[1]}
                                    onChange={e => handlePriceChange(e, 1)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                fontWeight: 500,
                                display: 'block',
                                marginBottom: '12px',
                                color: '#555'
                            }}>
                                <i className="fas fa-star" style={{ marginRight: '4px', color: '#f39c12' }}></i>
                                Rating filter
                            </label>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>Minimum Rating : {ratingRange[0]}</span>

                                <input
                                    type="range"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={ratingRange[0]}
                                    onChange={e => handleRatingChange(e, 0)}
                                    style={{ width: '100%' }}
                                />
                                <span style={{ fontSize: '0.9em', color: '#666' }}>Maximum Rating : {ratingRange[1]}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={ratingRange[1]}
                                    onChange={e => handleRatingChange(e, 1)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>


                        {/* Clear Filters Button */}

                    </div>

                    {/* Right Content Area */}
                    <div style={{ flex: 1 }}>
                        {/* Date Selection Notice */}
                        {!selectedDate && (
                            <div style={{
                                background: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <i className="fas fa-info-circle" style={{ color: '#856404', fontSize: '1.1rem' }}></i>
                                <div>
                                    <strong style={{ color: '#856404' }}>Select Event Date:</strong>
                                    <span style={{ color: '#856404', marginLeft: '8px' }}>
                                        Choose a date in the sidebar to see available services and add them to your cart.
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#666'
                            }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', marginBottom: '20px', color: '#6c63ff' }}></i>
                                <h3>Loading services...</h3>
                                <p>Please wait while we fetch the latest services for you.</p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !loading && (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 20px',
                                color: '#d32f2f',
                                background: '#ffebee',
                                borderRadius: '12px',
                                marginBottom: '24px'
                            }}>
                                <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
                                <h3>Error Loading Services</h3>
                                <p>{error}</p>
                                <button
                                    className="btn primary-btn"
                                    onClick={() => fetchServices()}
                                    style={{ marginTop: '16px' }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Services Grid */}
                        {!loading && !error && (
                            <div className="services-grid" style={{ marginTop: 0 }}>
                                {services.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '60px 20px',
                                        color: '#666',
                                        gridColumn: '1 / -1'
                                    }}>
                                        <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.5 }}></i>
                                        <h3>No services found</h3>
                                        <p>
                                            {selectedDate
                                                ? `No services available for ${new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Try a different date or adjust your filters.`
                                                : 'Select a date in the sidebar to see available services or try adjusting your filters.'
                                            }
                                        </p>
                                        <button
                                            className="btn primary-btn"
                                            onClick={clearFilters}
                                            style={{ marginTop: '16px' }}
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            marginBottom: '16px',
                                            padding: '12px 16px',
                                            background: '#f5f5f5',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            color: '#666'
                                        }}>
                                            {selectedDate ? (
                                                <>
                                                    Showing {services.filter(s => s.isAvailable !== false).length} available out of {services.length} total services
                                                    for {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    {activeCategory !== 'all' && ` in ${categories.find(c => c.key === activeCategory)?.label}`}
                                                </>
                                            ) : (
                                                <>
                                                    Showing {services.length} service{services.length !== 1 ? 's' : ''}
                                                    {activeCategory !== 'all' && ` in ${categories.find(c => c.key === activeCategory)?.label}`}
                                                </>
                                            )}
                                        </div>
                                        {services
                                            .filter(service => !selectedDate || !showOnlyAvailable || service.isAvailable !== false)
                                            .map((service) => {
                                                const isSelected = selectedServices.some((s) => s._id === service._id);
                                                const avgRating = getAverageRating(service);
                                                const imageUrl = service.images && service.images.length > 0 ? service.images[0] : service.image;
                                                const isAvailable = service.isAvailable !== false; // Default to true if not specified

                                                // Debug logging for availability
                                                console.log(`Service ${service.name}: isAvailable = ${service.isAvailable}, calculated isAvailable = ${isAvailable}`);

                                                return (
                                                    <div
                                                        key={service._id}
                                                        className={`service-card${isSelected ? ' selected' : ''}`}
                                                        style={{
                                                            margin: 8,
                                                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                            opacity: isAvailable ? 1 : 0.8,
                                                            position: 'relative',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            height: '100%',
                                                            border: selectedDate && !isAvailable ? '2px solid #f44336' : undefined,
                                                            backgroundColor: selectedDate && !isAvailable ? '#fff5f5' : undefined,
                                                            boxShadow: selectedDate && !isAvailable ? '0 4px 12px rgba(244, 67, 54, 0.2)' : undefined
                                                        }}
                                                        onClick={() => isAvailable && openServiceModal(service)}
                                                    >
                                                        {/* Enhanced Availability Badge */}
                                                        {selectedDate && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '8px',
                                                                left: '8px',
                                                                padding: '6px 12px',
                                                                borderRadius: '16px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '700',
                                                                zIndex: 10,
                                                                backgroundColor: isAvailable ? '#4caf50' : '#f44336',
                                                                color: 'white',
                                                                boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                {isAvailable ? '✓ Available' : '✗ Booked'}
                                                            </div>
                                                        )}

                                                        <div className="service-image-container" style={{
                                                            position: 'relative',
                                                            // Add red overlay for booked services
                                                            ...(selectedDate && !isAvailable && {
                                                                '&::after': {
                                                                    content: '""',
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                                                    pointerEvents: 'none'
                                                                }
                                                            })
                                                        }}>
                                                            <img
                                                                src={imageUrl}
                                                                alt={service.name}
                                                                className="service-image"
                                                                style={{
                                                                    // Add red tint for booked services
                                                                    filter: selectedDate && !isAvailable ? 'sepia(0.3) hue-rotate(340deg) saturate(1.2)' : undefined
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                                }}
                                                            />
                                                            {/* Red overlay for booked services */}
                                                            {selectedDate && !isAvailable && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    right: 0,
                                                                    bottom: 0,
                                                                    backgroundColor: 'rgba(244, 67, 54, 0.15)',
                                                                    pointerEvents: 'none',
                                                                    borderRadius: '12px 12px 0 0'
                                                                }}></div>
                                                            )}
                                                        </div>
                                                        <div className="service-info" style={{
                                                            color: selectedDate && !isAvailable ? '#d32f2f' : undefined,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            flex: 1,
                                                            minHeight: 0
                                                        }}>
                                                            <h3 className="service-name" style={{ color: selectedDate && !isAvailable ? '#d32f2f' : undefined }}>
                                                                {service.name}
                                                            </h3>
                                                            <p className="service-provider" style={{ color: selectedDate && !isAvailable ? '#e57373' : undefined }}>
                                                                by {service.provider}
                                                            </p>
                                                            <div className="service-rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                {renderStars(avgRating)}
                                                                <span style={{ color: selectedDate && !isAvailable ? '#e57373' : '#888', fontSize: '0.95em' }}>{avgRating.toFixed(1)}</span>
                                                                {service.reviews && service.reviews.length > 0 && (
                                                                    <span style={{ color: selectedDate && !isAvailable ? '#e57373' : '#888', fontSize: '0.9em' }}>({service.reviews.length} reviews)</span>
                                                                )}
                                                            </div>
                                                            <p className="service-price" style={{ color: selectedDate && !isAvailable ? '#d32f2f' : undefined, fontWeight: selectedDate && !isAvailable ? '700' : undefined }}>
                                                                {formatPrice(service.price)}
                                                            </p>

                                                            {/* Enhanced Availability Message */}
                                                            {selectedDate && !isAvailable && (
                                                                <div style={{
                                                                    background: '#ffebee',
                                                                    color: '#c62828',
                                                                    padding: '12px 16px',
                                                                    borderRadius: '8px',
                                                                    marginTop: '12px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: '500',
                                                                    textAlign: 'center',
                                                                    border: '1px solid #ffcdd2'
                                                                }}>
                                                                    <i className="fas fa-calendar-times" style={{ marginRight: '6px' }}></i>
                                                                    Already booked for this date
                                                                </div>
                                                            )}

                                                            {/* Add to Cart Button */}
                                                            {isAvailable && (
                                                                <button
                                                                    className="btn primary-btn"
                                                                    style={{ width: '100%', marginTop: 4, padding: '12px', fontSize: '1rem', fontWeight: '500' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleAddToCart(service);
                                                                    }}
                                                                >
                                                                    <i className="fas fa-cart-plus" style={{ marginRight: '8px' }}></i>
                                                                    Add to Cart
                                                                </button>
                                                            )}

                                                            {/* Disabled Add to Cart Button for Booked Services */}
                                                            {selectedDate && !isAvailable && (
                                                                <button
                                                                    className="btn secondary-btn"
                                                                    style={{ width: '100%', marginTop: 4, padding: '12px', fontSize: '1rem', fontWeight: '500', opacity: 0.6, cursor: 'not-allowed' }}
                                                                    disabled
                                                                    title={service.availabilityStatus === 'Blocked' ? 'Service is blocked by vendor for this date' : 'Service is already booked for this date'}
                                                                >
                                                                    <i className="fas fa-ban" style={{ marginRight: '8px' }}></i>
                                                                    {service.availabilityStatus === 'Blocked' ? 'Blocked by Vendor' : 'Not Available'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Details Modal */}
                {isModalOpen && selectedService && (
                    <ServiceDetailsModal
                        service={selectedService}
                        onClose={closeServiceModal}
                        onAddToCart={handleAddToCart}
                        selectedDate={selectedDate}
                        showDatePopup={showDatePopup}
                        closeDatePopup={closeDatePopup}
                    />
                )}
            </div>
        </section>
    );
}

export default Services;
