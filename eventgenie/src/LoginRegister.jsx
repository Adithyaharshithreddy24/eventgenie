import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

function LoginRegister({ login, register, isLoggedIn, isVendorLoggedIn }) {
    const [activeTab, setActiveTab] = useState('login');
    const [userType, setUserType] = useState('customer');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [regData, setRegData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        username: '',
        password: '',
        confirmPassword: '',
        photo: '',
    });
    const [vendorData, setVendorData] = useState({
        name: '',
        businessName: '',
        email: '',
        phone: '',
        about: '',
        services: [],
        username: '',
        password: '',
        confirmPassword: '',
        photo: '',
        upiId: '',
    });
    const [regError, setRegError] = useState('');
    const [vendorSuccess, setVendorSuccess] = useState('');
    const [usernameStatus, setUsernameStatus] = useState({ available: null, message: '' });
    const [vendorUsernameStatus, setVendorUsernameStatus] = useState({ available: null, message: '' });
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [vendorUsernameChecking, setVendorUsernameChecking] = useState(false);
    const navigate = useNavigate();

    // Handle navigation after login/registration
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/profile');
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        if (isVendorLoggedIn) {
            navigate('/vendor-dashboard');
        }
    }, [isVendorLoggedIn, navigate]);

    // Check username availability for customers
    useEffect(() => {
        const checkUsername = async () => {
            if (regData.username.length >= 3) {
                setUsernameChecking(true);
                try {
                    const response = await fetch(`http://localhost:5001/api/customers/check-username/${regData.username}`);
                    const data = await response.json();
                    setUsernameStatus(data);
                } catch (error) {
                    console.error('Error checking username:', error);
                } finally {
                    setUsernameChecking(false);
                }
            } else {
                setUsernameStatus({ available: null, message: '' });
                setUsernameChecking(false);
            }
        };

        const timeoutId = setTimeout(checkUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [regData.username]);

    // Check username availability for vendors
    useEffect(() => {
        const checkVendorUsername = async () => {
            if (vendorData.username.length >= 3) {
                setVendorUsernameChecking(true);
                try {
                    const response = await fetch(`http://localhost:5001/api/vendors/check-username/${vendorData.username}`);
                    const data = await response.json();
                    setVendorUsernameStatus(data);
                } catch (error) {
                    console.error('Error checking vendor username:', error);
                } finally {
                    setVendorUsernameChecking(false);
                }
            } else {
                setVendorUsernameStatus({ available: null, message: '' });
                setVendorUsernameChecking(false);
            }
        };

        const timeoutId = setTimeout(checkVendorUsername, 500);
        return () => clearTimeout(timeoutId);
    }, [vendorData.username]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (userType === 'customer') {
            const result = login(username, password, 'customer');
            if (result === 'customer') {
                setError('');
                navigate('/profile');
            } else {
                setError('Invalid username or password');
            }
        } else if (userType === 'vendor') {
            const result = login(username, password, 'vendor');
            if (result === 'vendor') {
                setError('');
                navigate('/vendor-dashboard');
            } else {
                setError('Invalid vendor username or password');
            }
        } else if (userType === 'admin') {
            // Handle admin login
            handleAdminLogin(username, password);
        }
    };

    const handleCustomerRegister = async (e) => {
        e.preventDefault();
        console.log('Customer registration form data:', regData);

        if (!regData.name || !regData.email || !regData.phone || !regData.address || !regData.username || !regData.password || !regData.confirmPassword) {
            setRegError('Please fill all fields');
            return;
        }
        if (regData.password !== regData.confirmPassword) {
            setRegError('Passwords do not match');
            return;
        }
        if (usernameStatus.available === false) {
            setRegError('Username is not available');
            return;
        }

        try {
            const success = await register(regData, 'customer');
            if (success) {
                setRegError('');
                navigate('/profile');
            } else {
                setRegError('Registration failed. Please try again.');
            }
        } catch (error) {
            setRegError('Registration failed. Please try again.');
        }
    };

    const handleVendorRegister = async (e) => {
        e.preventDefault();
        console.log('Vendor registration form data:', vendorData);

        if (!vendorData.name || !vendorData.businessName || !vendorData.email || !vendorData.phone || !vendorData.about || !vendorData.username || !vendorData.password || !vendorData.confirmPassword) {
            setVendorSuccess('');
            setRegError('Please fill all fields');
            return;
        }
        if (vendorData.password !== vendorData.confirmPassword) {
            setVendorSuccess('');
            setRegError('Passwords do not match');
            return;
        }
        if (vendorUsernameStatus.available === false) {
            setVendorSuccess('');
            setRegError('Username is not available');
            return;
        }

        setRegError('');
        try {
            const success = await register(vendorData, 'vendor');
            if (success) {
                setVendorSuccess('Vendor registration successful! Please wait for admin approval before you can log in.');
                // Don't redirect, let them stay on the page
            } else {
                setVendorSuccess('');
                setRegError('Registration failed. Please try again.');
            }
        } catch (error) {
            setVendorSuccess('');
            setRegError('Registration failed. Please try again.');
        }
    };

    const handleAdminLogin = async (username, password) => {
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
                localStorage.setItem('adminSession', JSON.stringify(data.admin));
                setError('');
                navigate('/admin');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Invalid admin credentials');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        }
    };

    if (isLoggedIn) {
        navigate('/profile');
        return null;
    }
    if (isVendorLoggedIn) {
        navigate('/vendor-dashboard');
        return null;
    }

    return (
        <section id="login" className="page active">
            <div className="container">
                <div className="auth-container">
                    <div className="auth-tabs">
                        <button className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Login</button>
                        <button className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Register</button>
                    </div>
                    {activeTab === 'login' && (
                        <div id="login-form" className="auth-form active">
                            <h2>Login to Your Account</h2>
                            <div className="user-type-selection">
                                <button className={`user-type-btn ${userType === 'customer' ? 'active' : ''}`} onClick={() => setUserType('customer')}>Customer</button>
                                <button className={`user-type-btn ${userType === 'vendor' ? 'active' : ''}`} onClick={() => setUserType('vendor')}>Vendor</button>
                                <button className={`user-type-btn ${userType === 'admin' ? 'active' : ''}`} onClick={() => setUserType('admin')}>Admin</button>
                            </div>
                            <form id="login-form-element" onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label htmlFor="login-username">Username</label>
                                    <input type="text" id="login-username" value={username} onChange={e => setUsername(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="login-password">Password</label>
                                    <input type="password" id="login-password" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                                {error && <p style={{ color: 'red' }}>{error}</p>}
                                <button type="submit" className="btn primary-btn">Login</button>
                            </form>
                        </div>
                    )}
                    {activeTab === 'register' && (
                        <div id="register-form" className="auth-form active">
                            <h2>Create an Account</h2>
                            <div className="user-type-selection">
                                <button className={`user-type-btn ${userType === 'customer' ? 'active' : ''}`} onClick={() => setUserType('customer')}>Customer</button>
                                <button className={`user-type-btn ${userType === 'vendor' ? 'active' : ''}`} onClick={() => setUserType('vendor')}>Vendor</button>
                                <button className={`user-type-btn ${userType === 'admin' ? 'active' : ''}`} onClick={() => setUserType('admin')}>Admin</button>
                            </div>
                            {/* Customer Registration Form */}
                            <form id="customer-register-form" className={`register-form${userType === 'customer' ? ' active' : ''}`} onSubmit={handleCustomerRegister} style={{ display: userType === 'customer' ? 'block' : 'none' }}>
                                <div className="form-group">
                                    <label htmlFor="customer-name">Full Name</label>
                                    <input type="text" id="customer-name" value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-email">Email</label>
                                    <input type="email" id="customer-email" value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-phone">Phone Number</label>
                                    <input type="tel" id="customer-phone" value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-address">Address</label>
                                    <textarea id="customer-address" value={regData.address} onChange={e => setRegData({ ...regData, address: e.target.value })} required></textarea>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-username">Username</label>
                                    <input
                                        type="text"
                                        id="customer-username"
                                        value={regData.username}
                                        onChange={e => setRegData({ ...regData, username: e.target.value })}
                                        required
                                    />
                                    {usernameStatus.available !== null && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '0.9rem',
                                            color: usernameStatus.available ? '#28a745' : '#dc3545'
                                        }}>
                                            <i className={`fas fa-${usernameStatus.available ? 'check' : 'times'}`}></i>
                                            {usernameStatus.message}
                                        </div>
                                    )}
                                    {usernameChecking && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '0.9rem',
                                            color: '#007bff'
                                        }}>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Checking username availability...
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-password">Password</label>
                                    <input type="password" id="customer-password" value={regData.password} onChange={e => setRegData({ ...regData, password: e.target.value })} required />
                                    <div className="password-strength-meter">
                                        <div className="strength-bar"></div>
                                    </div>
                                    <p className="password-hint">Password must include uppercase, lowercase, number, and be at least 8 characters long.</p>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customer-confirm-password">Confirm Password</label>
                                    <input type="password" id="customer-confirm-password" value={regData.confirmPassword} onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-photo">Profile Photo URL (optional)</label>
                                    <input type="url" id="reg-photo" value={regData.photo} onChange={e => setRegData({ ...regData, photo: e.target.value })} />
                                </div>
                                {regError && <p style={{ color: 'red' }}>{regError}</p>}
                                <button type="submit" className="btn primary-btn">Register as Customer</button>
                            </form>
                            {/* Vendor Registration Form */}
                            <form id="vendor-register-form" className={`register-form${userType === 'vendor' ? ' active' : ''}`} onSubmit={handleVendorRegister} style={{ display: userType === 'vendor' ? 'block' : 'none' }}>
                                <div className="form-group">
                                    <label htmlFor="vendor-name">Full Name</label>
                                    <input type="text" id="vendor-name" value={vendorData.name} onChange={e => setVendorData({ ...vendorData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="business-name">Business/Company Name</label>
                                    <input type="text" id="business-name" value={vendorData.businessName} onChange={e => setVendorData({ ...vendorData, businessName: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-email">Email</label>
                                    <input type="email" id="vendor-email" value={vendorData.email} onChange={e => setVendorData({ ...vendorData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-phone">Phone Number</label>
                                    <input type="tel" id="vendor-phone" value={vendorData.phone} onChange={e => setVendorData({ ...vendorData, phone: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="about-business">About Your Business</label>
                                    <textarea id="about-business" value={vendorData.about} onChange={e => setVendorData({ ...vendorData, about: e.target.value })} required></textarea>
                                </div>
                                <div className="form-group">
                                    <label>Services Provided</label>
                                    <div className="checkbox-group">
                                        <label className="checkbox-label">
                                            <input type="checkbox" name="service-type" value="venue" checked={vendorData.services.includes('venue')} onChange={e => {
                                                const checked = e.target.checked;
                                                setVendorData(prev => ({
                                                    ...prev,
                                                    services: checked ? [...prev.services, 'venue'] : prev.services.filter(s => s !== 'venue')
                                                }));
                                            }} /> Venue
                                        </label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" name="service-type" value="catering" checked={vendorData.services.includes('catering')} onChange={e => {
                                                const checked = e.target.checked;
                                                setVendorData(prev => ({
                                                    ...prev,
                                                    services: checked ? [...prev.services, 'catering'] : prev.services.filter(s => s !== 'catering')
                                                }));
                                            }} /> Catering
                                        </label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" name="service-type" value="decor" checked={vendorData.services.includes('decor')} onChange={e => {
                                                const checked = e.target.checked;
                                                setVendorData(prev => ({
                                                    ...prev,
                                                    services: checked ? [...prev.services, 'decor'] : prev.services.filter(s => s !== 'decor')
                                                }));
                                            }} /> Decor
                                        </label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" name="service-type" value="entertainment" checked={vendorData.services.includes('entertainment')} onChange={e => {
                                                const checked = e.target.checked;
                                                setVendorData(prev => ({
                                                    ...prev,
                                                    services: checked ? [...prev.services, 'entertainment'] : prev.services.filter(s => s !== 'entertainment')
                                                }));
                                            }} /> Entertainment
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-username">Username</label>
                                    <input
                                        type="text"
                                        id="vendor-username"
                                        value={vendorData.username}
                                        onChange={e => setVendorData({ ...vendorData, username: e.target.value })}
                                        required
                                    />
                                    {vendorUsernameStatus.available !== null && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '0.9rem',
                                            color: vendorUsernameStatus.available ? '#28a745' : '#dc3545'
                                        }}>
                                            <i className={`fas fa-${vendorUsernameStatus.available ? 'check' : 'times'}`}></i>
                                            {vendorUsernameStatus.message}
                                        </div>
                                    )}
                                    {vendorUsernameChecking && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '0.9rem',
                                            color: '#007bff'
                                        }}>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Checking username availability...
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-password">Password</label>
                                    <input type="password" id="vendor-password" value={vendorData.password} onChange={e => setVendorData({ ...vendorData, password: e.target.value })} required />
                                    <div className="password-strength-meter">
                                        <div className="strength-bar"></div>
                                    </div>
                                    <p className="password-hint">Password must include uppercase, lowercase, number, and be at least 8 characters long.</p>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-confirm-password">Confirm Password</label>
                                    <input type="password" id="vendor-confirm-password" value={vendorData.confirmPassword} onChange={e => setVendorData({ ...vendorData, confirmPassword: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="vendor-photo">Profile Photo URL (optional)</label>
                                    <input type="url" id="vendor-photo" value={vendorData.photo} onChange={e => setVendorData({ ...vendorData, photo: e.target.value })} />
                                </div>
                                                                                                 <div className="form-group">
                                     <label htmlFor="upi-id">UPI ID (optional)</label>
                                     <input
                                         type="text"
                                         id="upi-id"
                                         value={vendorData.upiId}
                                         onChange={e => setVendorData({ ...vendorData, upiId: e.target.value })}
                                         placeholder="yourname@bank"
                                     />
                                     <small style={{ color: '#666', fontSize: '0.9rem' }}>
                                         Optional: Provide your UPI ID for receiving payments (e.g., vendor@hdfc). You can add this later in your profile.
                                     </small>
                                 </div>
                                <div className="vendor-note">
                                                                         <p>After registration, please wait for admin approval before you can access the vendor dashboard. You can add your UPI ID later in your profile settings.</p>
                                </div>
                                {regError && <p style={{ color: 'red' }}>{regError}</p>}
                                {vendorSuccess && <p style={{ color: 'green' }}>{vendorSuccess}</p>}
                                <button type="submit" className="btn primary-btn">Register as Vendor</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default LoginRegister;