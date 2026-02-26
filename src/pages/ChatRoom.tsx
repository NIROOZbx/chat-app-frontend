import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Paperclip, Smile, Loader2, Circle, LogOut, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import apiClient, { BASE_URL } from '../lib/api';

interface Message {
    ID: number | string;
    RoomID: number;
    UserID?: number;
    UserName: string;
    Content: string;
    CreatedAt: string;
    IsSystem?: boolean;
    IsOptimistic?: boolean;
}

const ChatRoom: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { joinedRooms, loading: loadingRooms, leaveRoom } = useRooms();
    const { user } = useAuth();

    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [lastTyped, setLastTyped] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userTypingTimeouts = useRef<Record<number, any>>({});

    // Find the room in joined rooms
    const room = joinedRooms.find(r => r.ID === Number(id));

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Fetch message history
    useEffect(() => {
        if (!id) return;

        // Reset state on room change
        setMessages([]);
        setLoadingMessages(true);

        const fetchMessages = async () => {
            try {
                const response = await apiClient.get(`/rooms/${id}/messages?limit=50&page=1`);
                if (response.data.success) {
                    const mappedMessages = response.data.data.map((msg: any) => ({
                        ID: msg.id,
                        RoomID: msg.room_id,
                        UserID: msg.user_id,
                        UserName: msg.user_name,
                        Content: msg.content,
                        CreatedAt: msg.created_at
                    }));
                    // Functional update to avoid losing live messages received while fetching
                    setMessages(prev => {
                        const history = mappedMessages.reverse();
                        const live = prev.filter(m => !history.some((h: Message) => h.ID === m.ID));
                        return [...history, ...live];
                    });
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [id]);

    // WebSocket connection for presence and typing
    useEffect(() => {
        if (!id || !user) return;

        const wsBaseUrl = import.meta.env.VITE_WS_URL;
        let wsUrl;

        if (wsBaseUrl) {
            // Use the provided base and append the room ID
            const base = wsBaseUrl.endsWith('/') ? wsBaseUrl.slice(0, -1) : wsBaseUrl;
            wsUrl = `${base}/${id}`;
        } else {
            // Fallback to dynamic host detection
            const apiHost = BASE_URL.replace(/^https?:\/\//, '').split('/')[0];
            const wsProtocol = BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
            wsUrl = `${wsProtocol}//${apiHost}/api/v1/rooms/ws/${id}`;
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setSocket(ws);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WS Event received:', data);

                switch (data.type) {
                    case 'message.new':
                        const mid = data.MessageID || data.message_id || data.id;
                        const rid = data.RoomID || data.room_id;
                        const uid = data.UserID || data.user_id;
                        const uname = data.UserName || data.user_name;
                        const content = data.Content || data.content;
                        const sentAt = data.SentAt || data.sent_at || data.created_at;

                        const newMessage: Message = {
                            ID: mid,
                            RoomID: rid,
                            UserID: uid,
                            UserName: uname,
                            Content: content,
                            CreatedAt: sentAt
                        };

                        setMessages(prev => {
                            // 1. Check for accidental duplicates by real ID (e.g. if broadcast arrives twice)
                            if (prev.some(m => !m.IsOptimistic && String(m.ID) === String(newMessage.ID))) {
                                return prev;
                            }

                            // 2. Find any optimistic message that matches this new message
                            // We match by: UserID AND (Content OR approximate timestamp)
                            const optimisticIndex = prev.findIndex(m => {
                                if (!m.IsOptimistic) return false;

                                const sameUser = String(m.UserID) === String(newMessage.UserID);
                                // Trim and compare content to be safe against server-side trimming
                                const sameContent = m.Content.trim() === newMessage.Content.trim();

                                // If it's the same user and same content, it's almost certainly the same message
                                return sameUser && sameContent;
                            });

                            if (optimisticIndex !== -1) {
                                console.log('Matching optimistic message found, replacing...');
                                const next = [...prev];
                                next[optimisticIndex] = newMessage;
                                return next;
                            }

                            // 3. Fallback: If we couldn't find an optimistic match but it's OUR message,
                            // still check if we added a duplicate recently (prevent race condition)
                            if (String(newMessage.UserID) === String(user?.ID)) {
                                // If the message content matches any recent message from us, ignore it to prevent duplicates
                                // (This covers cases where the broadcast arrives before React state finishes updating)
                                if (prev.slice(-5).some(m => m.Content.trim() === newMessage.Content.trim())) {
                                    return prev;
                                }
                            }

                            return [...prev, newMessage];
                        });
                        break;

                    case 'room.user_joined':
                        const juid = data.UserID || data.user_id;
                        const juname = data.UserName || data.user_name;
                        const jrid = data.RoomID || data.room_id;

                        // Don't show system message for SELF
                        if (!juid || !user?.ID || String(juid) === String(user.ID)) return;

                        console.log('User joined event data:', data);
                        const joinMsg: Message = {
                            ID: `join-${juid}-${Date.now()}`,
                            RoomID: jrid,
                            UserName: 'System',
                            Content: `${juname || 'A user'} joined the room`,
                            CreatedAt: new Date().toISOString(),
                            IsSystem: true
                        };
                        setMessages(prev => [...prev, joinMsg]);
                        setOnlineUsers(prev => new Set([...prev, juid]));
                        break;

                    case 'room.user_left':
                        const luid = data.UserID || data.user_id;
                        const luname = data.UserName || data.user_name;
                        const lrid = data.RoomID || data.room_id;

                        // Don't show system message for SELF
                        if (!luid || !user?.ID || String(luid) === String(user.ID)) return;

                        const leaveMsg: Message = {
                            ID: `leave-${luid}-${Date.now()}`,
                            RoomID: lrid,
                            UserName: 'System',
                            Content: `${luname || 'A user'} left the room`,
                            CreatedAt: new Date().toISOString(),
                            IsSystem: true
                        };
                        setMessages(prev => [...prev, leaveMsg]);
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.delete(luid);
                            return next;
                        });
                        break;

                    case 'room.typing':
                        const tuid = data.UserID || data.user_id;
                        const tuname = data.UserName || data.user_name || 'Someone';

                        // Don't show typing indicator for SELF
                        if (!tuid || !user?.ID || String(tuid) === String(user.ID)) return;

                        setTypingUsers(prev => ({
                            ...prev,
                            [tuid]: tuname
                        }));

                        if (userTypingTimeouts.current[tuid]) {
                            clearTimeout(userTypingTimeouts.current[tuid]);
                        }

                        userTypingTimeouts.current[tuid] = setTimeout(() => {
                            setTypingUsers(prev => {
                                const next = { ...prev };
                                delete next[tuid];
                                return next;
                            });
                        }, 3000);
                        break;

                    case 'user.online':
                        const ouid = data.UserID || data.user_id;
                        const ouname = data.UserName || data.user_name;
                        const orid = data.RoomID || data.room_id;

                        // Don't show system message for SELF
                        if (String(ouid) === String(user?.ID)) {
                            setOnlineUsers(prev => new Set([...prev, ouid]));
                            return;
                        }

                        setOnlineUsers(prev => {
                            if (prev.has(ouid)) return prev;

                            const next = new Set(prev);
                            next.add(ouid);

                            // Add system message ONLY if they were newly added to the set
                            const onlineMsg: Message = {
                                ID: `online-${ouid}-${Date.now()}`,
                                RoomID: orid,
                                UserName: 'System',
                                Content: `${ouname || 'A user'} is now online`,
                                CreatedAt: new Date().toISOString(),
                                IsSystem: true
                            };
                            setMessages(m => [...m, onlineMsg]);

                            return next;
                        });
                        break;

                    case 'user.offline':
                        const offuid = data.UserID || data.user_id;
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.delete(offuid);
                            return next;
                        });
                        break;
                }
            } catch (err) {
                console.error('Error parsing WS message:', err);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected');
            setSocket(null);
            setOnlineUsers(new Set());
            setTypingUsers({});
        };

        return () => {
            ws.close();
            Object.values(userTypingTimeouts.current).forEach(clearTimeout);
        };
    }, [id, user]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !user || !socket || socket.readyState !== WebSocket.OPEN) return;

        const content = messageInput.trim();
        setMessageInput('');

        // Optimistic Update
        const tempId = `optimistic-${Date.now()}`;
        const optimisticMessage: Message = {
            ID: tempId,
            RoomID: Number(id),
            UserID: user.ID,
            UserName: user.UserName,
            Content: content,
            CreatedAt: new Date().toISOString(),
            IsOptimistic: true
        };

        setMessages(prev => [...prev, optimisticMessage]);

        try {
            socket.send(JSON.stringify({
                type: 'message.send',
                content: content
            }));
        } catch (err) {
            console.error('Failed to send message via WS:', err);
            // Rollback optimistic update
            setMessages(prev => prev.filter(m => m.ID !== tempId));
            setMessageInput(content); // Restore input for retry
        }
    };

    const handleLeaveRoom = () => {
        console.log('handleLeaveRoom triggered, showLeaveConfirm:', true);
        setShowLeaveConfirm(true);
    };

    const confirmLeave = async () => {
        if (!id) return;
        console.log('confirmLeave triggered for room:', id);
        setShowLeaveConfirm(false);
        setIsLeaving(true);
        try {
            await leaveRoom(Number(id));
            console.log('Successfully left room, navigating to /rooms');
            navigate('/rooms');
        } catch (err) {
            console.error('Failed to leave room:', err);
        } finally {
            setIsLeaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        const now = Date.now();

        // Only send a notification every 3 seconds to save bandwidth
        if (now - lastTyped > 3000) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                console.log('Sending typing notification...');
                socket.send(JSON.stringify({ type: 'room.typing' }));
            }
            setLastTyped(now);
        }
    };

    if (loadingRooms || isLeaving) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-white/20" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-4 px-6 max-w-7xl mx-auto w-full flex flex-col gap-6 overflow-hidden">
                <div className="flex flex-col gap-6 transition-all duration-500 shrink-0">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/rooms')}
                            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group w-fit"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Rooms
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                                {onlineUsers.size || 1} online
                            </div>

                            <button
                                onClick={handleLeaveRoom}
                                className="flex items-center gap-2 text-xs text-rose-400 font-bold uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 px-4 py-1.5 rounded-full border border-rose-500/10 transition-all hover:scale-105"
                            >
                                <LogOut size={14} />
                                Leave Room
                            </button>
                        </div>
                    </div>

                    {room && (
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10">
                                {room.Image ? (
                                    <img src={room.Image} alt={room.Name} className="w-full h-full object-cover" />
                                ) : (
                                    <MessageSquare className="text-white/70" size={24} />
                                )}
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold tracking-wide text-white capitalize">{room.Name}</h1>
                                <p className="text-white/50 mt-1 text-base flex items-center gap-2">
                                    <span className="uppercase tracking-widest text-[10px] font-bold px-2 py-0.5 bg-white/5 rounded-md border border-white/10">
                                        {room.Topic}
                                    </span>
                                    {room.Description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {room ? (
                    <div className="flex-1 flex flex-col bg-neutral-900/10 rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl relative">
                        {/* Messages Area */}
                        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-white/20" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-2">
                                        <MessageSquare size={32} className="text-white/20" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">Welcome to {room.Name}</h2>
                                    <p className="text-white/40 max-w-md mx-auto">
                                        This is the beginning of your conversation. Send a message to start chatting!
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, index) => {
                                        if (msg.IsSystem) {
                                            return (
                                                <div key={msg.ID} className="flex justify-center my-3">
                                                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                                                        {msg.Content}
                                                    </p>
                                                </div>
                                            );
                                        }

                                        const isOwnMessage = msg.UserID === user?.ID;

                                        return (
                                            <div
                                                key={`${msg.ID}-${index}`}
                                                className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} ${msg.IsOptimistic ? 'opacity-60' : 'opacity-100'} transition-opacity`}
                                            >
                                                <div className={`max-w-[80%] rounded-2xl px-6 py-3 ${isOwnMessage
                                                    ? 'bg-white text-black rounded-tr-none'
                                                    : 'bg-white/5 text-white rounded-tl-none border border-white/10'
                                                    }`}>
                                                    {!isOwnMessage && (
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                                                            {msg.UserName}
                                                        </p>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{msg.Content}</p>
                                                </div>
                                                <p className="text-[9px] text-white/20 mt-1 uppercase font-medium">
                                                    {msg.IsOptimistic ? 'Sending...' : new Date(msg.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Typing Indicator */}
                        <div className="h-6 px-10">
                            {Object.keys(typingUsers).length > 0 && (
                                <p className="text-[15px] text-white/40 animate-pulse">
                                    {Object.values(typingUsers).length === 1
                                        ? `${Object.values(typingUsers)[0]} is typing...`
                                        : `${Object.values(typingUsers).length} users are typing...`}
                                </p>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 pt-2 bg-gradient-to-t from-black/20 to-transparent shrink-0">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center gap-4 bg-white/5 border border-white/10 rounded-full p-2 pl-6 focus-within:border-white/20 transition-all hover:bg-white/[0.07]"
                            >
                                <button type="button" className="text-white/30 hover:text-white transition-colors">
                                    <Paperclip size={20} />
                                </button>

                                <input
                                    type="text"
                                    placeholder={`Message ${room?.Name || '...'}`}
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 py-3"
                                />

                                <div className="flex items-center gap-2">
                                    <button type="button" className="text-white/30 hover:text-white transition-colors">
                                        <Smile size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className={`p-3 rounded-full transition-all flex items-center justify-center ${messageInput.trim()
                                            ? 'bg-white text-black hover:scale-105 active:scale-95'
                                            : 'bg-white/5 text-white/10'
                                            }`}
                                    >
                                        <Send size={18} fill={messageInput.trim() ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
                        <h2 className="text-2xl font-bold">Room not found</h2>
                        <p className="text-white/40 mt-2">You might not have joined this room yet.</p>
                    </div>
                )}
            </main>

            {/* Leave Confirmation Modal */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-neutral-900 border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                <AlertTriangle size={32} />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">Leave Room?</h3>
                                <p className="text-white/40 text-sm leading-relaxed">
                                    Are you sure you want to leave <span className="text-white font-medium">{room?.Name}</span>?
                                    You'll need an invite or find it in the list to join back.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLeave}
                                    className="px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatRoom;
