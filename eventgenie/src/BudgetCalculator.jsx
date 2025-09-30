import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

function BudgetCalculator({ selectedServices, clearSelectedServices, isLoggedIn, hideServicesList, hideBookAll, totalBudget, setTotalBudget, isInCart }) {
    const [localBudget, setLocalBudget] = useState(0);
    const [guestCount, setGuestCount] = useState(0);
    const navigate = useNavigate();

    // Calculate subtotal from selected services
    const subtotal = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);

    const serviceFee = subtotal > 0 ? Math.max(guestCount * 5, 500) : 0;
    const totalCost = subtotal + serviceFee;
    const budget = typeof totalBudget === 'number' ? totalBudget : localBudget;
    const setBudget = setTotalBudget || setLocalBudget;
    const budgetUsedPercent = budget > 0 ? (totalCost / budget) * 100 : 0;

    const updateBudget = () => {
        // This function could also re-calculate based on guest count in future
    };

    const handleBookAll = () => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        // Booking logic here if logged in
    };

    // If this is being used in MyCart (hideServicesList is true), render a simplified version
    if (hideServicesList) {
        return (
            <div className="budget-calculator-simple" style={{
                textAlign: 'center',
                padding: '20px'
            }}>
                <h2 className="section-title">Budget Calculator</h2>
                <div className="budget-form-simple" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    alignItems: 'center'
                }}>
                    <div className="form-group" style={{
                        width: '100%',
                        maxWidth: '300px'
                    }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333',
                            fontSize: '1rem'
                        }}>
                            Your Total Budget (₹)
                        </label>
                        <input
                            type="number"
                            placeholder="Enter your budget"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{
                        width: '100%',
                        maxWidth: '300px'
                    }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '500',
                            color: '#333',
                            fontSize: '1rem'
                        }}>
                            Number of Guests
                        </label>
                        <input
                            type="number"
                            placeholder="Enter number of guests"
                            value={guestCount}
                            onChange={(e) => setGuestCount(Number(e.target.value))}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                textAlign: 'center'
                            }}
                        />
                    </div>

                    <button
                        className="btn primary-btn"
                        onClick={updateBudget}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            minWidth: '150px'
                        }}
                    >
                        Update Budget
                    </button>
                </div>
            </div>
        );
    }

    // Full version for standalone use
    return (
        <section id="budget-calculator" className="page active">
            <div className="container">
                <h2 className="section-title">Budget Calculator</h2>

                <div className="budget-calculator-container">
                    <div className="budget-form">
                        <div className="form-group">
                            <label htmlFor="total-budget">Your Total Budget (₹)</label>
                            <input
                                type="number"
                                id="total-budget"
                                placeholder="Enter your budget"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="guest-count">Number of Guests</label>
                            <input
                                type="number"
                                id="guest-count"
                                placeholder="Enter number of guests"
                                value={guestCount}
                                onChange={(e) => setGuestCount(Number(e.target.value))}
                            />
                        </div>
                        <button id="update-budget" className="btn primary-btn" onClick={updateBudget}>
                            Update Budget
                        </button>
                    </div>

                    {/* Hide selected services section if in cart context */}
                    {!isInCart && (
                        <div className="selected-services">
                            <div style={{ justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                                {budget === 0 && (
                                    <div className="budget-warning">
                                        ⚠️ PLEASE ENTER YOUR BUDGET
                                    </div>
                                )}
                                {budget > 0 && totalCost > budget && (
                                    <div className="budget-warning">
                                        ⚠️ YOU HAVE EXCEEDED YOUR BUDGET
                                    </div>
                                )}
                                {guestCount <= 0 && (
                                    <div className="budget-warning">
                                        ⚠️ PLEASE ENTER THE NUMBER OF GUESTS
                                    </div>
                                )}
                            </div>

                            <h3>Selected Services</h3>
                            <div id="calculator-items">
                                {selectedServices.length === 0 ? (
                                    <p className="empty-message">
                                        No services added yet. Browse services and add them to your calculator.
                                    </p>
                                ) : (
                                    selectedServices.map((service, index) => (
                                        <p key={index}>{service.name} - ₹{service.price}</p>
                                    ))
                                )}
                            </div>

                            <div className="budget-summary">
                                <h3>Budget Summary</h3>
                                <div className="summary-item">
                                    <span>Total Budget:</span>
                                    <span id="summary-budget">₹{budget}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Subtotal:</span>
                                    <span id="summary-subtotal">₹{subtotal}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Service Fee:</span>
                                    <span id="summary-service-fee">₹{serviceFee.toFixed(2)}</span>
                                </div>
                                <div className="summary-item total">
                                    <span>Total Cost:</span>
                                    <span id="summary-total">₹{totalCost.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="budget-status">
                                <div className="progress-container">
                                    <div
                                        id="budget-progress"
                                        className="progress-bar"
                                        style={{ width: `${Math.min(budgetUsedPercent, 100)}%`, background: budget > 0 && totalCost > budget ? '#e74c3c' : undefined }}
                                    ></div>
                                </div>
                                {totalCost <= budget && budget > 0 && (
                                    <p style={{ color: 'green', fontWeight: 600 }}>
                                        ₹{budget - totalCost} left in your budget!
                                    </p>
                                )}
                                {totalCost > budget && budget > 0 && (
                                    <p style={{ color: '#e74c3c', fontWeight: 600 }}>
                                        ₹{(totalCost - budget).toFixed(2)} over your budget!
                                    </p>
                                )}
                            </div>

                            {!hideBookAll && (
                                <>
                                    <button id="book-all" className="btn primary-btn" disabled={selectedServices.length === 0 || totalCost > budget} onClick={handleBookAll}>
                                        Book All Services
                                    </button>
                                    <button id="clear-calculator" className="btn secondary-btn" onClick={clearSelectedServices}>
                                        Clear Calculator
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default BudgetCalculator;
