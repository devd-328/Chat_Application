import React from 'react';
import { Message } from '../hooks/useSocket';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <p className="text-xs text-gray-500 mb-1 px-3">
            {message.profiles.email}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-200 text-gray-900 rounded-bl-md'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}