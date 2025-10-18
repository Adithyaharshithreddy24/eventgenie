import { useEffect, useRef, useState } from 'react';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function VendorChat({ vendor }) {
    const [chats, setChats] = useState([]);
    const [active, setActive] = useState(null);
    const [message, setMessage] = useState('');
    const socketRef = useRef(null);

    const load = async () => {
        if (!vendor?.id) return;
        const res = await fetch(API_ENDPOINTS.CHAT_LIST_FOR_VENDOR(vendor.id));
        if (res.ok) {
            const data = await res.json();
            setChats(data.chats || []);
            if (!active && data.chats?.length) setActive(data.chats[0]);
            // connect if not connected
            if (!socketRef.current) {
                socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers', ''));
                socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                    setChats(prev => prev.map(c => c._id === chatId ? { ...c, messages: [...(c.messages || []), message], lastMessageAt: message.timestamp } : c));
                    setActive(prev => prev && prev._id === chatId ? { ...prev, messages: [...(prev.messages || []), message], lastMessageAt: message.timestamp } : prev);
                    try { if (window?.toast) window.toast('New message'); } catch { }
                });
            }
            // auto join active
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

    const joinActiveRoom = () => {
        if (socketRef.current && active?._id) {
            socketRef.current.emit('joinConversation', { chatId: active._id });
        }
    };

    useEffect(() => { joinActiveRoom(); }, [active?._id]);

    useEffect(() => () => { if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; } }, []);

    return (
        <div className="vendor-chat">
            <div className="sidebar">
                {(chats || []).map(c => (
                    <div key={c._id} className={`chat-item ${active?._id === c._id ? 'active' : ''}`} onClick={() => setActive(c)}>
                        <div className="title">Customer #{String(c.customer).slice(-4)}</div>
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
                            <div>Customer #{String(active.customer).slice(-4)} — {active.serviceCategory}</div>
                        </div>
                        <div className="chat-body">
                            {(active.messages || []).map((m, idx) => (
                                <div key={idx} className={`msg ${m.senderModel === 'Vendor' ? 'me' : m.senderModel === 'System' ? 'system' : 'them'}`}>
                                    <div className="bubble">{m.content}</div>
                                    <div className="meta">{new Date(m.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input-row">
                            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message" />
                            <button className="primary-btn" onClick={send} disabled={!message.trim()}>Send</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


