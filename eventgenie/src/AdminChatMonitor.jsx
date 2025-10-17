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
            // Support either `_id` or `id` keys depending on backend response shape
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
        // Preselect chat from URL (?chat=ID)
        try {
            const params = new URLSearchParams(window.location.search);
            const chatParam = params.get('chat');
            if (chatParam) {
                // We'll select after list loads
                setActive(prev => prev && prev._id === chatParam ? prev : prev);
            }
        } catch {}

        load();
        if (!socketRef.current) {
            socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers',''));
            socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                setChats(prev => prev.map(c => c._id === chatId ? { ...c, messages: [...(c.messages||[]), message], lastMessageAt: message.timestamp } : c));
                setActive(prev => prev && prev._id === chatId ? { ...prev, messages: [...(prev.messages||[]), message], lastMessageAt: message.timestamp } : prev);
            });
        }
        return () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } };
    }, []);

    // After chats are loaded, honor URL chat param selection
    useEffect(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const chatParam = params.get('chat');
            if (chatParam && chats.length) {
                const found = chats.find(c => c._id === chatParam);
                if (found) setActive(found);
            }
        } catch {}
    }, [chats.length]);

    return (
        <div className="admin-chat-monitor">
            <div className="sidebar">
                {(chats || []).map(c => (
                    <div key={c._id} className={`chat-item ${active?._id === c._id ? 'active' : ''}`} onClick={() => setActive(c)}>
                        <div className="title">Cust {String(c.customer).slice(-4)} ↔ Vend {String(c.vendor).slice(-4)}</div>
                        <div className="subtitle">{c.serviceCategory}</div>
                        <div className="time">{new Date(c.lastMessageAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
            <div className="content">
                {!adminId && (
                    <div style={{ padding: 8, background:'#fff3cd', border:'1px solid #ffe8a1', borderRadius: 8, marginBottom: 8 }}>
                        Admin session not found. Please login again, or
                        <button style={{ marginLeft: 8 }} onClick={() => {
                            try {
                                const raw = localStorage.getItem('adminSession');
                                const parsed = raw ? JSON.parse(raw) : null;
                                setAdminId(parsed?._id || parsed?.id || null);
                            } catch {}
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
                        <div className="chat-body read-only">
                            {(active.messages || []).map((m, idx) => (
                                <div key={idx} className={`msg ${m.senderModel === 'Admin' ? 'admin' : m.senderModel === 'System' ? 'system' : m.senderModel === 'Customer' ? 'customer' : 'vendor'}`}>
                                    <div className="bubble">{m.content}</div>
                                    <div className="meta">{m.senderModel} • {new Date(m.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display:'flex', gap:8, marginTop:8 }}>
                            <button onClick={async ()=>{
                                console.log('🔧 ADMIN UI - Join Chat clicked');
                                console.log('🔧 ADMIN UI - adminId:', adminId);
                                console.log('🔧 ADMIN UI - active chat:', active);
                                
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
                                console.log('🔧 ADMIN UI - URL:', url);
                                console.log('🔧 ADMIN UI - Payload:', payload);
                                
                                try {
                                    const res = await fetch(url, {
                                        method:'POST', 
                                        headers:{'Content-Type':'application/json'}, 
                                        body: JSON.stringify(payload)
                                    });
                                    
                                    console.log('🔧 ADMIN UI - Response status:', res.status);
                                    console.log('🔧 ADMIN UI - Response ok:', res.ok);
                                    
                                    if (res.ok) {
                                        const data = await res.json();
                                        console.log('🔧 ADMIN UI - Response data:', data);
                                        if (socketRef.current) socketRef.current.emit('joinConversation', { chatId: active._id });
                                        // Mark as joined and reflect in URL
                                        setJoinedChatIds(prev => new Set(prev).add(active._id));
                                        try {
                                            const params = new URLSearchParams(window.location.search);
                                            params.set('chat', active._id);
                                            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                                        } catch {}
                                        alert('Joined chat successfully (staying on this page to monitor live).');
                                    } else {
                                        const err = await res.json();
                                        console.error('🔧 ADMIN UI - Error response:', err);
                                        alert('Failed to join: ' + (err.message || 'Unknown error'));
                                    }
                                } catch (e) {
                                    console.error('🔧 ADMIN UI - Exception:', e);
                                    alert('Failed to join chat: ' + e.message);
                                }
                            }}>Join Chat</button>
                            <button onClick={async ()=>{
                                console.log('🔧 ADMIN UI - Send Auto Message clicked');
                                console.log('🔧 ADMIN UI - adminId:', adminId);
                                console.log('🔧 ADMIN UI - active chat:', active);
                                
                                if (!adminId) {
                                    alert('No admin ID found. Please login again.');
                                    return;
                                }
                                if (!active?._id) {
                                    alert('No chat selected');
                                    return;
                                }
                                
                                const url = API_ENDPOINTS.CHAT_ADMIN_AUTO_MESSAGE(active._id);
                                const payload = { adminId, templateKey:'apology' };
                                console.log('🔧 ADMIN UI - URL:', url);
                                console.log('🔧 ADMIN UI - Payload:', payload);
                                
                                try {
                                    const res = await fetch(url, {
                                        method:'POST', 
                                        headers:{'Content-Type':'application/json'}, 
                                        body: JSON.stringify(payload)
                                    });
                                    
                                    console.log('🔧 ADMIN UI - Response status:', res.status);
                                    console.log('🔧 ADMIN UI - Response ok:', res.ok);
                                    
                                    if (res.ok) {
                                        const data = await res.json();
                                        console.log('🔧 ADMIN UI - Response data:', data);
                                        if (socketRef.current) socketRef.current.emit('joinConversation', { chatId: active._id });
                                        alert('Auto message sent');
                                        // Refresh chat list to show new message
                                        window.location.reload();
                                    } else {
                                        const err = await res.json();
                                        console.error('🔧 ADMIN UI - Error response:', err);
                                        alert('Failed to send auto message: ' + (err.message || 'Unknown error'));
                                    }
                                } catch (e) {
                                    console.error('🔧 ADMIN UI - Exception:', e);
                                    alert('Failed to send auto message: ' + e.message);
                                }
                            }}>Send Auto Message</button>
                            {joinedChatIds.has(active._id) && (
                                <span style={{ alignSelf:'center', color:'#2e7d32' }}>Joined ✓</span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


