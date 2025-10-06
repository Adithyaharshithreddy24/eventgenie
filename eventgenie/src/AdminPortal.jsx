import { useState, useEffect } from 'react';
import AdminDetailModal from './AdminDetailModal';
import './admin-portal.css';

function AdminPortal() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [admin, setAdmin] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [pendingVendors, setPendingVendors] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalEntityType, setModalEntityType] = useState('');
    const [modalEntityId, setModalEntityId] = useState('');
    const [modalEntityData, setModalEntityData] = useState(null);

    // Check if admin is already logged in
    useEffect(() => {
        const adminSession = localStorage.getItem('adminSession');
        if (adminSession) {
            try {
                const adminData = JSON.parse(adminSession);
                setAdmin(adminData);
                setIsLoggedIn(true);
                fetchAllData();
            } catch (error) {
                localStorage.removeItem('adminSession');
            }
        }
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('http://localhost:5001/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setAdmin(data.admin);
                setIsLoggedIn(true);
                localStorage.setItem('adminSession', JSON.stringify(data.admin));
                fetchAllData();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setAdmin(null);
        setIsLoggedIn(false);
        setVendors([]);
        setPendingVendors([]);
        setCustomers([]);
        setServices([]);
        setBookings([]);
        localStorage.removeItem('adminSession');
    };

    const fetchAllData = async () => {
        try {
            const [vendorsResponse, pendingVendorsResponse, customersResponse, servicesResponse, bookingsResponse] = await Promise.all([
                fetch('http://localhost:5001/api/admin/vendors'),
                fetch('http://localhost:5001/api/admin/vendors/pending'),
                fetch('http://localhost:5001/api/admin/customers'),
                fetch('http://localhost:5001/api/admin/services'),
                fetch('http://localhost:5001/api/admin/bookings')
            ]);

            if (vendorsResponse.ok) {
                const allVendors = await vendorsResponse.json();
                setVendors(allVendors);
            }

            if (pendingVendorsResponse.ok) {
                const pending = await pendingVendorsResponse.json();
                setPendingVendors(pending);
            }

            if (customersResponse.ok) {
                const allCustomers = await customersResponse.json();
                setCustomers(allCustomers);
            }

            if (servicesResponse.ok) {
                const allServices = await servicesResponse.json();
                setServices(allServices);
            }

            if (bookingsResponse.ok) {
                const allBookings = await bookingsResponse.json();
                setBookings(allBookings);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const approveVendor = async (vendorId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/vendors/${vendorId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                await fetchAllData();
                alert('Vendor approved successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            alert('Error approving vendor. Please try again.');
        }
    };

    const rejectVendor = async (vendorId) => {
        if (!confirm('Are you sure you want to reject this vendor? They will not be able to access the system.')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5001/api/admin/vendors/${vendorId}/reject`, {
                method: 'PUT',
            });

            if (response.ok) {
                await fetchAllData();
                alert('Vendor rejected successfully!');
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
            }
        } catch (error) {
            alert('Error rejecting vendor. Please try again.');
        }
    };

    const openDetailModal = (entityType, entityId, entityData = null) => {
        setModalEntityType(entityType);
        setModalEntityId(entityId);
        setModalEntityData(entityData);
        setModalOpen(true);
    };

    const closeDetailModal = () => {
        setModalOpen(false);
        setModalEntityType('');
        setModalEntityId('');
        setModalEntityData(null);
    };

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');
        login(username, password);
    };

    if (!isLoggedIn) {
        return (
           console.log()
        );}
    return (
        <div className="admin-portal-container">
            

            {/* Dashboard Summary */}
            <div className="dashboard-summary">
                <div className="summary-card">
                    <h3>Total Vendors</h3>
                    <div className="number">{vendors.length}</div>
                    <div className="trend">
                        {pendingVendors.length} pending approval
                    </div>
                </div>
                <div className="summary-card">
                    <h3>Total Customers</h3>
                    <div className="number">{customers.length}</div>
                    <div className="trend">Registered users</div>
                </div>
                <div className="summary-card">
                    <h3>Total Services</h3>
                    <div className="number">{services.length}</div>
                    <div className="trend">Available services</div>
                </div>
                <div className="summary-card">
                    <h3>Total Bookings</h3>
                    <div className="number">{bookings.length}</div>
                    <div className="trend">All time bookings</div>
                </div>
            </div>

            <div className="admin-tabs">
                <button 
                    className={activeTab === 'pending' ? 'active' : ''} 
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Approvals ({pendingVendors.length})
                </button>
                <button 
                    className={activeTab === 'vendors' ? 'active' : ''} 
                    onClick={() => setActiveTab('vendors')}
                >
                    All Vendors ({vendors.length})
                </button>
                <button 
                    className={activeTab === 'customers' ? 'active' : ''} 
                    onClick={() => setActiveTab('customers')}
                >
                    All Customers ({customers.length})
                </button>
                <button 
                    className={activeTab === 'services' ? 'active' : ''} 
                    onClick={() => setActiveTab('services')}
                >
                    All Services ({services.length})
                </button>
                <button 
                    className={activeTab === 'bookings' ? 'active' : ''} 
                    onClick={() => setActiveTab('bookings')}
                >
                    All Bookings ({bookings.length})
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'pending' && (
                    <div className="pending-vendors">
                        <h2>Pending Vendor Approvals</h2>
                        {pendingVendors.length === 0 ? (
                            <p className="no-vendors">No pending vendors to approve.</p>
                        ) : (
                            <div className="vendors-grid">
                                {pendingVendors.map((vendor) => (
                                    <div key={vendor._id} className="vendor-card pending">
                                        <div className="vendor-header">
                                            <h3>{vendor.businessName}</h3>
                                            <span className="status pending">Pending</span>
                                        </div>
                                        <div className="vendor-details">
                                            <p><strong>Owner:</strong> {vendor.name}</p>
                                            <p><strong>Username:</strong> {vendor.username}</p>
                                            <p><strong>Email:</strong> {vendor.email}</p>
                                            <p><strong>Phone:</strong> {vendor.phone}</p>
                                            {vendor.about && <p><strong>About:</strong> {vendor.about}</p>}
                                            {vendor.categories && vendor.categories.length > 0 && (
                                                <p><strong>Services:</strong> {vendor.categories.join(', ')}</p>
                                            )}
                                            <p><strong>Registered:</strong> {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="vendor-actions">
                                            <button 
                                                onClick={() => approveVendor(vendor._id)}
                                                className="approve-btn"
                                            >
                                                ✅ Approve
                                            </button>
                                            <button 
                                                onClick={() => rejectVendor(vendor._id)}
                                                className="reject-btn"
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'vendors' && (
                    <div className="all-vendors">
                        <h2>All Vendors</h2>
                        {vendors.length === 0 ? (
                            <p className="no-vendors">No vendors found.</p>
                        ) : (
                            <div className="vendors-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Business Name</th>
                                            <th>Owner</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Registered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendors.map((vendor) => (
                                            <tr key={vendor._id} className="clickable-row" onClick={() => openDetailModal('vendors', vendor._id)}>
                                                <td>{vendor.businessName}</td>
                                                <td>{vendor.name}</td>
                                                <td>{vendor.username}</td>
                                                <td>{vendor.email}</td>
                                                <td>{vendor.phone}</td>
                                                <td>
                                                    <span className={`status ${vendor.status}`}>
                                                        {vendor.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {vendor.status === 'pending' && (
                                                        <div className="action-buttons">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); approveVendor(vendor._id); }}
                                                                className="approve-btn small"
                                                            >
                                                                ✅
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); rejectVendor(vendor._id); }}
                                                                className="reject-btn small"
                                                            >
                                                                ❌
                                                            </button>
                                                        </div>
                                                    )}
                                                    {vendor.status === 'accepted' && (
                                                        <span className="approved-text">Approved</span>
                                                    )}
                                                    {vendor.status === 'rejected' && (
                                                        <span className="rejected-text">Rejected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'customers' && (
                    <div className="all-customers">
                        <h2>All Customers</h2>
                        {customers.length === 0 ? (
                            <p className="no-vendors">No customers found.</p>
                        ) : (
                            <div className="vendors-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Address</th>
                                            <th>Member Since</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map((customer) => (
                                            <tr key={customer._id} className="clickable-row" onClick={() => openDetailModal('customers', customer._id)}>
                                                <td>{customer.name}</td>
                                                <td>{customer.username}</td>
                                                <td>{customer.email}</td>
                                                <td>{customer.phone}</td>
                                                <td>{customer.address}</td>
                                                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="view-text">Click to view details</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="all-services">
                        <h2>All Services</h2>
                        {services.length === 0 ? (
                            <p className="no-vendors">No services found.</p>
                        ) : (
                            <div className="vendors-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Service Name</th>
                                            <th>Provider</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Vendor</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map((service) => (
                                            <tr key={service._id} className="clickable-row" onClick={() => openDetailModal('services', service._id)}>
                                                <td>{service.name}</td>
                                                <td>{service.provider}</td>
                                                <td>{service.category}</td>
                                                <td>₹{service.price}</td>
                                                <td>{service.vendorUsername?.businessName || service.vendorUsername?.name || 'Unknown'}</td>
                                                <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <span className="view-text">Click to view details</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="all-bookings">
                        <h2>All Bookings</h2>
                        {bookings.length === 0 ? (
                            <p className="no-vendors">No bookings found.</p>
                        ) : (
                            <div className="vendors-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Category</th>
                                            <th>Vendor</th>
                                            <th>Customer</th>
                                            <th>Booked For</th>
                                            <th>Booked On</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking.id} className="clickable-row" onClick={() => openDetailModal('bookings', booking.id, booking)}>
                                                <td>{booking.serviceName}</td>
                                                <td>{booking.serviceCategory}</td>
                                                <td>{booking.vendorBusinessName}</td>
                                                <td>{booking.customerName}</td>
                                                <td>{new Date(booking.bookedForDate).toLocaleDateString()}</td>
                                                <td>{new Date(booking.dateBooked).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status ${booking.status}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td>₹{booking.totalAmount}</td>
                                                <td>
                                                    <span className="view-text">Click to view details</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <AdminDetailModal
                isOpen={modalOpen}
                onClose={closeDetailModal}
                entityType={modalEntityType}
                entityId={modalEntityId}
                entityData={modalEntityData}
            />
        </div>
    );
}

export default AdminPortal; 