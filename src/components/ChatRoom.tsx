import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSocket, Message } from '../hooks/useSocket';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { UserList } from './UserList';
import { RoomSelector } from './RoomSelector';

export function ChatRoom() {
  const { user, signOut } = useAuth();
  const {
    connected,
    messages,
    connectedUsers,
    typingUsers,
    currentRoom,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
  } = useSocket();

  const [messageInput, setMessageInput] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && currentRoom) {
      sendMessage(messageInput);
      setMessageInput('');
      stopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Handle typing indicators
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!currentRoom) {
    return <RoomSelector onRoomSelect={joinRoom} />;
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 w-80 flex flex-col ${showUserList ? 'block' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Chat Rooms</h2>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
        </div>

        <UserList users={connectedUsers} connected={connected} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">General Chat</h1>
              <p className="text-sm text-gray-600">
                {connected ? `${connectedUsers.length} users online` : 'Connecting...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.user_id === user?.id}
            />
          ))}
          
          <TypingIndicator typingUsers={typingUsers} currentUserEmail={user?.email || ''} />
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!connected || !messageInput.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}