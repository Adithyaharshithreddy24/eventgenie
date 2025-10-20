import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function VendorChat({ vendor }) {
    const [chats, setChats] = useState([]);
    const [active, setActive] = useState(null);
    const [message, setMessage] = useState('');
    const socketRef = useRef(null);
    const location = useLocation();

    const load = async () => {
        if (!vendor?.id) return;
        const res = await fetch(API_ENDPOINTS.CHAT_LIST_FOR_VENDOR(vendor.id));
        if (res.ok) {
            const data = await res.json();
            setChats(data.chats || []);
            if (!active && data.chats?.length) setActive(data.chats[0]);
            if (!socketRef.current) {
                socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers', ''));
                socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                    setChats(prev => prev.map(c => c._id === chatId ? { ...c, messages: [...(c.messages || []), message], lastMessageAt: message.timestamp } : c));
                    setActive(prev => prev && prev._id === chatId ? { ...prev, messages: [...(prev.messages || []), message], lastMessageAt: message.timestamp } : prev);
                    try { if (window?.toast) window.toast('New message'); } catch { }
                });
            }
            const chatToJoin = data.chats && data.chats[0];
            if (socketRef.current && chatToJoin?._id) socketRef.current.emit('joinConversation', { chatId: chatToJoin._id });
        }
    };

    useEffect(() => { load(); }, [vendor?.id]);

    const send = async () => {
        if (!active?._id || !message.trim()) return;
        const payload = {
            senderModel: 'Vendor',
            senderId: vendor.id,
            receiverModel: 'Customer',
            receiverId: active.customer,
            content: message.trim()
        };
        const res = await fetch(API_ENDPOINTS.CHAT_SEND(active._id), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            setActive(data.chat);
            setChats((prev) => prev.map(c => c._id === data.chat._id ? data.chat : c));
            setMessage('');
        }
    };

    // Mark messages as read when chat becomes active
    const markAsRead = async (chatId) => {
        try {
            await fetch(API_ENDPOINTS.CHAT_SEND(chatId).replace('/send', '/read'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userType: 'vendor', userId: vendor.id })
            });
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    };

    const joinActiveRoom = () => {
        if (socketRef.current && active?._id) {
            socketRef.current.emit('joinConversation', { chatId: active._id });
        }
    };

    useEffect(() => { joinActiveRoom(); }, [active?._id]);

    // Mark messages as read when chat becomes active
    useEffect(() => {
        if (active?._id) {
            markAsRead(active._id);
        }
    }, [active?._id]);

    // Auto-open chat from URL params (notification deep link)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const openChat = params.get('openChat');
        const chatId = params.get('chatId');
        if (openChat && chatId && chats?.length) {
            const target = chats.find(c => String(c._id) === String(chatId));
            if (target) setActive(target);
        }
    }, [location.search, chats?.length]);

    useEffect(() => () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } }, []);

    // Helper to extract customer name
    const getCustomerName = (chat) => {
        const customerParticipant = (chat.participants || []).find(p => p.role === 'Customer');
        return customerParticipant?.name || `Customer ${String(chat.customer).slice(-4)}`;
    };
    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });


    return (
        <div className="vendor-chat">
            <div className="sidebar">
                {(chats || []).map(c => (
                    <div
                        key={c._id}
                        className={`chat-item ${active?._id === c._id ? 'active' : ''}`}
                        onClick={() => setActive(c)}
                    >
                        <div className="title">
                            {getCustomerName(c)}
                            {c.unreadCount?.vendor > 0 && (
                                <span className="unread-badge">{c.unreadCount.vendor}</span>
                            )}
                        </div>
                        <div className="time">{new Date(c.lastMessageAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>

            <div className="content">
                {!active ? (
                    <div className="empty">Select a chat</div>
                ) : (
                    <>
                        <div className="chat-header">
                            <i className="fas fa-user-circle"></i>
                            <div>{getCustomerName(active)} — {active.serviceCategory}</div>
                        </div>

                        <div className="chat-body">
                            {(active.messages || []).map((m, idx) => (
                                <div
                                    key={idx}
                                    className={`msg ${m.senderModel === 'Vendor'
                                        ? 'me'
                                        : m.senderModel === 'System'
                                            ? 'system'
                                            : 'them'
                                        }`}
                                >
                                    <div className="bubble">{m.content}
                                        <div className="meta" style={{ float: 'right' }}>{formatTime(m.timestamp)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="chat-input-row">
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder="Type a message"
                            />
                            <button
                                onClick={send}
                                className="primary-btn"
                                style={{
                                    backgroundColor: '#6a11cb',
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
                    </>
                )}
            </div>
        </div>
    );
}
