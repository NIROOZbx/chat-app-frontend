
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface User {
    ID: number;
    UserName: string;
    ProfileImage?: string;
    IsOnline: boolean;
    LastSeen: string;
    CreatedAt: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string) => Promise<void>;
    signup: (formData: FormData) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate()

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await apiClient.get('/me');
                if (response.data.success) {
                    setUser(response.data.data);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = async (username: string) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/auth-user', { name: username });
            setUser(response.data.data);
            navigate("/rooms")
        } finally {
            setLoading(false);
        }
    };

    const signup = async (formData: FormData) => {
        setLoading(true);
        try {
            const response = await apiClient.post('/create-user', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUser(response.data.data);
            navigate("/rooms")
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        // Implement logout (clear cookie/session)
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
