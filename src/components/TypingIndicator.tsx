import React from 'react';

interface TypingIndicatorProps {
  typingUsers: Set<string>;
  currentUserEmail: string;
}

export function TypingIndicator({ typingUsers, currentUserEmail }: TypingIndicatorProps) {
  const otherTypingUsers = Array.from(typingUsers).filter(email => email !== currentUserEmail);
  
  if (otherTypingUsers.length === 0) return null;

  const getTypingText = () => {
    if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0]} is typing...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
    } else {
      return `${otherTypingUsers.length} users are typing...`;
    }
  };

  return (
    <div className="flex justify-start">
      <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
        <p className="text-sm text-gray-600 italic">{getTypingText()}</p>
        <div className="flex space-x-1 mt-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}