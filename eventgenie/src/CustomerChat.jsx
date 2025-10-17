import { useEffect, useMemo, useRef, useState } from 'react';
import { API_ENDPOINTS } from './config/api';
import { io } from 'socket.io-client';

export default function CustomerChat({ customer, vendor, serviceCategory }) {
    const [chat, setChat] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState([]);
    const socketRef = useRef(null);
    const endRef = useRef(null);

    const canStart = useMemo(() => {
        return Boolean(customer?.id && vendor?.id && serviceCategory);
    }, [customer?.id, vendor?.id, serviceCategory]);

    const baseUrl = API_ENDPOINTS.CUSTOMERS.replace('/api/customers','');

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
                    socketRef.current = io(API_ENDPOINTS.CUSTOMERS.replace('/api/customers',''));
                }
                socketRef.current.emit('joinConversation', { chatId: data.chat._id });
                socketRef.current.off('receiveMessage');
                socketRef.current.on('receiveMessage', ({ chatId, message }) => {
                    if (chatId === data.chat._id) {
                        setList(prev => [...prev, message]);
                        try { if (window?.toast) window.toast('New message'); } catch {}
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { startOrFetch(); }, [canStart]);

    const send = async () => {
        if (!chat?._id || !message.trim()) return;
        const payload = {
            senderModel: 'Customer',
            senderId: customer.id,
            receiverModel: 'Vendor',
            receiverId: vendor.id,
            content: message.trim()
        };
        // emit socket; REST is still available but socket persists
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

    return (
        <div className="chat-wrapper">
            <div className="chat-header">
                <i className="fas fa-user-circle"></i>
                <div>Chat with {vendor?.name || 'Vendor'} — {serviceCategory}</div>
            </div>
            <div className="chat-body">
                {(list || []).map((m, idx) => (
                    <div key={idx} className={`msg ${m.senderModel === 'Customer' ? 'me' : m.senderModel === 'System' ? 'system' : 'them'}`}>
                        <div className="bubble">{m.content}</div>
                        <div className="meta">{new Date(m.timestamp).toLocaleString()}</div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>
            <div className="chat-input-row">
                <input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Type a message" />
                <button className="primary-btn" onClick={send} disabled={!message.trim()}>Send</button>
            </div>
        </div>
    );
}


