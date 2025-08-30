import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';

const ChatContext = createContext<ReturnType<typeof useSocket> | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const socketData = useSocket();

  return (
    <ChatContext.Provider value={socketData}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}