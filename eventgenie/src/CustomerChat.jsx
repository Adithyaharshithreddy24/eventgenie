import { useEffect, useMemo, useRef, useState } from 'react';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function CustomerChat({ customer, vendor, serviceCategory, onClose }) {
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState('');
    const [list, setList] = useState([]);
    const socketRef = useRef(null);
    const endRef = useRef(null);

    // ------------------ DRAG LOGIC ------------------
    const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 50 }); // default top-right
    const [dragging, setDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        setDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            setPosition({
                x: Math.max(0, e.clientX - dragStartRef.current.x),
                y: Math.max(0, e.clientY - dragStartRef.current.y)
            });
        }
    };

    const handleMouseUp = () => setDragging(false);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging]);

    // ------------------ CHAT LOGIC ------------------
    const canStart = useMemo(() => Boolean(customer?.id && vendor?.id && serviceCategory), [customer?.id, vendor?.id, serviceCategory]);

    const startOrFetch = async () => {
        if (!canStart) return;
        try {
            const res = await fetch(API_ENDPOINTS.CHAT_START, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, vendorId: vendor.id, serviceCategory })
            });
            const data = await res.json();
            if (res.ok) {
                setChat(data.chat);
                setList(data.chat?.messages || []);
                if (!socketRef.current) socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers', ''));
                socketRef.current.emit('joinConversation', { chatId: data.chat._id });
                socketRef.current.off('receiveMessage');
                socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                    if (chatId === data.chat._id) setList(prev => [...prev, message]);
                });
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        setChat(null);
        setList([]);
        setMessage('');
        startOrFetch();
    }, [customer?.id, vendor?.id, serviceCategory]);

    const send = async () => {
        if (!chat?._id || !message.trim()) return;
        const payload = {
            senderModel: 'Customer',
            senderId: customer.id,
            receiverModel: 'Vendor',
            receiverId: vendor.id,
            content: message.trim()
        };
        if (socketRef.current) {
            socketRef.current.emit('sendMessage', { chatId: chat._id, ...payload }, (ack) => {
                if (ack?.ok) setMessage('');
            });
        }
    };

    // Mark messages as read when chat loads
    const markAsRead = async (chatId) => {
        try {
            await fetch(`${API_ENDPOINTS.CHAT_SEND(chatId).replace('/send', '/read')}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userType: 'customer', userId: customer.id })
            });
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [list.length]);
    useEffect(() => () => { socketRef.current?.disconnect(); socketRef.current = null; }, []);

    // Mark messages as read when chat loads
    useEffect(() => {
        if (chat?._id) {
            markAsRead(chat._id);
        }
    }, [chat?._id]);

    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const textareaRef = useRef(null);
    const maxRows = 5;

    const adjustHeight = () => {
        const ta = textareaRef.current;
        if (ta) {
            ta.rows = 1; // reset to calculate scrollHeight
            const lineHeight = 24; // approximate line height in px (adjust as needed)
            const newRows = Math.min(Math.floor(ta.scrollHeight / lineHeight), maxRows);
            ta.rows = newRows;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [message]);
    // ------------------ RENDER ------------------
    return (
        <div
            style={{
                position: 'fixed',   // stay on top layer
                top: position.y,
                left: position.x,
                zIndex: 9999,
                cursor: dragging ? 'grabbing' : 'default',
            }}
        >
            <div className="chat-wrapper" style={{ width: '100%', height: '75%', marginTop: '40px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', borderRadius: '8px', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
                {/* Header (draggable) */}
                <div
                    className="chat-header"
                    onMouseDown={handleMouseDown}
                >
                    <i className="fas fa-user-circle"></i>
                    <div>Chat with {vendor?.name || 'Vendor'} — {serviceCategory}</div>
                    <button
                        className="btn secondary-btn"
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '45px',
                            right: '10px',
                            height: '40px',
                            width: '40px',
                            padding: 0,
                            fontSize: '18px',
                            backgroundColor: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Chat Body */}
                <div className="chat-body">
                    {list.map((m, idx) => (
                        <div
                            key={idx}
                            className={`msg ${m.senderModel === 'Customer' ? 'me' : m.senderModel === 'System' ? 'system' : 'them'}`}
                        >
                            <div className="bubble" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {m.content}
                                <div className="meta" style={{ float: 'right' }}>{formatTime(m.timestamp)}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                {/* Chat Input */}
                <div className="chat-input-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (!e.shiftKey) {
                                    e.preventDefault(); // Prevent newline
                                    send(); // Send message
                                }
                                // If shiftKey is pressed, do nothing → default inserts newline
                            }
                        }}
                        placeholder="Type a message"
                        rows={Math.min(5, message.split('\n').length)}
                        style={{
                            width: '100%',
                            resize: 'none',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #ccc',
                            minHeight: '30px',
                            fontSize: '14px',
                            lineHeight: '1.4'
                        }}
                    />

                    <button
                        onClick={send}
                        className="primary-btn"
                        style={{
                            backgroundColor: '#6a11cb', // WhatsApp-style
                            border: 'none',
                            borderRadius: '50%',
                            width: '45px',
                            height: '45px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5b0fb8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6a11cb'}
                    >
                        <i className="fas fa-paper-plane" style={{ color: 'white', fontSize: '18px' }}></i>
                    </button>
                </div>

            </div>
        </div>
    );
}
