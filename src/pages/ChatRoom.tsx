import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Send, Paperclip, Smile, Loader2, Circle, LogOut, AlertTriangle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useRooms, type Room } from '../context/RoomContext';
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
    const { joinedRooms, loading: loadingRooms, leaveRoom, fetchRoomById } = useRooms();
    const { user, isInitializing: authLoading } = useAuth();
    const navigate = useNavigate();

    const [room, setRoom] = useState<Room | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
    const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
    const [isLeaving, setIsLeaving] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [lastTyped, setLastTyped] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const userTypingTimeouts = useRef<Record<number, any>>({});
    const notifiedUsers = useRef<Set<number>>(new Set());

    // Use ID from params
    const roomId = Number(id);

    // Also keep local room state in sync with joinedRooms if needed, 
    // but better to fetch fresh for online_count
    useEffect(() => {
        const found = joinedRooms.find(r => r.ID === roomId);
        if (found && !room) {
            setRoom(found);
        }
    }, [joinedRooms, roomId, room]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Initial messages and room details fetch
    useEffect(() => {
        if (!id) return;

        const syncRoomDetails = async () => {
            const details = await fetchRoomById(Number(id));
            if (details) {
                setRoom(details);
            }
        };

        syncRoomDetails();
        setMessages([]);
        setLoadingMessages(true);

        const fetchMessages = async (showLoader = true) => {
            if (showLoader) setLoadingMessages(true);
            else setIsRefreshing(true);
            try {
                const response = await apiClient.get(`/rooms/${id}/messages?limit=50&page=1`);
                if (response.data.success) {
                    const mappedMessages = response.data.data.map((msg: any) => ({
                        ID: msg.ID || msg.id || msg.MessageID || msg.message_id,
                        RoomID: msg.RoomID || msg.room_id,
                        UserID: msg.UserID || msg.user_id,
                        UserName: msg.UserName || msg.user_name || msg.Username || 'User',
                        Content: msg.Content || msg.content,
                        CreatedAt: msg.CreatedAt || msg.created_at || msg.SentAt
                    }));
                    setMessages(mappedMessages.reverse());
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoadingMessages(false);
                setIsRefreshing(false);
            }
        };

        fetchMessages();

        // Expose fetchMessages to a ref if needed or just use the local function
        // For simplicity, I'll redefine it for the refresh button or move it out
    }, [id]);

    const handleManualRefresh = async () => {
        if (!id || isRefreshing) return;
        setIsRefreshing(true);
        try {
            const response = await apiClient.get(`/rooms/${id}/messages?limit=50&page=1`);
            if (response.data.success) {
                const mappedMessages = response.data.data.map((msg: any) => ({
                    ID: msg.ID || msg.id || msg.MessageID || msg.message_id,
                    RoomID: msg.RoomID || msg.room_id,
                    UserID: msg.UserID || msg.user_id,
                    UserName: msg.UserName || msg.user_name || msg.Username || 'User',
                    Content: msg.Content || msg.content,
                    CreatedAt: msg.CreatedAt || msg.created_at || msg.SentAt
                }));
                setMessages(mappedMessages.reverse());
            }
        } catch (err) {
            console.error('Manual refresh failed:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // WebSocket connection for presence and typing
    useEffect(() => {
        // Wait for ID and User to be fully ready
        if (!id || !user || authLoading) return;

        const wsBaseUrl = import.meta.env.VITE_WS_URL;
        let isMounted = true;
        let ws: WebSocket | null = null;
        let timer: any = null;

        const connect = () => {
            if (!isMounted) return;

            let wsUrl: string;
            if (wsBaseUrl) {
                const base = wsBaseUrl.endsWith('/') ? wsBaseUrl.slice(0, -1) : wsBaseUrl;
                wsUrl = `${base}/${id}`;
            } else {
                const apiHost = BASE_URL.replace(/^https?:\/\//, '').split('/')[0];
                const wsProtocol = BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
                wsUrl = `${wsProtocol}//${apiHost}/api/v1/rooms/ws/${id}`;
            }

            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                if (!isMounted) {
                    ws?.close();
                    return;
                }
                console.log('WebSocket Connected to:', wsUrl);
                setSocket(ws);
            };

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const data = JSON.parse(event.data);
                    console.log('WS Event received:', data);

                    switch (data.type) {
                        case 'message.new':
                            const mid = data.MessageID || data.message_id || data.id || data.ID;
                            const rid = data.RoomID || data.room_id || data.RoomId;
                            const uid = data.UserID || data.user_id || data.UserId;
                            const uname = data.UserName || data.user_name || data.Username;
                            const content = data.Content || data.content;
                            const sentAt = data.SentAt || data.sent_at || data.created_at || data.CreatedAt;

                            const newMessage: Message = {
                                ID: mid,
                                RoomID: rid,
                                UserID: uid,
                                UserName: uname,
                                Content: content,
                                CreatedAt: sentAt
                            };

                            setMessages(prev => {
                                if (prev.some(m => !m.IsOptimistic && String(m.ID) === String(newMessage.ID))) {
                                    return prev;
                                }

                                const optimisticIndex = prev.findIndex(m => {
                                    if (!m.IsOptimistic) return false;
                                    const sameUser = String(m.UserID) === String(newMessage.UserID);
                                    const sameContent = m.Content.trim() === newMessage.Content.trim();
                                    return sameUser && sameContent;
                                });

                                if (optimisticIndex !== -1) {
                                    console.log('Matching optimistic message found, replacing...');
                                    const next = [...prev];
                                    next[optimisticIndex] = newMessage;
                                    return next;
                                }

                                if (String(newMessage.UserID) === String(user?.ID)) {
                                    console.log('Checking fallback for own message deduplication...');
                                    const isDuplicate = prev.slice(-3).some(m =>
                                        m.Content.trim() === newMessage.Content.trim() &&
                                        !m.IsOptimistic &&
                                        (String(m.ID) === String(newMessage.ID) || String(m.ID) === 'undefined')
                                    );
                                    if (isDuplicate) {
                                        console.log('Duplicate own message detected, skipping state update.');
                                        return prev;
                                    }
                                }

                                console.log('Adding new message to state:', newMessage);
                                return [...prev, newMessage];
                            });
                            break;

                        case 'room.user_joined':
                        case 'user.online':
                            const ouid = data.UserID || data.user_id;
                            const ouname = data.UserName || data.user_name;
                            const orid = data.RoomID || data.room_id;

                            if (!ouid) return;
                            const userIdNum = Number(ouid);

                            // Update online users set regardless of who it is
                            setOnlineUsers(prev => {
                                if (prev.has(userIdNum)) return prev;
                                const next = new Set(prev);
                                next.add(userIdNum);
                                return next;
                            });

                            // Only show "is now online" for OTHERS and if not already notified
                            if (userIdNum !== user?.ID && !notifiedUsers.current.has(userIdNum)) {
                                notifiedUsers.current.add(userIdNum);
                                const onlineMsg: Message = {
                                    ID: `online-${userIdNum}-${Date.now()}`,
                                    RoomID: orid,
                                    UserName: 'System',
                                    Content: `${ouname || 'A user'} is now online`,
                                    CreatedAt: new Date().toISOString(),
                                    IsSystem: true
                                };
                                setMessages(m => [...m, onlineMsg]);
                            }
                            break;

                        case 'room.user_left':
                        case 'user.offline':
                            const luid = data.UserID || data.user_id;
                            const luname = data.UserName || data.user_name || 'A user';
                            const lrid = data.RoomID || data.room_id || Number(id);

                            if (!luid) return;
                            const leftIdNum = Number(luid);

                            // Reset notification flag so they can trigger "is now online" again if they return
                            notifiedUsers.current.delete(leftIdNum);

                            setOnlineUsers(prev => {
                                if (!prev.has(leftIdNum)) return prev;
                                const next = new Set(prev);
                                next.delete(leftIdNum);
                                return next;
                            });

                            // Only show leave message for OTHERS
                            if (leftIdNum !== user?.ID) {
                                const offlineMsg: Message = {
                                    ID: `offline-${leftIdNum}-${Date.now()}`,
                                    RoomID: lrid,
                                    UserName: 'System',
                                    Content: `${luname} has left the room`,
                                    CreatedAt: new Date().toISOString(),
                                    IsSystem: true
                                };
                                setMessages(m => [...m, offlineMsg]);
                            }
                            break;

                        case 'room.typing':
                            const tuid = data.UserID || data.user_id;
                            const tuname = data.UserName || data.user_name || 'Someone';
                            if (!tuid || String(tuid) === String(user?.ID)) return;

                            setTypingUsers(prev => ({ ...prev, [Number(tuid)]: tuname }));
                            if (userTypingTimeouts.current[Number(tuid)]) {
                                clearTimeout(userTypingTimeouts.current[Number(tuid)]);
                            }
                            userTypingTimeouts.current[Number(tuid)] = setTimeout(() => {
                                setTypingUsers(prev => {
                                    const next = { ...prev };
                                    delete next[Number(tuid)];
                                    return next;
                                });
                            }, 3000);
                            break;
                    }
                } catch (err) {
                    console.error('Error parsing WS message:', err);
                }
            };

            ws.onclose = () => {
                if (isMounted) {
                    console.log('WebSocket Disconnected');
                    setSocket(null);
                    setOnlineUsers(new Set());
                    setTypingUsers({});
                }
            };
        };

        // Delay connection slightly to allow navigation to settle
        timer = setTimeout(connect, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                console.log('Cleaning up WebSocket connection...');
                ws.close();
            }
            Object.values(userTypingTimeouts.current).forEach(clearTimeout);
        };
    }, [id, user?.ID, authLoading]);

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

    // Only show full-page loader if we don't have the room data yet AND we are fetching joined rooms
    // Or if we are in the middle of leaving a room
    // On refresh, we wait for both auth and specific room details to be certain
    if (((loadingRooms || authLoading) && !room) || isLeaving) {
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

            <main className="flex-1 pt-24 sm:pt-32 pb-4 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col gap-4 sm:gap-6 overflow-hidden">
                <div className="flex flex-col gap-6 transition-all duration-500 shrink-0">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/rooms')}
                            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group w-fit"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Rooms
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className={`p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all ${isRefreshing ? 'animate-spin opacity-50' : 'hover:scale-110'}`}
                                title="Refresh Messages"
                            >
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 px-4 py-1.5 rounded-full border border-white/10">
                                <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                                {Math.max(onlineUsers.size, room?.online_count || 1)} online
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
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                {room.Image ? (
                                    <img src={room.Image} alt={room.Name} className="w-full h-full object-cover" />
                                ) : (
                                    <MessageSquare className="text-white/70" size={20} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-white capitalize truncate">{room.Name}</h1>
                                <p className="text-white/50 mt-1 text-sm sm:text-base flex items-center gap-2 truncate">
                                    <span className="uppercase tracking-widest text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-white/5 rounded-md border border-white/10 shrink-0">
                                        {room.Topic}
                                    </span>
                                    <span className="truncate">{room.Description}</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {room ? (
                    <div className="flex-1 flex flex-col bg-neutral-900/10 rounded-[24px] sm:rounded-[40px] border border-white/5 overflow-hidden backdrop-blur-3xl relative">
                        {/* Messages Area */}
                        <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex flex-col gap-3 sm:gap-4 custom-scrollbar">
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
                                                <div className={`max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2 sm:py-3 ${isOwnMessage
                                                    ? 'bg-white text-black rounded-tr-none'
                                                    : 'bg-white/5 text-white rounded-tl-none border border-white/10'
                                                    }`}>
                                                    {!isOwnMessage && (
                                                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
                                                            {msg.UserName}
                                                        </p>
                                                    )}
                                                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap wrap-break-word font-medium [word-break:break-word]">{msg.Content}</p>
                                                </div>
                                                <p className="text-[8px] sm:text-[9px] text-white/20 mt-1 uppercase font-medium">
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
                        <div className="p-3 sm:p-6 pt-1 sm:pt-2 bg-gradient-to-t from-black/20 to-transparent shrink-0">
                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center gap-2 sm:gap-4 bg-white/5 border border-white/10 rounded-full p-1.5 sm:p-2 pl-4 sm:pl-6 focus-within:border-white/20 transition-all hover:bg-white/[0.07]"
                            >
                                <button type="button" className="text-white/30 hover:text-white transition-colors shrink-0">
                                    <Paperclip size={18} className="sm:w-5 sm:h-5" />
                                </button>

                                <input
                                    type="text"
                                    placeholder={`Message ${room?.Name || '...'}`}
                                    value={messageInput}
                                    onChange={handleInputChange}
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/20 py-2 sm:py-3 text-sm sm:text-base min-w-0"
                                />

                                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                    <button type="button" className="hidden xs:block text-white/30 hover:text-white transition-colors">
                                        <Smile size={18} className="sm:w-5 sm:h-5" />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className={`p-2.5 sm:p-3 rounded-full transition-all flex items-center justify-center ${messageInput.trim()
                                            ? 'bg-white text-black hover:scale-105 active:scale-95'
                                            : 'bg-white/5 text-white/10'
                                            }`}
                                    >
                                        <Send size={16} className="sm:w-4.5 sm:h-4.5" fill={messageInput.trim() ? "currentColor" : "none"} />
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
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-neutral-900 border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                <AlertTriangle size={24} className="sm:w-8 sm:h-8" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-xl sm:text-2xl font-bold text-white">Leave Room?</h3>
                                <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                                    Are you sure you want to leave <span className="text-white font-medium">{room?.Name}</span>?
                                    You'll need an invite or find it in the list to join back.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-2 sm:mt-4">
                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLeave}
                                    className="px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
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
