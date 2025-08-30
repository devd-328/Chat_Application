import React from 'react';
import { Users, Circle } from 'lucide-react';
import { ConnectedUser } from '../hooks/useSocket';

interface UserListProps {
  users: ConnectedUser[];
  connected: boolean;
}

export function UserList({ users, connected }: UserListProps) {
  return (
    <div className="flex-1 p-4">
      <div className="flex items-center mb-4">
        <Users className="w-5 h-5 text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-900">
          Online Users ({users.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.socketId} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Circle className="w-3 h-3 text-green-500 fill-current mr-3" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              {connected ? 'No users online' : 'Connecting...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}