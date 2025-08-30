import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Store connected users
const connectedUsers = new Map();
const userRooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('user_join', async (userData) => {
    try {
      connectedUsers.set(socket.id, {
        id: userData.userId,
        email: userData.email,
        socketId: socket.id
      });

      // Broadcast updated user list
      const userList = Array.from(connectedUsers.values());
      io.emit('users_updated', userList);
      
      console.log('User joined:', userData.email);
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  });

  // Handle joining a room
  socket.on('join_room', async (roomId) => {
    try {
      socket.join(roomId);
      userRooms.set(socket.id, roomId);
      
      // Get room messages from Supabase
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      socket.emit('room_messages', messages || []);
      
      // Notify room about new user
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.to(roomId).emit('user_joined_room', {
          userId: user.id,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Handle sending messages
  socket.on('send_message', async (messageData) => {
    try {
      const user = connectedUsers.get(socket.id);
      const roomId = userRooms.get(socket.id);
      
      if (!user || !roomId) {
        socket.emit('error', 'User not authenticated or not in a room');
        return;
      }

      // Save message to Supabase
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          content: messageData.content,
          user_id: user.id,
          room_id: roomId
        })
        .select(`
          *,
          profiles:user_id (email)
        `)
        .single();

      if (error) {
        console.error('Error saving message:', error);
        socket.emit('error', 'Failed to send message');
        return;
      }

      // Broadcast message to room
      io.to(roomId).emit('new_message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle user typing
  socket.on('typing_start', () => {
    const user = connectedUsers.get(socket.id);
    const roomId = userRooms.get(socket.id);
    
    if (user && roomId) {
      socket.to(roomId).emit('user_typing', {
        userId: user.id,
        email: user.email
      });
    }
  });

  socket.on('typing_stop', () => {
    const user = connectedUsers.get(socket.id);
    const roomId = userRooms.get(socket.id);
    
    if (user && roomId) {
      socket.to(roomId).emit('user_stopped_typing', {
        userId: user.id,
        email: user.email
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    const roomId = userRooms.get(socket.id);
    
    if (user && roomId) {
      socket.to(roomId).emit('user_left_room', {
        userId: user.id,
        email: user.email
      });
    }
    
    connectedUsers.delete(socket.id);
    userRooms.delete(socket.id);
    
    // Broadcast updated user list
    const userList = Array.from(connectedUsers.values());
    io.emit('users_updated', userList);
    
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Get available chat rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(rooms || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new chat room
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        description: description || ''
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});