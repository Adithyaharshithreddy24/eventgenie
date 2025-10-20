import { useEffect, useState } from 'react';
import './HelpSupport.css';
import { API_ENDPOINTS } from './config/api';
import { toast } from 'react-toastify';

export default function HelpSupport({ user, userType }) {
    const [step, setStep] = useState(0); // 0:type, 1:subject, 2:message, 3:confirm
    const [mode, setMode] = useState(null); // 'report' | 'query'
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [tickets, setTickets] = useState([]);

    const loadMyTickets = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.CUSTOMERS.replace('/api/customers','')}/api/support/user/${user.id}?userType=${userType}`);
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
            }
        } catch (e) {
            console.error('Failed to load tickets', e);
        }
    };

    useEffect(() => { loadMyTickets(); }, [user?.id, userType]);

    const resetFlow = () => {
        setStep(0);
        setMode(null);
        setSubject('');
        setMessage('');
    };

    const submit = async () => {
        if (!user?.id) return toast.warn('Please login first');
        if (!mode || !subject.trim() || !message.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.CUSTOMERS.replace('/api/customers','')}/api/support/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: mode,
                    userId: user.id,
                    userType,
                    subject,
                    message
                })
            });
            if (res.ok) {
                await loadMyTickets();
                resetFlow();
                toast.success('Submitted successfully');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Submission failed');
            }
        } catch (e) {
            console.error('Submit failed', e);
            toast.error('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="support-wrapper">
            <div className="support-container">
                <div className="support-header">Help & Support</div>
                <div className="chat-window">
                    <div className="chat-row bot">
                        <div className="bubble">
                            Note: Use Help & Support for tickets/issues. For direct messaging about a booking, use the Chat feature in your bookings.
                        </div>
                    </div>
                    {/* Bot: Ask type */}
                    <div className="chat-row bot">
                        <div className="bubble">
                            Hi! How can I help you today? Choose one option below.
                        </div>
                    </div>
                    <div className="chat-row bot">
                        <div className="choices">
                            <button 
                                className={`choice ${mode==='report' ? 'active' : ''}`} 
                                onClick={()=>{ setMode('report'); setStep(1); }}
                                aria-pressed={mode==='report'}
                            >Report</button>
                            <button 
                                className={`choice ${mode==='query' ? 'active' : ''}`} 
                                onClick={()=>{ setMode('query'); setStep(1); }}
                                aria-pressed={mode==='query'}
                            >Query</button>
                        </div>
                    </div>

                    {/* Bot: Ask subject */}
                    {step >= 1 && (
                        <>
                            <div className="chat-row bot">
                                <div className="bubble">
                                    Great! Please provide a short subject for your {mode}.
                                </div>
                            </div>
                            <div className="chat-row user">
                                <input 
                                    className="chat-input" 
                                    placeholder="Enter subject" 
                                    value={subject} 
                                    onChange={(e)=>setSubject(e.target.value)}
                                />
                                <div className="actions">
                                    <button 
                                        className="primary" 
                                        onClick={()=>{ if (subject.trim()) setStep(2); }}
                                        disabled={!subject.trim()}
                                    >Next</button>
                                    <button className="ghost" onClick={resetFlow}>Start Over</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Bot: Ask message */}
                    {step >= 2 && (
                        <>
                            <div className="chat-row bot">
                                <div className="bubble">
                                    Thanks! Now describe the details about: <strong>{subject}</strong>
                                </div>
                            </div>
                            <div className="chat-row user">
                                <textarea 
                                    className="chat-textarea" 
                                    placeholder="Type your message" 
                                    value={message} 
                                    onChange={(e)=>setMessage(e.target.value)}
                                />
                                <div className="actions">
                                    <button 
                                        className="primary" 
                                        onClick={()=>{ if (message.trim()) setStep(3); }}
                                        disabled={!message.trim()}
                                    >Next</button>
                                    <button className="ghost" onClick={()=>setStep(1)}>Back</button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Bot: Confirm */}
                    {step >= 3 && (
                        <>
                            <div className="chat-row bot">
                                <div className="bubble">
                                    Please review your submission:
                                    <div className="review">
                                        <div><strong>Type:</strong> {mode}</div>
                                        <div><strong>Subject:</strong> {subject}</div>
                                        <div><strong>Message:</strong> {message}</div>
                                    </div>
                                    Would you like to submit or re-edit?
                                </div>
                            </div>
                            <div className="chat-row user">
                                <div className="actions">
                                    <button className="primary" onClick={submit} disabled={submitting}>
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                    <button className="ghost" onClick={()=>setStep(2)}>Re-edit</button>
                                    <button className="ghost" onClick={resetFlow}>Start Over</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="history">
                    <div className="history-header">My Tickets</div>
                    {tickets.length === 0 ? (
                        <div className="empty">No tickets yet</div>
                    ) : (
                        <ul className="ticket-list">
                            {tickets.map(t => (
                                <li key={t._id} className="ticket-item">
                                    <div className="ticket-top">
                                        <span className={`pill ${t.type}`}>{t.type}</span>
                                        <span className={`status ${t.status}`}>{t.status}</span>
                                        <span className="time">{new Date(t.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="ticket-subject">{t.subject}</div>
                                    <div className="ticket-message">{t.message}</div>
                                    {Array.isArray(t.replies) && t.replies.length > 0 && (
                                        <div className="ticket-replies">
                                            {t.replies.map((r, idx) => (
                                                <div key={idx} className={`reply ${r.senderType}`}>
                                                    <span className="sender">{r.senderType}:</span> {r.message}
                                                    <span className="time">{new Date(r.createdAt).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
