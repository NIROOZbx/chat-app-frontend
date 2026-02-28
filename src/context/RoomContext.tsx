
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../lib/api';
import { useAuth } from './AuthContext';

export interface Room {
    ID: number;
    Name: string;
    Description: string;
    Topic: string;
    IsPrivate: boolean;
    MaxMembers: number;
    Image?: string;
    InviteCode?: string | null;
    UpdatedAt: string;
    online_count?: number;
    user_role?: string;
    MemberCount?:number;
}

interface RoomContextType {
    availableRooms: Room[];
    joinedRooms: Room[];
    loading: boolean;
    fetchAllRooms: () => Promise<void>;
    fetchJoinedRooms: () => Promise<void>;
    refreshAll: () => Promise<void>;
    joinRoom: (roomId: number) => Promise<void>;
    leaveRoom: (roomId: number) => Promise<void>;
    fetchRoomById: (id: number) => Promise<Room | null>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true); // Default to true for initial mount

    const fetchAllRooms = async () => {
        if (!user) {
            setAvailableRooms([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.get('/rooms/');
            setAvailableRooms(response.data.data || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJoinedRooms = async () => {
        if (!user) {
            setJoinedRooms([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.get('/rooms/joined');
            setJoinedRooms(response.data.data || []);
        } catch (error) {
            console.error('Error fetching joined rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshAll = async () => {
        if (!user) {
            setAvailableRooms([]);
            setJoinedRooms([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            await Promise.all([
                apiClient.get('/rooms/').then(res => setAvailableRooms(res.data.data || [])),
                apiClient.get('/rooms/joined').then(res => setJoinedRooms(res.data.data || []))
            ]);
        } catch (error) {
            console.error('Error refreshing rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = async (roomId: number) => {
        setLoading(true);
        try {
            await apiClient.post(`/rooms/join/${roomId}`);
            await refreshAll();
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchRoomById = async (id: number): Promise<Room | null> => {
        if (!user) return null;
        try {
            const response = await apiClient.get(`/rooms/${id}`);
            if (response.data.success) {
                const { room, online_count, user_role } = response.data.data;
                return { ...room, online_count, user_role };
            }
            return null;
        } catch (error) {
            console.error('Error fetching room details:', error);
            return null;
        }
    };

    const leaveRoom = async (roomId: number) => {
        setLoading(true);
        try {
            await apiClient.delete(`/rooms/leave/${roomId}`);
            await refreshAll();
        } catch (error) {
            console.error('Error leaving room:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            refreshAll();
        }
    }, [user]);

    return (
        <RoomContext.Provider value={{
            availableRooms,
            joinedRooms,
            loading,
            fetchAllRooms,
            fetchJoinedRooms,
            refreshAll,
            joinRoom,
            leaveRoom,
            fetchRoomById
        }}>
            {children}
        </RoomContext.Provider>
    );
};

export const useRooms = () => {
    const context = useContext(RoomContext);
    if (context === undefined) {
        throw new Error('useRooms must be used within a RoomProvider');
    }
    return context;
};
