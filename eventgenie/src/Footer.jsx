import './style.css';
import { NavLink } from 'react-router-dom';

function Footer({ isLoggedIn, isVendorLoggedIn, isAdminLoggedIn, selectedServices = [] }) {

    return (
        <footer>
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>About Event Genie</h3>
                        <p>We make event planning magical. From weddings to corporate events, we've got you covered with the best services.</p>
                    </div>

                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            {!isAdminLoggedIn && !isVendorLoggedIn && !isLoggedIn && (
                                <>
                                    <li><NavLink to="/" end>Home</NavLink></li>
                                    <li><NavLink to="/services">Services</NavLink></li>
                                    <li><NavLink to="/budget-calculator">Budget Calculator</NavLink></li>
                                    <li><NavLink to="/login">Login / Register</NavLink></li>
                                </>
                            )}

                            {isLoggedIn && !isVendorLoggedIn && (
                                <>
                                    <li><NavLink to="/" end>Home</NavLink></li>
                                    <li><NavLink to="/services">Services</NavLink></li>
                                    <li>
                                        <NavLink to="/mycart">
                                            MyCart
                                            {selectedServices.length > 0 && (
                                                <span style={{
                                                    background: '#e74c3c',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    padding: '2px 6px',
                                                    fontSize: '0.7rem',
                                                    marginLeft: '4px',
                                                    minWidth: '16px',
                                                    display: 'inline-block',
                                                    textAlign: 'center'
                                                }}>
                                                    {selectedServices.length}
                                                </span>
                                            )}
                                        </NavLink>
                                    </li>
                                    <li><NavLink to="/support">Help & Support</NavLink></li>
                                    <li><NavLink to="/profile">Profile</NavLink></li>
                                </>
                            )}

                            {isVendorLoggedIn && !isAdminLoggedIn && (
                                <>
                                    <li><NavLink to="/vendor-dashboard">My Services</NavLink></li>
                                    <li><NavLink to="/vendor-dashboard">Chats</NavLink></li>
                                    <li><NavLink to="/vendor-dashboard">Bookings</NavLink></li>
                                    <li><NavLink to="/vendor-dashboard">Block Services</NavLink></li>
                                    <li><NavLink to="/support">Help & Support</NavLink></li>
                                    <li><NavLink to="/vendor-dashboard">Profile</NavLink></li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h3>Contact Us</h3>
                        <p><i className="fas fa-phone"></i> +91 98765 43210</p>
                        <p><i className="fas fa-envelope"></i> info@eventgenie.com</p>
                        <p><i className="fas fa-map-marker-alt"></i> 123 Event Street, Mumbai</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2023 Event Genie. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
