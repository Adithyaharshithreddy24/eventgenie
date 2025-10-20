import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ServiceDetailsModal from './ServiceDetailsModal.jsx';

const CATEGORY_OPTIONS = [
	{ key: 'venue', label: 'Venue' },
	{ key: 'catering', label: 'Catering' },
	{ key: 'decor', label: 'Decor' },
	{ key: 'entertainment', label: 'Entertainment' }
];

function Recommendations({ toggleService, selectedServices = [] }) {
	const navigate = useNavigate();
	const [selectedCategories, setSelectedCategories] = useState([]);
	const [budget, setBudget] = useState('');
	const [minRating, setMinRating] = useState(0);
	const [date, setDate] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
    const [results, setResults] = useState(() => {
        try {
            const cached = localStorage.getItem('recommendationsResults');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    });
	const [activeService, setActiveService] = useState(null);

	const toggleCategory = (key) => {
		setSelectedCategories((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
		);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setResults([]);
		if (selectedCategories.length === 0) {
			setError('Select at least one category.');
			return;
		}
		const numericBudget = Number(budget);
		if (!numericBudget || numericBudget <= 0) {
			setError('Enter a valid budget.');
			return;
		}
		setLoading(true);
		try {
			const response = await fetch('http://localhost:5001/api/services/recommendations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ categories: selectedCategories, budget: numericBudget, minRating: Number(minRating) || 0, date: date || undefined })
			});
			if (!response.ok) {
				throw new Error('Failed to fetch recommendations');
			}
            const data = await response.json();
            const combos = (data.combinations || []).map(c => ({
                ...c,
                services: (c.services || []).map(svc => ({
                    ...svc,
                    // if a date is provided, returned items are available (backend filters unavailable out)
                    isAvailable: date ? (svc.isAvailable !== false) : undefined,
                    availabilityStatus: date ? ((svc.isAvailable !== false) ? 'Available' : 'Not Available') : 'Date not selected'
                }))
            }));
            setResults(combos);
            try { localStorage.setItem('recommendationsResults', JSON.stringify(combos)); } catch {}
		} catch (err) {
			setError(err.message || 'Request failed');
		} finally {
			setLoading(false);
		}
	};

	const handleOpenService = (service) => {
		setActiveService({ ...service, selectedDate: date || null });
	};

	const handleCloseService = () => {
		setActiveService(null);
	};

	const handleAddToCart = (serviceWithDate) => {
		// Use provided toggleService to add/remove
		toggleService(serviceWithDate);
	};

	const handleBookSet = (combo) => {
		const items = (combo.services || []).map(s => ({ ...s, selectedDate: date || null }));
		items.forEach(item => toggleService(item));
		navigate('/mycart');
	};

	return (
		<section className="page active" style={{ width: '100%' }}>
			<div className="container">
				<h2 className="section-title">Recommendations</h2>

				<form onSubmit={handleSubmit} style={{
					display: 'grid',
					gap: '16px',
					background: '#ffffff',
					borderRadius: '12px',
					padding: '20px',
					boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
				}}>
					<div>
						<label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Event Date (optional)</label>
						<input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6 }} />
					</div>
					<div>
						<label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Categories</label>
						<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
							{CATEGORY_OPTIONS.map((c) => (
								<label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<input type="checkbox" checked={selectedCategories.includes(c.key)} onChange={() => toggleCategory(c.key)} />
									{c.label}
								</label>
							))}
						</div>
					</div>
					<div>
						<label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Budget (₹)</label>
						<input type="number" min={1} step={100} value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Enter total budget" style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6 }} />
					</div>
					<div>
						<label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Minimum Rating: {minRating}</label>
						<input type="range" min={0} max={5} step={0.1} value={minRating} onChange={(e) => setMinRating(e.target.value)} style={{ width: '100%' }} />
					</div>
					<div>
						<button type="submit" className="btn primary-btn" disabled={loading}>
							{loading ? 'Finding...' : 'Find Optimal Combos'}
						</button>
					</div>
					{error && <div style={{ color: '#d32f2f' }}>{error}</div>}
				</form>

				{results && results.length > 0 && (
					<div style={{ marginTop: 24,width: '100%' }}>
						<h3 style={{ marginBottom: 12 }}>Top {results.length} combinations</h3>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 24 ,width: '100%'}}>
							{results.map((combo, idx) => (
								<div key={idx} className="service-card" style={{ 
    minWidth: '100%', 
    flexShrink: 0, 
    cursor: 'pointer', 
    border: '1px solid #eee', 
    borderRadius: '8px', 
    overflow: 'hidden',
    background: '#fff'
}}>
									<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 8, marginBottom: 12,width: '100%' }}>
										<div>
											<strong>Combo #{idx + 1}</strong>
											<span style={{ marginLeft: 12 }}>Total: ₹{combo.totalPrice}</span>
											<span style={{ marginLeft: 12 }}>Avg Rating: {Number(combo.averageRating || 0).toFixed(1)}</span>
										</div>
										<div>
											<button className="btn primary-btn" onClick={() => handleBookSet(combo)}>Book Set</button>
										</div>
									</div>
									<div className="services-grid" style={{ 
    display: 'flex', 
    flexDirection: 'row', 
    gap: '16px', 
    overflowX: 'auto', 
    paddingBottom: '8px' 
}}>
                                    {(combo.services || []).map((s) => (
                                        <div key={s._id} className="service-card" style={{ margin: 8, cursor: 'pointer', position: 'relative' }} onClick={() => handleOpenService(s)}>
                                            {date && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    padding: '4px 8px',
                                                    borderRadius: 12,
                                                    fontSize: 12,
                                                    background: (s.isAvailable !== false) ? '#4caf50' : '#f44336',
                                                    color: '#fff'
                                                }}>
                                                    {(s.isAvailable !== false) ? 'Available' : 'Not Available'}
                                                </div>
                                            )}
												<img src={(s.images && s.images[0]) || 'https://via.placeholder.com/300x200?text=No+Image'} alt={s.name} className="service-image" />
												<div className="service-info">
													<h3 className="service-name">{s.name}</h3>
													<p className="service-provider">{s.category}</p>
													<p className="service-price">₹{s.price}</p>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
			{activeService && (
				<ServiceDetailsModal
					service={activeService}
					onClose={handleCloseService}
					onAddToCart={handleAddToCart}
					selectedDate={date || null}
					showDatePopup={() => {}}
					closeDatePopup={() => {}}
				/>
			)}
		</section>
	);
}

export default Recommendations;


