import { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function AdminChatMonitor() {
    const [chats, setChats] = useState([]);
    const [active, setActive] = useState(null);
    const socketRef = useRef(null);
    const [adminId, setAdminId] = useState(() => {
        try {
            const raw = localStorage.getItem('adminSession');
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed?._id || parsed?.id || null;
        } catch {
            return null;
        }
    });
    const [joinedChatIds, setJoinedChatIds] = useState(() => new Set());

    const load = async () => {
        const res = await fetch(API_ENDPOINTS.CHAT_LIST_FOR_ADMIN);
        if (res.ok) {
            const data = await res.json();
            setChats(data.chats || []);
            if (!active && data.chats?.length) setActive(data.chats[0]);
        }
    };

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const chatParam = params.get('chat');
            if (chatParam) {
                setActive(prev => prev && prev._id === chatParam ? prev : prev);
            }
        } catch { }

        load();
        if (!socketRef.current) {
            socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers', ''));
            socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, messages: [...(c.messages || []), message], lastMessageAt: message.timestamp } : c));
                setActive(prev => prev && prev._id === chatId ? { ...prev, messages: [...(prev.messages || []), message], lastMessageAt: message.timestamp } : prev);
            });
        }
        return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
    }, []);

    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const chatParam = params.get('chat');
            if (chatParam && chats.length) {
                const found = chats.find(c => c._id === chatParam);
                if (found) setActive(found);
            }
        } catch { }
    }, [chats.length]);

    const getParticipantName = (chat, role, id) => {
        if (!chat?.participants) return role;
        // Try to find by model and id
        const p = chat.participants.find(p =>
            (role ? p.role === role : true) && (id ? String(p.user) === String(id) : true)
        );
        return p?.name || role;
    };
    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });



    return (
        <div className="vendor-chat" style={{ display: 'flex', gap: 16, flexDirection: 'row' }}>
            <div className="sidebar" style={{ width: 300, borderRight: '1px solid #ccc', height: '80vh' }}>
                {(chats || []).map(c => {
                    const custName = getParticipantName(c, 'Customer');
                    const vendName = getParticipantName(c, 'Vendor');
                    return (
                        <div
                            key={c._id}
                            className={`chat-item ${active?._id === c._id ? 'active' : ''}`}
                            onClick={() => setActive(c)}
                        >
                            <div className="title">{custName} ↔ {vendName}</div>
                            <div className="subtitle">{c.serviceCategory}</div>
                            <div className="time">{new Date(c.lastMessageAt).toLocaleString()}</div>
                        </div>
                    );
                })}
            </div>

            <div className="content" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '70%' }}>
                {!adminId && (
                    <div style={{ padding: 8, background: '#fff3cd', border: '1px solid #ffe8a1', borderRadius: 8, marginBottom: 8 }}>
                        Admin session not found. Please login again, or
                        <button style={{ marginLeft: 8 }} onClick={() => {
                            try {
                                const raw = localStorage.getItem('adminSession');
                                const parsed = raw ? JSON.parse(raw) : null;
                                setAdminId(parsed?._id || parsed?.id || null);
                            } catch { }
                        }}>Reload Session</button>
                    </div>
                )}

                {!active ? (
                    <div className="empty">Select a conversation to view</div>
                ) : (
                    <>
                        <div className="chat-header">
                            <i className="fas fa-user-shield"></i>
                            <div>Monitoring Chat • {active.serviceCategory}</div>
                        </div>

                        <div className="chat-body read-only" style={{ height: 'calc(100% - 120px)', overflowY: 'auto' }}>
                            {(active.messages || []).map((m, idx) => {
                                const senderName = getParticipantName(active, m.senderModel, m.sender);
                                return (
                                    <div
                                        key={idx}
                                        className={`msg ${m.senderModel === 'Admin'
                                            ? 'admin'
                                            : m.senderModel === 'System'
                                                ? 'system'
                                                : m.senderModel === 'Customer'
                                                    ? 'customer'
                                                    : 'vendor'
                                            }`}
                                    >
                                        <div
                                            className="bubble"
                                            style={{
                                                display: 'inline-block',
                                                maxWidth: '80%',
                                                width: 'calc(fit-content + 2px)',
                                                wordWrap: 'break-word',
                                                padding: '8px 12px',
                                                borderRadius: 10,
                                                marginBottom: 4,
                                                backgroundColor:
                                                    m.senderModel === 'Admin'
                                                        ? '#d1e7dd'
                                                        : m.senderModel === 'System'
                                                            ? '#f8d7da'
                                                            : m.senderModel === 'Customer'
                                                                ? '#fff3cd'
                                                                : '#d1ecf1'
                                            }}
                                        >
                                            <div className="meta" style={{ fontSize: '0.8rem', color: '#555' }}>
                                                {senderName}
                                            </div>
                                            {m.content}
                                            <div className="meta" style={{ fontSize: '0.8rem', color: '#555', float: 'right' }}>
                                                {formatTime(m.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button
                                className="btn secondary-btn"
                                onClick={async () => {
                                    if (!adminId) {
                                        alert('No admin ID found. Please login again.');
                                        return;
                                    }
                                    if (!active?._id) {
                                        alert('No chat selected');
                                        return;
                                    }
                                    const url = API_ENDPOINTS.CHAT_ADMIN_JOIN(active._id);
                                    const payload = { adminId };

                                    try {
                                        const res = await fetch(url, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });

                                        if (res.ok) {
                                            if (socketRef.current) socketRef.current.emit('joinConversation', { chatId: active._id });
                                            setJoinedChatIds(prev => new Set(prev).add(active._id));
                                            try {
                                                const params = new URLSearchParams(window.location.search);
                                                params.set('chat', active._id);
                                                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                                            } catch { }
                                            alert('Joined chat successfully (staying on this page to monitor live).');
                                        } else {
                                            const err = await res.json();
                                            alert('Failed to join: ' + (err.message || 'Unknown error'));
                                        }
                                    } catch (e) {
                                        alert('Failed to join chat: ' + e.message);
                                    }
                                }}
                            >
                                Join Chat
                            </button>

                            <button
                                className="btn secondary-btn"
                                onClick={async () => {
                                    if (!adminId) {
                                        alert('No admin ID found. Please login again.');
                                        return;
                                    }
                                    if (!active?._id) {
                                        alert('No chat selected');
                                        return;
                                    }
                                    const url = API_ENDPOINTS.CHAT_ADMIN_AUTO_MESSAGE(active._id);
                                    const payload = { adminId, templateKey: 'apology' };

                                    try {
                                        const res = await fetch(url, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload)
                                        });

                                        if (res.ok) {
                                            if (socketRef.current) socketRef.current.emit('joinConversation', { chatId: active._id });
                                            alert('Auto message sent');
                                            window.location.reload();
                                        } else {
                                            const err = await res.json();
                                            alert('Failed to send auto message: ' + (err.message || 'Unknown error'));
                                        }
                                    } catch (e) {
                                        alert('Failed to send auto message: ' + e.message);
                                    }
                                }}
                            >
                                Send Auto Message
                            </button>

                            {joinedChatIds.has(active._id) && (
                                <span style={{ alignSelf: 'center', color: '#2e7d32' }}>Joined ✓</span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
