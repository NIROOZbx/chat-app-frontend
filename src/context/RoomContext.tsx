
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../lib/api';

interface Room {
    ID: number;
    Name: string;
    Description: string;
    Topic: string;
    IsPrivate: boolean;
    MaxMembers: number;
    Image?: string;
    InviteCode?: string | null;
    CreatedAt: string;
    UpdatedAt: string;
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
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
    const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true); // Default to true for initial mount

    const fetchAllRooms = async () => {
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
        refreshAll();
    }, []);

    return (
        <RoomContext.Provider value={{
            availableRooms,
            joinedRooms,
            loading,
            fetchAllRooms,
            fetchJoinedRooms,
            refreshAll,
            joinRoom,
            leaveRoom
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
