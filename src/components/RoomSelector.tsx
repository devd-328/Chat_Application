import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by?: string;
}

interface RoomSelectorProps {
  onRoomSelect: (roomId: string) => void;
}

export function RoomSelector({ onRoomSelect }: RoomSelectorProps) {
  const { user, session } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
        setError('Failed to load rooms');
        return;
      }

      setRooms(rooms || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

const handleCreateRoom = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validation checks
  if (!user || !session) {
    setError('You must be logged in to create a room');
    return;
  }

  if (!newRoomName.trim()) {
    setError('Room name is required');
    return;
  }

  if (newRoomName.trim().length < 2) {
    setError('Room name must be at least 2 characters long');
    return;
  }

  setCreating(true);
  setError(null);

  try {
    console.log('Creating room with user:', user.id, user.email);

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert([
        {
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || null,
          created_by: user.id,
        }
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error creating room:', error);
      
      // Handle specific error types
      if (error.code === 'PGRST116') {
        setError('Room name already exists. Please choose a different name.');
      } else if (error.code === '42501') {
        setError('Permission denied. Please check your account permissions.');
      } else if (error.message.includes('unique')) {
        setError('Room name already exists. Please choose a different name.');
      } else {
        setError(`Failed to create room: ${error.message}`);
      }
      return;
    }

    console.log('Room created successfully:', data);

    // Success - reset form and refresh
    setNewRoomName('');
    setNewRoomDescription('');
    setShowCreateForm(false);
    setError(null);
    
    // Refresh the rooms list
    await fetchRooms();

  } catch (error) {
    console.error('Unexpected error creating room:', error);
    setError(error instanceof Error ? error.message : 'An unexpected error occurred while creating the room');
  } finally {
    setCreating(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Select a Chat Room</h1>
          <p className="text-gray-600 mt-2">Choose a room to start chatting</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Room
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  id="roomName"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter room name"
                  required
                  disabled={creating}
                />
              </div>
              <div>
                <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter room description"
                  rows={3}
                  disabled={creating}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={creating || !newRoomName.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Room'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewRoomName('');
                    setNewRoomDescription('');
                    setError(null);
                  }}
                  disabled={creating}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg cursor-pointer transition-all hover:scale-105"
            >
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">{room.description}</p>
              <div className="flex items-center text-xs text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                <span>Click to join</span>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && !loading && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No chat rooms yet</h3>
            <p className="text-gray-500">Create the first chat room to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}