import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import './vendor-dashboard.css';
import ServiceDetailsModal from './ServiceDetailsModal.jsx';
import Calendar from 'react-multi-date-picker-calendar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

export default function VendorDashboard({ vendor, isVendorLoggedIn, logout, servicesList, setServicesList, vendorTab, setVendorTab }) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [editServiceId, setEditServiceId] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editProfileData, setEditProfileData] = useState({
        name: vendor?.name || '',
        username: vendor?.username || '',
        password: '',
        businessName: vendor?.businessName || '',
        email: vendor?.email || '',
        phone: vendor?.phone || '',
        about: vendor?.about || '',
        services: vendor?.categories || []
    });
    const [bookings, setBookings] = useState([]);
    const [form, setForm] = useState({
        name: '',
        category: '',
        foodType: 'both',
        price: '',
        images: [''],
        description: '',
        address: '',
        provider: vendor?.businessName || '',
        vendorUsername: vendor?.username || '',
    });
    const navigate = useNavigate();

    // Fetch vendor's services on component mount
    useEffect(() => {
        if (vendor && vendor.id) {
            fetchVendorServices();
            fetchVendorBookings();
        }
    }, [vendor]);

    const fetchVendorServices = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/vendors/services/${vendor.id}`);
            if (response.ok) {
                const vendorServices = await response.json();
                // Update services list with vendor's services
                setServicesList(prev => {
                    const otherServices = prev.filter(s => s.vendorUsername !== vendor.username);
                    return [...otherServices, ...vendorServices];
                });
            }
        } catch (error) {
            console.error('Error fetching vendor services:', error);
        }
    };

    const fetchVendorBookings = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/bookings/vendor/${vendor.id}`);
            if (response.ok) {
                const vendorBookings = await response.json();
                setBookings(vendorBookings);
            }
        } catch (error) {
            console.error('Error fetching vendor bookings:', error);
        }
    };

    if (!isVendorLoggedIn || !vendor) {
        window.location.href = '/login';
        return null;
    }

    const categories = [
        { key: 'all', label: 'All Categories' },
        { key: 'venue', label: 'Venue' },
        { key: 'catering', label: 'Catering' },
        { key: 'decor', label: 'Decor' },
        { key: 'entertainment', label: 'Entertainment' },
    ];

    // Filter services for this vendor
    let myServices = servicesList.filter(s => s.vendorUsername === vendor.username);

    // Apply search filter
    if (search) {
        myServices = myServices.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
        myServices = myServices.filter(s => s.category === selectedCategory);
    }

    // Get all reviews for vendor's services
    const getVendorReviews = () => {
        const reviews = [];
        myServices.forEach(service => {
            if (service.reviews) {
                service.reviews.forEach(review => {
                    reviews.push({
                        ...review,
                        serviceName: service.name,
                        serviceId: service._id
                    });
                });
            }
        });
        return reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Handle profile data changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditProfileData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error messages when user starts typing
        setError('');
    };

    // Handle service checkbox changes
    const handleServiceChange = (e) => {
        const { value, checked } = e.target;
        setEditProfileData(prev => ({
            ...prev,
            services: checked
                ? [...prev.services, value]
                : prev.services.filter(s => s !== value)
        }));
    };

    // Handle profile save with API integration
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const updateData = {
                name: editProfileData.name,
                username: editProfileData.username,
                businessName: editProfileData.businessName,
                email: editProfileData.email,
                phone: editProfileData.phone,
                about: editProfileData.about,
                categories: editProfileData.services
            };

            // Only include password if it's not empty
            if (editProfileData.password) {
                updateData.password = editProfileData.password;
            }

            const response = await fetch(`http://localhost:5001/api/vendors/profile/${vendor.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                setEditingProfile(false);
                alert('Profile updated successfully!');
                // Update the vendor data in parent component
                Object.assign(vendor, updateData);
                // Clear password field
                setEditProfileData(prev => ({ ...prev, password: '' }));
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Add or update service with API integration
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.category || !form.price || !form.description || !form.address) {
            alert('Please fill all required fields');
            return;
        }

        // Validate images array
        const validImages = form.images.filter(img => img.trim() !== '');
        if (validImages.length === 0) {
            alert('At least one image is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const serviceData = {
                name: form.name,
                provider: form.provider,
                price: parseFloat(form.price),
                category: form.category,
                foodType: form.foodType,
                images: validImages,
                description: form.description,
                address: form.address
            };

            let response;
            if (editServiceId) {
                // Update existing service
                response = await fetch(`http://localhost:5001/api/vendors/services/${vendor.id}/${editServiceId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(serviceData),
                });
            } else {
                // Create new service
                response = await fetch(`http://localhost:5001/api/vendors/services/${vendor.id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(serviceData),
                });
            }

            if (response.ok) {
                const result = await response.json();

                if (editServiceId) {
                    // Update existing service in list
                    setServicesList(prev => prev.map(s =>
                        s._id === editServiceId ? result.service : s
                    ));
                } else {
                    // Add new service to list
                    setServicesList(prev => [...prev, result.service]);
                }

                setForm({
                    name: '',
                    category: '',
                    foodType: 'both',
                    price: '',
                    images: [''],
                    description: '',
                    address: '',
                    provider: vendor.businessName,
                    vendorUsername: vendor.username
                });
                setEditServiceId(null);
                setVendorTab('services');
                alert(editServiceId ? 'Service updated successfully!' : 'Service created successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to save service');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Edit service
    const handleEdit = service => {
        setForm({
            name: service.name,
            category: service.category,
            foodType: service.foodType,
            price: service.price.toString(),
            images: service.images || [''],
            description: service.description,
            address: service.address,
            provider: service.provider,
            vendorUsername: service.vendorUsername
        });
        setEditServiceId(service._id);
        setVendorTab('add');
    };

    // Delete service with API integration
    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`http://localhost:5001/api/vendors/services/${vendor.id}/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setServicesList(prev => prev.filter(s => s._id !== id));
                alert('Service deleted successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete service');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle image input changes
    const handleImageChange = (index, value) => {
        const newImages = [...form.images];
        newImages[index] = value;
        setForm(prev => ({ ...prev, images: newImages }));
    };

    const addImageField = () => {
        setForm(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImageField = (index) => {
        if (form.images.length > 1) {
            const newImages = form.images.filter((_, i) => i !== index);
            setForm(prev => ({ ...prev, images: newImages }));
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
        // This function is not needed for vendor dashboard, but required by the modal
        console.log('Add to cart clicked for service:', service.name);
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('all');
    };

    return (
        <div className="vendor-dashboard-body" >
            <Navbar
                isVendorLoggedIn={isVendorLoggedIn}
                currentVendor={vendor}
                vendorTab={vendorTab}
                setVendorTab={setVendorTab}
            />
            {/* Main Content */}
            <div className="dashboard-content" style={{ marginLeft: 0, marginTop: '90px' }}>
                {error && (
                    <div style={{
                        marginLeft: '4%', marginRight: '4%',
                        background: '#f8d7da',
                        color: '#721c24',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #f5c6cb'
                    }}>
                        {error}
                    </div>
                )}

                {vendorTab === 'services' && (
                    <section className="dashboard-section active" style={{ marginLeft: '5%', marginRight: '5%' }}>
                        <div className="section-header">
                            <h2>My Services</h2>
                            <button className="btn primary-btn" onClick={() => {
                                setVendorTab('add');
                                setEditServiceId(null);
                                setForm({
                                    name: '',
                                    category: '',
                                    foodType: 'both',
                                    price: '',
                                    images: [''],
                                    description: '',
                                    address: '',
                                    provider: vendor.businessName,
                                    vendorUsername: vendor.username
                                });
                            }}>
                                <i className="fas fa-plus"></i> Add New Service
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="service-filters" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '20px',
                            marginBottom: '30px',
                            padding: '20px',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            alignItems: 'center'
                        }}>
                            <div className="search-group">
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        padding: '10px 15px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        width: '250px'
                                    }}
                                />
                            </div>

                            <div className="category-filter">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={{
                                        padding: '10px 15px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        backgroundColor: 'white'
                                    }}
                                >
                                    {categories.map(cat => (
                                        <option key={cat.key} value={cat.key}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className="btn secondary-btn"
                                onClick={clearFilters}
                                style={{ padding: '10px 20px' }}
                            >
                                Clear Filters
                            </button>

                            <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#666' }}>
                                {myServices.length} service{myServices.length !== 1 ? 's' : ''} found
                            </div>
                        </div>

                        {/* Services Grid */}
                        <div className="services-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '24px',
                            marginTop: '20px'
                        }}>
                            {myServices.length === 0 ? (
                                <div style={{
                                    gridColumn: '1 / -1',
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    color: '#666'
                                }}>
                                    <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.5 }}></i>
                                    <h3>No services found</h3>
                                    <p>Try adjusting your search or category filters, or add your first service!</p>
                                </div>
                            ) : (
                                myServices.map(service => (
                                    <div
                                        key={service._id}
                                        className="service-card"
                                        style={{
                                            cursor: 'pointer',
                                            background: '#fff',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%'
                                        }}
                                        onClick={() => openServiceModal(service)}
                                    >
                                        <div className="service-image-container" style={{ width: '100%', height: '200px', overflow: 'hidden' }}>
                                            <img
                                                src={service.images && service.images.length > 0 ? service.images[0] : service.image}
                                                alt={service.name}
                                                className="service-image"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                                                }}
                                            />
                                        </div>
                                        <div className="service-content" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: '600' }}>{service.name}</h3>
                                            <p style={{ color: '#666', margin: '0 0 10px 0', fontSize: '0.9rem' }}>{service.provider}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{service.category}</span>
                                                <span style={{ fontWeight: '600', color: '#2e7d32' }}> ₹{service.price}</span>
                                            </div>
                                            {service.reviews && service.reviews.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {renderStars(service.reviews.reduce((acc, review) => acc + review.rating, 0) / service.reviews.length)}
                                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>({service.reviews.length} reviews)</span>
                                                </div>
                                            )}
                                            <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn secondary-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(service);
                                                    }}
                                                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn danger-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(service._id);
                                                    }}
                                                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {vendorTab === 'add' && (
                    <section className="dashboard-section active" style={{ marginLeft: '5%', marginRight: '5%' }}>
                        <div className="section-header">
                            <h2>{editServiceId ? 'Edit Service' : 'Add New Service'}</h2>
                            <button className="btn secondary-btn" onClick={() => setVendorTab('services')}>
                                <i className="fas fa-arrow-left"></i> Back to Services
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
                            <div className="form-group">
                                <label htmlFor="service-name">Service Name *</label>
                                <input
                                    type="text"
                                    id="service-name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-category">Category *</label>
                                <select
                                    id="service-category"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                >
                                    <option value="">Select Category</option>
                                    <option value="venue">Venue</option>
                                    <option value="catering">Catering</option>
                                    <option value="decor">Decor</option>
                                    <option value="entertainment">Entertainment</option>
                                </select>
                            </div>

                            {form.category === 'catering' && (
                                <div className="form-group">
                                    <label htmlFor="service-foodType">Food Type</label>
                                    <select
                                        id="service-foodType"
                                        value={form.foodType}
                                        onChange={(e) => setForm({ ...form, foodType: e.target.value })}
                                        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                    >
                                        <option value="both">Both Veg & Non-Veg</option>
                                        <option value="veg">Vegetarian Only</option>
                                        <option value="nonveg">Non-Vegetarian Only</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="service-price">Price (₹) *</label>
                                <input
                                    type="number"
                                    id="service-price"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-description">Description *</label>
                                <textarea
                                    id="service-description"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    required
                                    rows="4"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="service-address">Address *</label>
                                <input
                                    type="text"
                                    id="service-address"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Images *</label>
                                {form.images.map((image, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <input
                                            type="url"
                                            placeholder="Image URL"
                                            value={image}
                                            onChange={(e) => handleImageChange(index, e.target.value)}
                                            required={index === 0}
                                            style={{ flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}
                                        />
                                        {form.images.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeImageField(index)}
                                                style={{
                                                    padding: '12px 15px',
                                                    background: '#dc3545',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addImageField}
                                    style={{
                                        padding: '10px 15px',
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    Add Another Image
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                <button
                                    type="submit"
                                    className="btn primary-btn"
                                    disabled={loading}
                                    style={{ flex: 1, padding: '15px' }}
                                >
                                    {loading ? 'Saving...' : (editServiceId ? 'Update Service' : 'Add Service')}
                                </button>
                                <button
                                    type="button"
                                    className="btn secondary-btn"
                                    onClick={() => setVendorTab('services')}
                                    style={{ flex: 1, padding: '15px' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {vendorTab === 'profile' && (
                    <section className="dashboard-section active" style={{ marginLeft: '5%', marginRight: '5%' }}>
                        <div className="container">
                            <h2 className="section-title">My Profile</h2>

                        </div>

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
                                        src={vendor.profilePhoto || 'https://randomuser.me/api/portraits/lego/1.jpg'}
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
                                        {vendor.name}
                                    </h3>
                                    <p style={{ margin: '0', color: '#666', fontSize: '1rem' }}>
                                        @{vendor.username}
                                    </p>
                                    <p style={{ margin: '8px 0 0 0', color: '#6c63ff', fontSize: '1.1rem', fontWeight: '600' }}>
                                        {vendor.businessName}
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

                                        {error && (
                                            <div style={{
                                                background: '#fee',
                                                color: '#c33',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                marginBottom: '20px',
                                                border: '1px solid #fcc'
                                            }}>
                                                {error}
                                            </div>
                                        )}

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
                                                    value={editProfileData.username || vendor.username}
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
                                                    Business Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="businessName"
                                                    value={editProfileData.businessName}
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

                                            <div className="form-group">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                                    New Password (leave blank to keep current)
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
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
                                        </div>

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                                About Your Business
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

                                        <div className="form-group" style={{ marginTop: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
                                                Services Provided
                                            </label>
                                            <div className="checkbox-group" style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                                gap: '12px'
                                            }}>
                                                {['venue', 'catering', 'decor', 'entertainment'].map(service => (
                                                    <label key={service} className="checkbox-label" style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #ddd',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            value={service}
                                                            checked={editProfileData.services.includes(service)}
                                                            onChange={handleServiceChange}
                                                        />
                                                        {service.charAt(0).toUpperCase() + service.slice(1)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                                            <button
                                                type="submit"
                                                className="btn primary-btn"
                                                disabled={loading}
                                                style={{ flex: 1, padding: '15px' }}
                                            >
                                                {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn secondary-btn"
                                                onClick={() => {
                                                    setEditingProfile(false);
                                                    setError('');
                                                    setEditProfileData({
                                                        name: vendor?.name || '',
                                                        username: vendor?.username || '',
                                                        password: '',
                                                        businessName: vendor?.businessName || '',
                                                        email: vendor?.email || '',
                                                        phone: vendor?.phone || '',
                                                        about: vendor?.about || '',
                                                        services: vendor?.categories || []
                                                    });
                                                }}
                                                style={{ flex: 1, padding: '15px' }}
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
                                                    {vendor.name}
                                                </p>
                                            </div>

                                            <div className="info-item">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                    Username
                                                </label>
                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                    @{vendor.username}
                                                </p>
                                            </div>

                                            <div className="info-item">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                    Business Name
                                                </label>
                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                    {vendor.businessName}
                                                </p>
                                            </div>

                                            <div className="info-item">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                    Email
                                                </label>
                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                    {vendor.email}
                                                </p>
                                            </div>

                                            <div className="info-item">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                    Phone
                                                </label>
                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                    {vendor.phone}
                                                </p>
                                            </div>

                                            <div className="info-item">
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                    Services Offered
                                                </label>
                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                    {vendor.categories ? vendor.categories.join(', ') : 'No services specified'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="info-item" style={{ marginTop: '20px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                                                About
                                            </label>
                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333', lineHeight: '1.6' }}>
                                                {vendor.about || 'No description provided'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Reviews Section - Similar to Past Bookings in Customer Profile */}
                        <div className="reviews-section" style={{ marginTop: '40px' }}>
                            <div className="section-header">
                                <h3 style={{ margin: '0', color: '#333', fontSize: '1.5rem' }}>
                                    <i className="fas fa-star" style={{ marginRight: '8px', color: '#6c63ff' }}></i>
                                    Customer Reviews
                                </h3>
                            </div>

                            <div className="reviews-container" style={{
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '30px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                marginTop: '20px'
                            }}>
                                {getVendorReviews().length > 0 ? (
                                    <div className="reviews-list">
                                        {getVendorReviews().map((review, index) => (
                                            <div key={index} className="review-item" style={{
                                                border: '1px solid #e9ecef',
                                                borderRadius: '12px',
                                                padding: '24px',
                                                marginBottom: '20px',
                                                background: '#fafafa'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#333' }}>
                                                            Review by {review.user}
                                                        </h4>
                                                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                                                            <i className="fas fa-tag" style={{ marginRight: '4px' }}></i>
                                                            {review.serviceName}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#e8f5e8',
                                                            borderRadius: '20px',
                                                            fontSize: '0.9rem',
                                                            color: '#2d5a2d',
                                                            fontWeight: '500'
                                                        }}>
                                                            {review.rating}/5
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ marginTop: '16px' }}>
                                                    <p style={{ margin: '0', fontSize: '1rem', color: '#333', lineHeight: '1.6' }}>
                                                        "{review.comment}"
                                                    </p>
                                                </div>

                                                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                                    <small style={{ color: '#666', fontSize: '0.9rem' }}>
                                                        <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                                                        {new Date(review.date).toLocaleDateString()}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: '#666'
                                    }}>
                                        <i className="fas fa-star" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}></i>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No reviews yet</h4>
                                        <p style={{ margin: '0' }}>Customer reviews will appear here once they book and review your services.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {vendorTab === 'bookings' && (
                    <section className="dashboard-section active" style={{ marginLeft: '5%', marginRight: '5%' }}>
                        <div className="section-header">
                            <h2>Customer Bookings</h2>
                        </div>

                        <div className="bookings-container" style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '30px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            marginTop: '20px'
                        }}>
                            {bookings.length > 0 ? (
                                <div className="bookings-list">
                                    {bookings.map((booking, index) => {
                                        const getStatusColor = (status) => {
                                            switch (status) {
                                                case 'pending':
                                                    return { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' };
                                                case 'confirmed':
                                                    return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
                                                case 'cancelled':
                                                    return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
                                                default:
                                                    return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' };
                                            }
                                        };

                                        const statusStyle = getStatusColor(booking.status);

                                        return (
                                            <div key={index} className="booking-item" style={{
                                                border: `1px solid ${statusStyle.border}`,
                                                borderRadius: '12px',
                                                padding: '24px',
                                                marginBottom: '20px',
                                                background: statusStyle.bg
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#333' }}>
                                                            Booking #{index + 1}
                                                        </h4>
                                                        <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                                                            <i className="fas fa-calendar" style={{ marginRight: '4px' }}></i>
                                                            Booked for: {booking.bookedForDate}
                                                        </p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: statusStyle.bg,
                                                            borderRadius: '20px',
                                                            fontSize: '0.9rem',
                                                            color: statusStyle.color,
                                                            fontWeight: '500',
                                                            border: `1px solid ${statusStyle.border}`
                                                        }}>
                                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Customer Details */}
                                                <div style={{
                                                    background: '#fff',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    marginBottom: '16px',
                                                    border: '1px solid #e9ecef'
                                                }}>
                                                    <h5 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1rem' }}>
                                                        <i className="fas fa-user" style={{ marginRight: '8px', color: '#6c63ff' }}></i>
                                                        Customer Details
                                                    </h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Name
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                                {booking.customerName}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Email
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                                {booking.customerEmail}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Phone
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                                {booking.customerPhone}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Event Date
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                                                                {booking.eventDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Service Details */}
                                                <div style={{
                                                    background: '#fff',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e9ecef'
                                                }}>
                                                    <h5 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '1rem' }}>
                                                        <i className="fas fa-tag" style={{ marginRight: '8px', color: '#6c63ff' }}></i>
                                                        Service Details
                                                    </h5>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Service Name
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#333', fontWeight: '600' }}>
                                                                {booking.serviceName}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Total Amount
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#6c63ff', fontWeight: '600' }}>
                                                                ₹{booking.totalAmount}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Advance Amount (5%)
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '1rem', color: '#28a745', fontWeight: '600' }}>
                                                                ₹{booking.advanceAmount}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                Service ID
                                                            </label>
                                                            <p style={{ margin: '0', fontSize: '0.9rem', color: '#666', fontFamily: 'monospace' }}>
                                                                {booking.serviceId}
                                                            </p>
                                                        </div>
                                                        {booking.notes && (
                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                    Customer Notes
                                                                </label>
                                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333', fontStyle: 'italic' }}>
                                                                    {booking.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {booking.vendorNotes && (
                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#666', fontSize: '0.9rem' }}>
                                                                    Vendor Notes
                                                                </label>
                                                                <p style={{ margin: '0', fontSize: '1rem', color: '#333', fontStyle: 'italic' }}>
                                                                    {booking.vendorNotes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Payment Information for Approved Bookings */}
                                                {booking.status === 'approved' && (
                                                    <div style={{
                                                        background: '#e8f5e8',
                                                        padding: '16px',
                                                        borderRadius: '8px',
                                                        marginBottom: '16px',
                                                        border: '1px solid #4caf50'
                                                    }}>
                                                        <h5 style={{ margin: '0 0 12px 0', color: '#2e7d32', fontSize: '1rem' }}>
                                                            <i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i>
                                                            Payment Information
                                                        </h5>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#2e7d32', fontSize: '0.9rem' }}>
                                                                    Payment Status
                                                                </label>
                                                                <p style={{ margin: '0', fontSize: '1rem', color: '#2e7d32', fontWeight: '600' }}>
                                                                    {booking.advanceAmountPaid ? 'Advance Paid' : 'Pending Payment'}
                                                                </p>
                                                            </div>
                                                            {booking.advancePaymentExpiry && (
                                                                <div>
                                                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#2e7d32', fontSize: '0.9rem' }}>
                                                                        Payment Deadline
                                                                    </label>
                                                                    <p style={{ margin: '0', fontSize: '1rem', color: '#2e7d32' }}>
                                                                        {new Date(booking.advancePaymentExpiry).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Verification Section */}
                                                {booking.status === 'payment_pending_verification' && (
                                                    <div style={{
                                                        background: '#fff3cd',
                                                        padding: '16px',
                                                        borderRadius: '8px',
                                                        marginBottom: '16px',
                                                        border: '1px solid #ffc107'
                                                    }}>
                                                        <h5 style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '1rem' }}>
                                                            <i className="fas fa-clock" style={{ marginRight: '8px' }}></i>
                                                            Payment Verification Required
                                                        </h5>
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <p style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '0.9rem' }}>
                                                                <strong>Transaction ID:</strong> {booking.upiTransactionId}
                                                            </p>
                                                            <p style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '0.9rem' }}>
                                                                <strong>Amount:</strong> ₹{booking.advanceAmount}
                                                            </p>
                                                            <p style={{ margin: '0 0 16px 0', color: '#856404', fontSize: '0.9rem' }}>
                                                                <strong>Customer:</strong> {booking.customerName}
                                                            </p>
                                                            <p style={{ margin: '0', color: '#856404', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                                Please check your UPI account and verify if you received this payment.
                                                            </p>
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '12px',
                                                            justifyContent: 'flex-end'
                                                        }}>
                                                            <button
                                                                className="btn danger-btn"
                                                                onClick={async () => {
                                                                    try {
                                                                        setLoading(true);
                                                                        const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/verify-payment-by-vendor`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                            },
                                                                            body: JSON.stringify({
                                                                                verificationStatus: 'failed',
                                                                                notes: 'Payment not received or verification failed'
                                                                            })
                                                                        });
                                                                        if (response.ok) {
                                                                            toast.success('Payment verification failed. Customer notified.');
                                                                            fetchVendorBookings(); // Refresh bookings
                                                                        } else {
                                                                            const errorData = await response.json();
                                                                            toast.error(errorData.message || 'Failed to verify payment');
                                                                        }
                                                                    } catch (error) {
                                                                        toast.error('Network error. Please try again.');
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                                disabled={loading}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                                                                Payment Failed
                                                            </button>
                                                            <button
                                                                className="btn primary-btn"
                                                                onClick={async () => {
                                                                    try {
                                                                        setLoading(true);
                                                                        const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/verify-payment-by-vendor`, {
                                                                            method: 'POST',
                                                                            headers: {
                                                                                'Content-Type': 'application/json',
                                                                            },
                                                                            body: JSON.stringify({
                                                                                verificationStatus: 'verified',
                                                                                notes: 'Payment verified successfully'
                                                                            })
                                                                        });
                                                                        if (response.ok) {
                                                                            toast.success('Payment verified successfully. Booking confirmed.');
                                                                            fetchVendorBookings(); // Refresh bookings
                                                                        } else {
                                                                            const errorData = await response.json();
                                                                            toast.error(errorData.message || 'Failed to verify payment');
                                                                        }
                                                                    } catch (error) {
                                                                        toast.error('Network error. Please try again.');
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }}
                                                                disabled={loading}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: '500'
                                                                }}
                                                            >
                                                                <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                                                                Confirm Payment
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Payment Verification Results */}
                                                {(booking.status === 'advance_paid' || booking.status === 'payment_failed') && booking.paymentVerificationStatus && (
                                                    <div style={{
                                                        background: booking.status === 'advance_paid' ? '#e8f5e8' : '#ffebee',
                                                        padding: '16px',
                                                        borderRadius: '8px',
                                                        marginBottom: '16px',
                                                        border: `1px solid ${booking.status === 'advance_paid' ? '#4caf50' : '#f44336'}`
                                                    }}>
                                                        <h5 style={{ 
                                                            margin: '0 0 12px 0', 
                                                            color: booking.status === 'advance_paid' ? '#2e7d32' : '#c62828', 
                                                            fontSize: '1rem' 
                                                        }}>
                                                            <i className={`fas fa-${booking.status === 'advance_paid' ? 'check-circle' : 'times-circle'}`} style={{ marginRight: '8px' }}></i>
                                                            Payment Verification {booking.status === 'advance_paid' ? 'Successful' : 'Failed'}
                                                        </h5>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: booking.status === 'advance_paid' ? '#2e7d32' : '#c62828' }}>
                                                                <strong>Transaction ID:</strong> {booking.upiTransactionId}
                                                            </p>
                                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: booking.status === 'advance_paid' ? '#2e7d32' : '#c62828' }}>
                                                                <strong>Verification Date:</strong> {new Date(booking.vendorPaymentVerificationDate).toLocaleString()}
                                                            </p>
                                                            {booking.vendorPaymentVerificationNotes && (
                                                                <p style={{ margin: '0', fontSize: '0.9rem', color: booking.status === 'advance_paid' ? '#2e7d32' : '#c62828', fontStyle: 'italic' }}>
                                                                    <strong>Notes:</strong> {booking.vendorPaymentVerificationNotes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons for Pending Bookings */}
                                                {booking.status === 'pending' && (
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        marginTop: '16px',
                                                        justifyContent: 'flex-end'
                                                    }}>
                                                        <button
                                                            className="btn danger-btn"
                                                            onClick={async () => {
                                                                try {
                                                                    setLoading(true);
                                                                    const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/approve`, {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            status: 'rejected',
                                                                            vendorNotes: 'Booking rejected by vendor'
                                                                        })
                                                                    });
                                                                    if (response.ok) {
                                                                        toast.success('Booking rejected successfully');
                                                                        fetchVendorBookings(); // Refresh bookings
                                                                    } else {
                                                                        const errorData = await response.json();
                                                                        toast.error(errorData.message || 'Failed to reject booking');
                                                                    }
                                                                } catch (error) {
                                                                    toast.error('Network error. Please try again.');
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            style={{
                                                                padding: '10px 20px',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            <i className="fas fa-times" style={{ marginRight: '6px' }}></i>
                                                            Reject
                                                        </button>
                                                        <button
                                                            className="btn primary-btn"
                                                            onClick={async () => {
                                                                try {
                                                                    setLoading(true);
                                                                    const response = await fetch(`http://localhost:5001/api/bookings/${booking._id}/approve`, {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({
                                                                            status: 'approved',
                                                                            vendorNotes: 'Booking approved by vendor'
                                                                        })
                                                                    });
                                                                    if (response.ok) {
                                                                        toast.success('Booking approved successfully');
                                                                        fetchVendorBookings(); // Refresh bookings
                                                                    } else {
                                                                        const errorData = await response.json();
                                                                        toast.error(errorData.message || 'Failed to approve booking');
                                                                    }
                                                                } catch (error) {
                                                                    toast.error('Network error. Please try again.');
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            style={{
                                                                padding: '10px 20px',
                                                                fontSize: '0.9rem',
                                                                fontWeight: '500'
                                                            }}
                                                        >
                                                            <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                                                            Accept
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Status Display for Non-Pending Bookings */}
                                                {booking.status !== 'pending' && (
                                                    <div style={{
                                                        display: 'flex',
                                                        gap: '12px',
                                                        marginTop: '16px',
                                                        justifyContent: 'flex-end'
                                                    }}>
                                                        <div style={{
                                                            padding: '10px 20px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '500',
                                                            borderRadius: '6px',
                                                            backgroundColor: booking.status === 'approved' ? '#e8f5e8' : 
                                                                         booking.status === 'rejected' ? '#ffebee' :
                                                                         booking.status === 'payment_pending_verification' ? '#fff3cd' :
                                                                         booking.status === 'advance_paid' ? '#e3f2fd' :
                                                                         booking.status === 'payment_failed' ? '#ffebee' :
                                                                         booking.status === 'completed' ? '#f3e5f5' : '#f5f5f5',
                                                            color: booking.status === 'approved' ? '#2e7d32' :
                                                                  booking.status === 'rejected' ? '#c62828' :
                                                                  booking.status === 'payment_pending_verification' ? '#856404' :
                                                                  booking.status === 'advance_paid' ? '#1565c0' :
                                                                  booking.status === 'payment_failed' ? '#c62828' :
                                                                  booking.status === 'completed' ? '#7b1fa2' : '#666',
                                                            border: `1px solid ${booking.status === 'approved' ? '#4caf50' :
                                                                      booking.status === 'rejected' ? '#f44336' :
                                                                      booking.status === 'payment_pending_verification' ? '#ffc107' :
                                                                      booking.status === 'advance_paid' ? '#2196f3' :
                                                                      booking.status === 'payment_failed' ? '#f44336' :
                                                                      booking.status === 'completed' ? '#9c27b0' : '#ddd'}`
                                                        }}>
                                                            <i className={`fas fa-${booking.status === 'approved' ? 'check' :
                                                                          booking.status === 'rejected' ? 'times' :
                                                                          booking.status === 'payment_pending_verification' ? 'clock' :
                                                                          booking.status === 'advance_paid' ? 'credit-card' :
                                                                          booking.status === 'payment_failed' ? 'times-circle' :
                                                                          booking.status === 'completed' ? 'star' : 'info'}`} 
                                                                style={{ marginRight: '6px' }}></i>
                                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '40px 20px',
                                    color: '#666'
                                }}>
                                    <i className="fas fa-calendar-check" style={{ fontSize: '3rem', marginBottom: '20px', opacity: 0.3 }}></i>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>No bookings yet</h4>
                                    <p style={{ margin: '0' }}>Customer bookings will appear here once they book your services.</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {vendorTab === 'block' && (
                    <section className="dashboard-section active" style={{ marginLeft: '5%', marginRight: '5%' }}>
                        <div className="section-header">
                            <h2>Block Services</h2>
                            <p style={{ color: '#666', marginTop: '10px' }}>
                                Select dates and services to block or unblock their availability. Blocked services will not be available for booking on those dates.
                            </p>
                        </div>
                        <BlockServicesSection
                            vendor={vendor}
                            myServices={myServices}
                            fetchVendorServices={fetchVendorServices}
                        />
                    </section>
                )}
            </div>

            {isModalOpen && selectedService && (
                <ServiceDetailsModal
                    service={selectedService}
                    onClose={closeServiceModal}
                    onAddToCart={handleAddToCart}
                />
            )}
        </div>
    );
}

function BlockServicesSection({ vendor, myServices, fetchVendorServices }) {
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [blockedMap, setBlockedMap] = useState({});
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const today = new Date();
        return { year: today.getFullYear(), month: today.getMonth() };
    });
    const [hoveredDate, setHoveredDate] = useState(null);

    useEffect(() => {
        const map = {};
        myServices.forEach(s => {
            map[s._id] = s.blockedDates || [];
        });
        setBlockedMap(map);
    }, [myServices]);

    // --- Custom Calendar Logic with Month Navigation ---
    const { year, month } = calendarMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();

    const getDateKey = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const isSelected = (d) => selectedDates.includes(getDateKey(d));
    const handleDateClick = (d) => {
        const key = getDateKey(d);
        setSelectedDates(prev =>
            prev.includes(key) ? prev.filter(date => date !== key) : [...prev, key]
        );
    };
    const handlePrevMonth = () => {
        setCalendarMonth(prev => {
            const newMonth = prev.month - 1;
            if (newMonth < 0) return { year: prev.year - 1, month: 11 };
            return { year: prev.year, month: newMonth };
        });
    };
    const handleNextMonth = () => {
        setCalendarMonth(prev => {
            const newMonth = prev.month + 1;
            if (newMonth > 11) return { year: prev.year + 1, month: 0 };
            return { year: prev.year, month: newMonth };
        });
    };
    // --- End Custom Calendar Logic ---

    // Helper: Get blocked services for a date
    const getBlockedServicesForDate = (dateKey) => {
        return myServices.filter(s => (s.blockedDates || []).includes(dateKey));
    };
    // Helper: Get bookings for a date
    const getBookingsForDate = (dateKey) => {
        let bookings = [];
        myServices.forEach(s => {
            if (s.bookings) {
                s.bookings.forEach(b => {
                    if (b.bookedForDate === dateKey && b.status !== 'cancelled') {
                        bookings.push({ service: s, booking: b });
                    }
                });
            }
        });
        return bookings;
    };

    const handleServiceToggle = (serviceId) => {
        setSelectedServiceIds(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const blockServices = async () => {
        if (selectedServiceIds.length === 0 || selectedDates.length === 0) {
            toast.error('Select at least one service and one date.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/services/bulk-block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceIds: selectedServiceIds, dates: selectedDates })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Blocked selected services for chosen dates.');
                setSelectedDates([]); setSelectedServiceIds([]);
                fetchVendorServices();
            } else {
                toast.error(data.message || 'Failed to block services.');
            }
        } catch (e) {
            toast.error('Failed to block services.');
        } finally {
            setLoading(false);
        }
    };

    const unblockServiceDate = async (serviceId, date) => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/services/bulk-unblock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceIds: [serviceId], dates: [date] })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Unblocked service for date.');
                fetchVendorServices();
            } else {
                toast.error(data.message || 'Failed to unblock.');
            }
        } catch (e) {
            toast.error('Failed to unblock.');
        } finally {
            setLoading(false);
        }
    };

    // --- Layout ---
    return (
        <div className="block-section-outer">
            <ToastContainer position="top-center" autoClose={2500} />
            <div className="block-section-layout">
                <div className="block-calendar-container">
                    <h3>Select Dates</h3>
                    <div className="custom-calendar">
                        <div className="calendar-header">
                            <button className="calendar-nav-btn" onClick={handlePrevMonth}>&lt;</button>
                            <span>{new Date(year, month).toLocaleString('default', { month: 'long' })} {year}</span>
                            <button className="calendar-nav-btn" onClick={handleNextMonth}>&gt;</button>
                        </div>
                        <div className="calendar-grid">
                            {weekDays.map((d, i) => (
                                <div key={i} className="calendar-weekday">{d}</div>
                            ))}
                            {Array(firstDay).fill(null).map((_, i) => (
                                <div key={'empty-' + i} className="calendar-empty"></div>
                            ))}
                            {Array(daysInMonth).fill(null).map((_, i) => {
                                const dateObj = new Date(year, month, i + 1);
                                const key = getDateKey(dateObj);
                                const blockedServices = getBlockedServicesForDate(key);
                                const bookings = getBookingsForDate(key);
                                let dayClass = 'calendar-day';
                                if (blockedServices.length > 0 && bookings.length > 0) {
                                    dayClass += ' calendar-day-blocked-booked'; // purple
                                } else if (blockedServices.length > 0) {
                                    dayClass += ' calendar-day-blocked'; // red
                                } else if (bookings.length > 0) {
                                    dayClass += ' calendar-day-booked'; // green
                                }
                                if (isSelected(dateObj)) dayClass += ' selected';
                                if (dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())) dayClass += ' calendar-day-disabled';
                                return (
                                    <div
                                        key={key}
                                        className={dayClass}
                                        onClick={() => dateObj >= new Date(today.getFullYear(), today.getMonth(), today.getDate()) && handleDateClick(dateObj)}
                                        onMouseEnter={() => setHoveredDate(key)}
                                        onMouseLeave={() => setHoveredDate(null)}
                                        style={{ position: 'relative' }}
                                    >
                                        <span>{i + 1}</span>
                                        {hoveredDate === key && (blockedServices.length > 0 || bookings.length > 0) && (
                                            <div className="calendar-tooltip">
                                                {blockedServices.length > 0 && (
                                                    <div><b>Blocked Services:</b>
                                                        <ol style={{ margin: 0, paddingLeft: 16 }}>
                                                            {blockedServices.map(s => <li key={s._id}>{s.name}</li>)}
                                                        </ol>

                                                    </div>
                                                )}
                                                {bookings.length > 0 && (
                                                    <div><b>Bookings:</b>
                                                        <ol style={{ margin: 0, paddingLeft: 16 }}>
                                                            {bookings.map(({ service, booking }, idx) => (
                                                                <li key={idx}>{service.name}</li>

                                                            ))}
                                                        </ol>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="calendar-selected-info">
                        {selectedDates.length > 0 ? `Selected: ${selectedDates.join(', ')}` : 'No dates selected.'}
                    </div>
                </div>
                <div className="block-services-container">
                    <h3>Select Services</h3>
                    <div className="block-services-list">
                        {myServices.length === 0 ? <div>No services found.</div> : myServices.map(service => (
                            <label key={service._id} className="block-service-label">
                                <input
                                    type="checkbox"
                                    checked={selectedServiceIds.includes(service._id)}
                                    onChange={() => handleServiceToggle(service._id)}
                                />
                                {service.name} <span className="block-service-category">({service.category})</span>
                            </label>
                        ))}
                    </div>
                    <button
                        className="btn primary-btn"
                        onClick={blockServices}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : 'Block Selected'}
                    </button>
                    {/* {error && <div className="block-error">{error}</div>} */}
                    {/* {success && <div className="block-success">{success}</div>} */}
                </div>
            </div>
            <div className="block-list-container">
                <h3>Blocked Services/Dates</h3>
                <div className="block-list">
                    {myServices.length === 0 ? <div>No services found.</div> : myServices.map(service => (
                        <div key={service._id} className="block-list-service">
                            <div className="block-list-service-name">{service.name}</div>
                            <ul className="block-list-dates">
                                {(blockedMap[service._id] || []).length === 0 ? (
                                    <li className="block-list-no-dates">No blocked dates.</li>
                                ) : (
                                    blockedMap[service._id].map(date => (
                                        <li key={date} className="block-list-date-item">
                                            <span>{date}</span>
                                            <button
                                                className="btn secondary-btn block-unblock-btn"
                                                onClick={() => unblockServiceDate(service._id, date)}
                                                disabled={loading}
                                            >
                                                Unblock
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 