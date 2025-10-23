import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Services from './Services.jsx';
import Home from './Home.jsx';
import BudgetCalculator from './BudgetCalculator.jsx';
import LoginRegister from './LoginRegister.jsx';
import Profile from './Profile.jsx';
import MyCart from './MyCart.jsx';
import VendorDashboard from './VendorDashboard.jsx';
import AdminPortal from './AdminPortal.jsx';
import NotificationSidebar from './NotificationSidebar.jsx';
import HelpSupport from './HelpSupport.jsx';
import Recommendations from './Recommendations.jsx';
import { toast } from 'react-toastify';

function App() {
  const [servicesList, setServicesList] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Authentication state
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [vendorTab, setVendorTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [notificationSidebarOpen, setNotificationSidebarOpen] = useState(false);
  const isLoggedIn = !!currentCustomer;
  const isVendorLoggedIn = !!currentVendor;

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = () => {
      const customerSession = localStorage.getItem('customerSession');
      const vendorSession = localStorage.getItem('vendorSession');
      const cartSession = localStorage.getItem('cartSession');

      if (customerSession) {
        try {
          setCurrentCustomer(JSON.parse(customerSession));
        } catch (error) {
          localStorage.removeItem('customerSession');
        }
      }

      if (vendorSession) {
        try {
          setCurrentVendor(JSON.parse(vendorSession));
        } catch (error) {
          localStorage.removeItem('vendorSession');
        }
      }

      // Load cart from localStorage
      if (cartSession) {
        try {
          setSelectedServices(JSON.parse(cartSession));
        } catch (error) {
          localStorage.removeItem('cartSession');
        }
      }

      setLoading(false);
    };

    checkSession();
  }, []);

  // Fetch services from backend
  useEffect(() => {
    fetch('http://localhost:5001/api/services')
      .then(res => res.json())
      .then(data => setServicesList(data))
      .catch(err => console.error('Error fetching services:', err));
  }, []);

  // Login handler with API integration
  const login = async (username, password, type = 'customer') => {
    try {
      const endpoint = type === 'customer' ? '/api/customers/login' : '/api/vendors/login';
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (type === 'customer') {
          setCurrentCustomer(data.customer);
          localStorage.setItem('customerSession', JSON.stringify(data.customer));
          setCurrentVendor(null);
          localStorage.removeItem('vendorSession');
          return 'customer';
        } else {
          setCurrentVendor(data.vendor);
          localStorage.setItem('vendorSession', JSON.stringify(data.vendor));
          setCurrentCustomer(null);
          localStorage.removeItem('customerSession');
          return 'vendor';
        }
      } else {
        const errorData = await response.json();
        console.error('Login error:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Register handler with API integration
  const register = async (user, type = 'customer') => {
    try {
      console.log('Registration started for:', type);
      console.log('User data:', user);

      const endpoint = type === 'customer' ? '/api/customers/register' : '/api/vendors/register';

      // Prepare data for API
      const userData = type === 'customer' ? {
        username: user.username,
        password: user.password,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profilePhoto: user.photo || ''
      } : {
        username: user.username,
        password: user.password,
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        phone: user.phone,
        about: user.about,
        categories: user.services || [],
        profilePhoto: user.photo || '',
        upiId: user.upiId || '', // Optional field
        cinNumber: user.cinNumber || '' // CIN Number field
      };

      console.log('Prepared user data:', userData);

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);

        if (type === 'customer') {
          setCurrentCustomer(data.customer);
          localStorage.setItem('customerSession', JSON.stringify(data.customer));
          setCurrentVendor(null);
          localStorage.removeItem('vendorSession');
          return true;
        } else {
          // For vendors, don't auto-login, just show success message
          toast.success('Vendor registration successful! Please wait for admin approval before you can log in.');
          return true;
        }
      } else {
        const errorData = await response.json();
        console.error('Registration error:', errorData.message);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Logout handler
  const navigate = useNavigate();

  const logout = () => {
    setCurrentCustomer(null);
    setCurrentVendor(null);
    setSelectedServices([]); // Clear cart on logout
    localStorage.removeItem('customerSession');
    localStorage.removeItem('vendorSession');
    localStorage.removeItem('cartSession'); // Clear cart from localStorage
    try { localStorage.removeItem('recommendationsResults'); } catch {}
    navigate('/');
  };

  // Bookings: add a booking to the current customer and to the respective vendors
  const addBooking = async (services, selectedDate = null) => {
    if (!currentCustomer) return;

    // Use selected date or default to today
    const bookingDate = selectedDate || new Date().toISOString().split('T')[0];

    try {
      console.log('Booking services:', services);
      console.log('Booking date:', bookingDate);

      // Use the new booking system for all services
      const bookingPromises = services.map(async (service) => {
        const response = await fetch(`http://localhost:5001/api/bookings/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: currentCustomer.id,
            serviceId: service._id,
            eventDate: bookingDate,
            notes: `Booked via cart - ${service.name}`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`${service.name}: ${errorData.message}`);
        }

        return await response.json();
      });

      const results = await Promise.allSettled(bookingPromises);

      const successful = results.filter(result => result.status === 'fulfilled');
      const failed = results.filter(result => result.status === 'rejected');

      if (successful.length > 0) {
        const successMessage = successful.length === 1
          ? `Successfully created booking request for ${successful[0].value.booking.serviceName}!`
          : `Successfully created ${successful.length} booking requests!`;
          toast.success(successMessage);
      }

      if (failed.length > 0) {
        const errorMessages = failed.map(result => result.reason.message).join('\n');
        toast.error(`Some bookings failed:\n${errorMessages}`);
      }

      setSelectedServices([]); // Clear cart after booking
      localStorage.removeItem('cartSession'); // Clear cart from localStorage

      // Refresh notifications after booking
      if (successful.length > 0) {
        // Trigger notification refresh
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }, 1000);
      }

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed. Please try again.');
    }
  };

  // Add or remove a service from selection
  const toggleService = (service) => {
    console.log('toggleService called with:', service);
    console.log('Current selectedServices:', selectedServices);

    // Validate service object
    if (!service || !service._id) {
      console.error('Invalid service object:', service);
      return;
    }

    setSelectedServices((prev) => {
      const exists = prev.find((s) => s._id === service._id);
      console.log('Service exists in cart:', !!exists);

      let newCart;
      if (exists) {
        console.log('Removing service from cart');
        newCart = prev.filter((s) => s._id !== service._id);
      } else {
        console.log('Adding service to cart');
        newCart = [...prev, service];
      }

      // Save to localStorage
      try {
        localStorage.setItem('cartSession', JSON.stringify(newCart));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
      return newCart;
    });
  };

  // Clear all selected services
  const clearSelectedServices = () => {
    setSelectedServices([]);
    localStorage.removeItem('cartSession');
  };

  // Notification sidebar handlers
  const handleNotificationClick = () => {
    setNotificationSidebarOpen(true);
  };

  const handleNotificationClose = () => {
    setNotificationSidebarOpen(false);
  };

  // Show loading screen while checking session
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar
        isLoggedIn={isLoggedIn}
        isVendorLoggedIn={isVendorLoggedIn}
        currentCustomer={currentCustomer}
        currentVendor={currentVendor}
        logout={logout}
        vendorTab={vendorTab}
        setVendorTab={setVendorTab}
        selectedServices={selectedServices}
        onNotificationClick={handleNotificationClick}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services selectedServices={selectedServices} toggleService={toggleService} />} />
        <Route path="/recommendations" element={<Recommendations toggleService={toggleService} selectedServices={selectedServices} />} />
        <Route path="/budget-calculator" element={<BudgetCalculator selectedServices={selectedServices} clearSelectedServices={clearSelectedServices} isLoggedIn={isLoggedIn} />} />
        <Route path="/login" element={<LoginRegister login={login} register={register} isLoggedIn={isLoggedIn} isVendorLoggedIn={isVendorLoggedIn} />} />
        <Route path="/profile" element={<Profile customer={currentCustomer} logout={logout} toggleService={toggleService} />} />
        <Route path="/mycart" element={<MyCart selectedServices={selectedServices} clearSelectedServices={clearSelectedServices} isLoggedIn={isLoggedIn} addBooking={addBooking} toggleService={toggleService} />} />
        <Route path="/vendor-dashboard" element={<VendorDashboard vendor={currentVendor} isVendorLoggedIn={isVendorLoggedIn} logout={logout} servicesList={servicesList} setServicesList={setServicesList} vendorTab={vendorTab} setVendorTab={setVendorTab} />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="/support" element={<HelpSupport user={currentVendor || currentCustomer} userType={currentVendor ? 'vendor' : 'customer'} />} />
      </Routes>

      <Footer isLoggedIn={isLoggedIn}
        isVendorLoggedIn={isVendorLoggedIn}
        currentCustomer={currentCustomer}
        currentVendor={currentVendor}
        logout={logout}
        vendorTab={vendorTab}
        setVendorTab={setVendorTab}
        selectedServices={selectedServices}
        onNotificationClick={handleNotificationClick} />

      {/* Notification Sidebar */}
      {(isLoggedIn || isVendorLoggedIn) && (
        <NotificationSidebar
          userId={currentCustomer?.id || currentVendor?.id}
          userType={currentCustomer ? 'customer' : 'vendor'}
          isOpen={notificationSidebarOpen}
          onClose={handleNotificationClose}
        />
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
); 