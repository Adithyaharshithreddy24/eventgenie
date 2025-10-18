import { useEffect, useMemo, useRef, useState } from 'react';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function CustomerChat({ customer, vendor, serviceCategory, onClose }) {
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const socketRef = useRef(null);
    const endRef = useRef(null);

    const canStart = useMemo(() => {
        return Boolean(customer?.id && vendor?.id && serviceCategory);
    }, [customer?.id, vendor?.id, serviceCategory]);

    const startOrFetch = async () => {
        if (!canStart) return;
        setLoading(true);
        try {
            const res = await fetch(API_ENDPOINTS.CHAT_START, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customer.id,
                    vendorId: vendor.id,
                    serviceCategory
                })
            });
            const data = await res.json();
            if (res.ok) {
                setChat(data.chat);
                setList(data.chat?.messages || []);
                // connect socket and join
                if (!socketRef.current) {
                    socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers', ''));
                }
                socketRef.current.emit('joinConversation', { chatId: data.chat._id });
                socketRef.current.off('receiveMessage');
                socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                    if (chatId === data.chat._id) {
                        setList(prev => [...prev, message]);
                        try { if (window?.toast) window.toast('New message'); } catch { }
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Reload chat whenever customer, vendor, or serviceCategory changes
    useEffect(() => {
        setChat(null);   // reset previous chat
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

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [list.length]);

    useEffect(() => () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    }, []);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="chat-wrapper" style={{ position: 'relative' }}>
            {/* Chat Header */}
            <div className="chat-header">
                <i className="fas fa-user-circle"></i>
                <div>Chat with {vendor?.name || 'Vendor'} — {serviceCategory}</div>
                <button
                    className="btn secondary-btn"
                    onClick={onClose}
                    style={{ position: 'absolute', top: '5px', right: '10px', height: '40px', width: '40px', padding: 0, fontSize: '18px', backgroundColor: 'white' }}
                >
                    ×
                </button>
            </div>

            {/* Chat Body */}
            <div className="chat-body">
                {(list || []).map((m, idx) => (
                    <div
                        key={idx}
                        className={`msg ${m.senderModel === 'Customer' ? 'me' : m.senderModel === 'System' ? 'system' : 'them'}`}
                    >
                        <div className="bubble">
                            {m.content}
                            <div className="meta" style={{ float: 'right' }}>
                                {formatTime(m.timestamp)}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-row">
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type a message"
                />
                <button className="primary-btn" onClick={send} disabled={!message.trim()}>Send</button>
            </div>
        </div>
    );
}
