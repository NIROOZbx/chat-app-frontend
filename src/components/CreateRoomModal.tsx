import React, { useState, useRef } from 'react';
import { X, Upload, Check, Loader2 } from 'lucide-react';
import apiClient from '../lib/api';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        topic: '',
        is_private: false,
        max_members: 50,
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

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
        setLoading(true);
        setError(null);

        if (!image) {
            setError("Please select an image for the group.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('topic', formData.topic);
        data.append('is_private', String(formData.is_private));
        data.append('max_members', String(formData.max_members));
        data.append('image', image);

        try {
            await apiClient.post('/rooms/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating room:', err);
            setError(err.response?.data?.message || 'Failed to create room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold tracking-normal  text-white">Create New Group</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X size={24} className="text-white/50" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/50 px-1">Group Name</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Design Explorers"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/50 px-1">Topic</label>
                                <input
                                    required
                                    type="text"
                                    name="topic"
                                    value={formData.topic}
                                    onChange={handleInputChange}
                                    placeholder="e.g. UI/UX Design"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/50 px-1">Description</label>
                            <textarea
                                required
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="What is this group about?"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/50 px-1">Max Members</label>
                                <input
                                    type="number"
                                    name="max_members"
                                    min="2"
                                    max="50"
                                    value={formData.max_members}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/50 px-1">Room Privacy</label>
                                <div className="relative w-full bg-black border border-white/10 rounded-2xl p-1 flex items-center cursor-pointer select-none">
                                    <div
                                        className={`
                      absolute w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-xl transition-all duration-300 ease-out
                      ${formData.is_private ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}
                    `}
                                    />

                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_private: false }))}
                                        className={`
                      relative z-10 flex-1 py-2 text-center text-sm font-bold transition-colors duration-300
                      ${!formData.is_private ? 'text-black' : 'text-white/50 hover:text-white'}
                    `}
                                    >
                                        Public
                                    </div>

                                    <div
                                        onClick={() => setFormData(prev => ({ ...prev, is_private: true }))}
                                        className={`
                      relative z-10 flex-1 py-2 text-center text-sm font-bold transition-colors duration-300
                      ${formData.is_private ? 'text-black' : 'text-white/50 hover:text-white'}
                    `}
                                    >
                                        Private
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white/50 px-1">Group Image</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                  relative h-40 border-2 border-dashed rounded-[24px] cursor-pointer
                  flex flex-col items-center justify-center transition-all overflow-hidden
                  ${imagePreview ? 'border-white/20' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}
                `}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <p className="text-white font-medium flex items-center gap-2">
                                                <Upload size={18} />
                                                Change Image
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Upload size={24} className="text-white/30" />
                                        </div>
                                        <p className="text-white/40 text-sm">Click to upload image</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm px-1">{error}</p>
                        )}

                        <div className="pt-4">
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Create Group
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

export default CreateRoomModal;
