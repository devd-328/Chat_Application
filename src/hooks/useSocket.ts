import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  content: string;
  user_id: string;
  room_id: string;
  created_at: string;
  profiles: {
    email: string;
  };
}

export interface ConnectedUser {
  id: string;
  email: string;
  socketId: string;
}

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);

  useEffect(() => {
  console.log("Auth user in useSocket:", user);
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL); // Add this line temporarily
  console.log("Current window location:", window.location.origin); // Add this line
  
    if (!user) {
      // If no user, ensure socket is disconnected and reset state
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setConnected(false);
      setMessages([]);
      setConnectedUsers([]);
      setTypingUsers(new Set());
      setCurrentRoom(null);
      return;
    }

    // Initialize socket connection
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    socketRef.current = io(backendUrl);

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      // Join with user data
      socket.emit('user_join', {
        userId: user.id,
        email: user.email,
      });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('users_updated', (users: ConnectedUser[]) => {
      setConnectedUsers(users);
    });

    socket.on('room_messages', (roomMessages: Message[]) => {
      setMessages(roomMessages);
    });

    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user_typing', (userData: { userId: string; email: string }) => {
      setTypingUsers(prev => new Set([...prev, userData.email]));
    });

    socket.on('user_stopped_typing', (userData: { userId: string; email: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userData.email);
        return newSet;
      });
    });

    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user]);

  const joinRoom = (roomId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('join_room', roomId);
      setCurrentRoom(roomId);
      setMessages([]);
    }
  };

  const sendMessage = (content: string) => {
    if (socketRef.current && connected && content.trim()) {
      socketRef.current.emit('send_message', { content: content.trim() });
    }
  };

  const startTyping = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_start');
    }
  };

  const stopTyping = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing_stop');
    }
  };

  return {
    connected,
    messages,
    connectedUsers,
    typingUsers,
    currentRoom,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
  };
}