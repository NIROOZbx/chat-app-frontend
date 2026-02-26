import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Paperclip, Smile, Loader2, Circle, LogOut, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import apiClient from '../lib/api';

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
    const typingTimeoutRef = useRef<any>(null);
    const userTypingTimeouts = useRef<Record<number, any>>({});

    // Find the room in joined rooms
    const room = joinedRooms.find(r => r.ID === Number(id));

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Fetch initial messages
    useEffect(() => {
        if (!id) return;

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

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:8080/api/v1/rooms/ws/${id}`;

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
                        const newMessage: Message = {
                            ID: data.message_id,
                            RoomID: data.room_id,
                            UserID: data.user_id,
                            UserName: data.user_name,
                            Content: data.content,
                            CreatedAt: data.sent_at
                        };

                        setMessages(prev => {
                            // Find any optimistic message that matches this new message
                            const optimisticIndex = prev.findIndex(m =>
                                m.IsOptimistic &&
                                String(m.UserID) === String(newMessage.UserID) &&
                                m.Content.trim() === newMessage.Content.trim()
                            );

                            if (optimisticIndex !== -1) {
                                // Replace the optimistic message with the real one
                                const next = [...prev];
                                next[optimisticIndex] = newMessage;
                                return next;
                            }

                            // If not found, check if we already have this message ID (prevent duplicates)
                            if (prev.some(m => String(m.ID) === String(newMessage.ID))) return prev;

                            return [...prev, newMessage];
                        });
                        break;

                    case 'room.user_joined':
                        console.log('User joined event data:', data);
                        const joinMsg: Message = {
                            ID: `join-${data.user_id}-${Date.now()}`,
                            RoomID: data.room_id,
                            UserName: 'System',
                            Content: `${data.user_name || 'A user'} joined the room`,
                            CreatedAt: new Date().toISOString(),
                            IsSystem: true
                        };
                        setMessages(prev => [...prev, joinMsg]);
                        setOnlineUsers(prev => new Set([...prev, data.user_id]));
                        break;

                    case 'room.user_left':
                        const leaveMsg: Message = {
                            ID: `leave-${data.user_id}-${Date.now()}`,
                            RoomID: data.room_id,
                            UserName: 'System',
                            Content: `${data.user_name} left the room`,
                            CreatedAt: new Date().toISOString(),
                            IsSystem: true
                        };
                        setMessages(prev => [...prev, leaveMsg]);
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.delete(data.user_id);
                            return next;
                        });
                        break;

                    case 'room.typing':
                        if (data.user_id === user.ID) return;

                        setTypingUsers(prev => ({
                            ...prev,
                            [data.user_id]: data.user_name
                        }));

                        if (userTypingTimeouts.current[data.user_id]) {
                            clearTimeout(userTypingTimeouts.current[data.user_id]);
                        }

                        userTypingTimeouts.current[data.user_id] = setTimeout(() => {
                            setTypingUsers(prev => {
                                const next = { ...prev };
                                delete next[data.user_id];
                                return next;
                            });
                        }, 3000);
                        break;

                    case 'user.online':
                        // Deduplicate: only show system message if user wasn't already online
                        if (data.user_id === user.ID) {
                            setOnlineUsers(prev => new Set([...prev, data.user_id]));
                            return;
                        }

                        setOnlineUsers(prev => {
                            if (prev.has(data.user_id)) return prev;

                            const next = new Set(prev);
                            next.add(data.user_id);

                            // Add system message ONLY if they were newly added to the set
                            const onlineMsg: Message = {
                                ID: `online-${data.user_id}-${Date.now()}`,
                                RoomID: data.room_id,
                                UserName: 'System',
                                Content: `${data.user_name || 'A user'} is now online`,
                                CreatedAt: new Date().toISOString(),
                                IsSystem: true
                            };
                            setMessages(m => [...m, onlineMsg]);

                            return next;
                        });
                        break;

                    case 'user.offline':
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.delete(data.user_id);
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
