import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../lib/api';
import Navbar from '../components/Navbar';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const JoinRoom = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const navigate = useNavigate();
    const { user, isInitializing } = useAuth();

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Joining room...');
    const [roomId, setRoomId] = useState<number | null>(null);
    const joinAttempted = useRef(false);

    useEffect(() => {
        if (isInitializing) return;

        if (!user) {
            // Options: Redirect to login or show error. Let's redirect to rooms to login.
            navigate('/rooms');
            return;
        }

        if (joinAttempted.current) return;
        joinAttempted.current = true;

        const joinWithCode = async () => {
            if (!inviteCode) {
                setStatus('error');
                setMessage('Invalid invite link.');
                return;
            }

            try {
                const response = await apiClient.post(`/rooms/join/private/${inviteCode}`);
                if (response.data.success) {
                    setStatus('success');
                    setMessage('Successfully joined the room!');

                    const rid = response.data.data.room_id || response.data.data.RoomID || response.data.data.id || response.data.data.ID;
                    if (rid) {
                        setRoomId(rid);
                    }
                } else {
                    setStatus('error');
                    setMessage(response.data.error || 'Failed to join room.');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.error || err.response?.data?.message || 'Failed to join. Invalid or expired link.');
            }
        };

        joinWithCode();
    }, [inviteCode, user, isInitializing, navigate]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="bg-neutral-900 border border-white/10 rounded-[32px] p-8 max-w-md w-full text-center space-y-6">
                    {status === 'loading' && (
                        <>
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <Loader2 size={32} className="animate-spin text-white/50" />
                            </div>
                            <h2 className="text-2xl font-bold">Joining Room...</h2>
                            <p className="text-white/40">Please wait while we verify your invite link.</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                                <AlertCircle size={32} className="text-rose-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-rose-500">Oops!</h2>
                            <p className="text-white/60">{message}</p>
                            <button
                                onClick={() => navigate('/rooms')}
                                className="w-full mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                            >
                                Back to Rooms
                            </button>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-500">Joined!</h2>
                            <p className="text-white/60">{message}</p>
                            <button
                                onClick={() => navigate(roomId ? `/rooms/${roomId}` : '/rooms')}
                                className="w-full mt-4 px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                {roomId ? 'Go to Chat' : 'Go to My Rooms'}
                            </button>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default JoinRoom;
