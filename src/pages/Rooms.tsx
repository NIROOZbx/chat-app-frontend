
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ElectricBorder from '../components/ElectricBorder';
import CreateRoomModal from '../components/CreateRoomModal';
import { Plus, Users, Hash, Loader2, Lock } from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';

const Rooms = () => {
    const { availableRooms, joinedRooms, loading, fetchAllRooms, fetchJoinedRooms, refreshAll, joinRoom } = useRooms();
    const { user, isInitializing } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [activeTab, setActiveTab] = useState<'available' | 'joined'>('available');
    const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            refreshAll();
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        if (activeTab === 'available') {
            fetchAllRooms();
        } else {
            fetchJoinedRooms();
        }
    }, [activeTab, user]);

    const handleJoinRoom = async (roomId: number) => {
        setJoiningId(roomId);
        try {
            await joinRoom(roomId);
            navigate(`/rooms/${roomId}`);
        } catch (error) {
            console.error('Failed to join room:', error);
        } finally {
            setJoiningId(null);
        }
    };

    const rooms = activeTab === 'joined'
        ? joinedRooms
        : availableRooms.filter(room => !joinedRooms.some(joined => joined.ID === room.ID));

    const filteredRooms = rooms.filter(room => {
        if (privacyFilter === 'all') return true;
        if (privacyFilter === 'public') return !room.IsPrivate;
        if (privacyFilter === 'private') return room.IsPrivate;
        return true;
    });

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <Navbar />

            <main className="pt-24 sm:pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 lg:mb-12">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-normal text-white">Your Rooms</h1>
                        <p className="text-white/50 text-base sm:text-lg">Explore and manage your chat communities.</p>
                    </div>

                    <button
                        className="group relative w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Plus size={20} />
                            Create Group
                        </span>
                        <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col md:flex-row gap-6 mb-8 lg:mb-12 items-start md:items-center justify-between border-b border-white/10 pb-8">
                    {/* Tab Switcher */}
                    <div className="flex w-full md:w-auto bg-neutral-900/50 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'available' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                        >
                            Available
                        </button>
                        <button
                            onClick={() => setActiveTab('joined')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'joined' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                        >
                            Joined
                        </button>
                    </div>

                    {/* Privacy Filter */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
                        <span className="text-sm font-medium text-white/30 w-full sm:w-auto">Filter by:</span>
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                            {(['all', 'public', 'private'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setPrivacyFilter(filter)}
                                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize ${privacyFilter === filter ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'}`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Auth Guard for Groups */}
                {!user && !isInitializing ? (
                    <div className="text-center py-20 bg-neutral-900/30 rounded-[40px] border border-dashed border-white/10 flex flex-col items-center justify-center space-y-8">
                        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-110">
                            <Lock size={40} className="text-white/20" />
                        </div>
                        <div className="space-y-4 max-w-md mx-auto">
                            <h2 className="text-3xl font-bold tracking-tight">Login Required</h2>
                            <p className="text-white/40 text-lg leading-relaxed">
                                You need to be logged in to explore and join chat communities. Join the conversation today!
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full px-6 sm:px-0 sm:w-auto">
                            <button
                                onClick={() => {
                                    setAuthMode('login');
                                    setIsAuthModalOpen(true);
                                }}
                                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/5"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => {
                                    setAuthMode('signup');
                                    setIsAuthModalOpen(true);
                                }}
                                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-full border border-white/10 transition-all text-sm uppercase tracking-widest"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                ) : loading && !joiningId && filteredRooms.length === 0 ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : filteredRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <ElectricBorder key={room.ID} borderRadius={24} className="h-full">
                                <div className="bg-neutral-900/50 backdrop-blur-sm p-8 rounded-[24px] h-full flex flex-col border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
                                            {room.Image ? (
                                                <img src={room.Image} alt={room.Name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Hash className="text-white/70" size={24} />
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/50 border border-white/10">
                                                {room.IsPrivate ? 'Private' : 'Public'}
                                            </span>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                                                    {room.online_count || 0} Online
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium text-white/30">
                                                {room.MemberCount}/{room.MaxMembers} 
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-white transition-colors">
                                        {room.Name}
                                    </h3>

                                    <p className="text-white/50 text-sm mb-6 grow line-clamp-2">
                                        {room.Description || "No description provided for this room."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-white/40 text-sm">
                                            <Users size={16} />
                                            <span>{room.Topic || "General"}</span>
                                        </div>
                                        <button
                                            disabled={joiningId === room.ID || (activeTab === 'available' && room.IsPrivate)}
                                            className={`font-bold text-sm hover:underline underline-offset-4 transition-all disabled:opacity-50 flex items-center gap-2 ${activeTab === 'available' && room.IsPrivate ? 'text-white/50 cursor-not-allowed hover:no-underline' : 'text-white'}`}
                                            onClick={() => activeTab === 'joined' ? navigate(`/rooms/${room.ID}`) : handleJoinRoom(room.ID)}
                                            title={activeTab === 'available' && room.IsPrivate ? "An invite link is required to join private groups." : ""}
                                        >
                                            {joiningId === room.ID ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : activeTab === 'joined' ? (
                                                'Open Chat'
                                            ) : room.IsPrivate ? (
                                                <>
                                                    <Lock size={14} />
                                                    Needs Link
                                                </>
                                            ) : (
                                                'Join Room'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </ElectricBorder>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-neutral-900/30 rounded-[40px] border border-dashed border-white/10">
                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users size={32} className="text-white/20" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No rooms found</h2>
                        <p className="text-white/40 mb-8 max-w-md mx-auto">
                            {activeTab === 'joined'
                                ? "You haven't joined any groups matching these filters yet."
                                : "No available groups found matching these filters."}
                        </p>
                        {activeTab === 'available' && privacyFilter === 'all' && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-white font-medium underline underline-offset-4 hover:text-white/80 transition-colors"
                            >
                                Create your first room
                            </button>
                        )}
                    </div>
                )}
            </main>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refreshAll()}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />
        </div>
    );
};

export default Rooms;
