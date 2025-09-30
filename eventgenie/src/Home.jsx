import './style.css';
import { useEffect } from 'react';

function Home() {
    useEffect(() => {
    }, []);

    return (
        <>
            <main>
                <section id="home" className="page active">
                    <div className="hero">
                        <div className="container">
                            <h2>Your Dream Event, Our Expertise</h2>
                            <p>From concept to celebration, let Event Genie make your special day magical.</p>
                            <a href="/services" className="btn primary-btn" data-page="services">Explore Services</a>
                        </div>
                    </div>

                    <div className="features">
                        <div className="container">
                            <h2 className="section-title">Why Choose Event Genie?</h2>
                            <div className="feature-grid">
                                <div className="feature-card">
                                    <i className="fas fa-magic"></i>
                                    <h3>Personalized Planning</h3>
                                    <p>Customized solutions tailored to your specific needs and preferences.</p>
                                </div>
                                <div className="feature-card">
                                    <i className="fas fa-dollar-sign"></i>
                                    <h3>Budget Friendly</h3>
                                    <p>Our smart calculator helps you plan your event within your budget.</p>
                                </div>
                                <div className="feature-card">
                                    <i className="fas fa-handshake"></i>
                                    <h3>Verified Vendors</h3>
                                    <p>All our vendors go through a strict verification process.</p>
                                </div>
                                <div className="feature-card">
                                    <i className="fas fa-calendar-check"></i>
                                    <h3>Availability Tracking</h3>
                                    <p>Check and book services based on real-time availability with timestamp priority.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>
            </main>
        </>
    );
}

export default Home;
