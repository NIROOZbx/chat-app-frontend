
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Check, Loader2, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [username, setUsername] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { login, signup, isSubmitting } = useAuth();

    // Sync mode if initialMode changes while modal is closed or on first open
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [isOpen, initialMode]);

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (mode === 'signup') {
                const data = new FormData();
                data.append('user_name', username);
                if (image) {
                    data.append('profile_image', image);
                }
                await signup(data);
            } else {
                await login(username);
            }
            onClose();
            navigate('/rooms');
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.response?.data?.message || `Failed to ${mode}. Please try again.`);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X size={20} className="sm:w-6 sm:h-6 text-white/50" />
                        </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex bg-black/50 p-1 rounded-xl sm:rounded-2xl border border-white/5 mb-6 sm:mb-8">
                        <button
                            onClick={() => setMode('login')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <LogIn size={14} className="sm:w-4 sm:h-4" />
                            Login
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${mode === 'signup' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            <UserPlus size={14} className="sm:w-4 sm:h-4" />
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'signup' && (
                            <div className="flex flex-col items-center mb-2">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/10 hover:border-white/20 cursor-pointer flex items-center justify-center overflow-hidden transition-all group"
                                >
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={32} className="text-white/20 group-hover:text-white/40 transition-colors" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={18} className="text-white" />
                                    </div>
                                </div>
                                <p className="text-xs text-white/40 mt-3 font-medium">Profile Image (optional)</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-white/50 px-1">Username</label>
                            <input
                                required
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={mode === 'login' ? "Enter your username" : "Choose a unique name"}
                                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-center text-base sm:text-lg font-semibold"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm px-1 text-center">{error}</p>
                        )}

                        <div className="pt-2 sm:pt-4">
                            <button
                                disabled={isSubmitting || !username}
                                type="submit"
                                className="w-full bg-white text-black font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {mode === 'login' ? 'Logging in...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        {mode === 'login' ? 'Login' : 'Get Started'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
