import './style.css';

function Footer() {

    return (
        <>
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
                                <li><a href="/" data-page="home">Home</a></li>
                                <li><a href="/services" data-page="services">Services</a></li>
                                <li><a href="/budget-calculator" data-page="budget-calculator">Budget Calculator</a></li>
                                <li><a href="/login" data-page="login">Login / Register</a></li>
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
        </>
    );
}

export default Footer;