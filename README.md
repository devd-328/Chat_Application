# RealTime Chat Application
In progress there are some erros!!

A comprehensive real-time chat application built with React, Node.js, Socket.IO, and Supabase.

## Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **User Authentication**: Secure email/password authentication with Supabase
- **Multiple Chat Rooms**: Create and join different chat rooms
- **Message Persistence**: All messages are stored in Supabase database
- **Online Status**: See who's currently online
- **Typing Indicators**: Real-time typing notifications
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Message History**: Access to previous messages when joining rooms

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **Supabase JS** for database operations and authentication
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket connections
- **Supabase** for database and authentication
- **CORS** for cross-origin requests

### Database
- **Supabase (PostgreSQL)** with Row Level Security
- **Real-time subscriptions** for live updates
- **Optimized indexes** for performance

## Project Structure

```
├── server/
│   └── index.js                 # Express + Socket.IO server
├── src/
│   ├── components/
│   │   ├── AuthForm.tsx         # Login/Register form
│   │   ├── ChatRoom.tsx         # Main chat interface
│   │   ├── MessageBubble.tsx    # Individual message component
│   │   ├── TypingIndicator.tsx  # Shows typing users
│   │   ├── UserList.tsx         # Online users sidebar
│   │   └── RoomSelector.tsx     # Room selection interface
│   ├── contexts/
│   │   └── ChatContext.tsx      # Chat state management
│   ├── hooks/
│   │   ├── useAuth.ts           # Authentication logic
│   │   └── useSocket.ts         # Socket.IO integration
│   ├── lib/
│   │   └── supabase.ts          # Supabase client setup
│   └── App.tsx                  # Main application component
├── supabase/migrations/
│   └── create_chat_schema.sql   # Database schema
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account

### Database Setup
1. Create a new Supabase project
2. Click "Connect to Supabase" button in the top right to configure the connection
3. The database schema will be automatically applied via migrations

### Local Development
1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development servers:
   ```bash
   npm run dev
   ```
   This starts both the frontend (port 5173) and backend (port 3001) servers

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

## Key Features Implementation

### Real-time Communication
- Socket.IO handles WebSocket connections between clients and server
- Messages are broadcast to all users in the same room
- Typing indicators show when users are actively typing
- Online/offline status is tracked via socket connections

### Security
- Row Level Security (RLS) enabled on all database tables
- Authentication required for all chat operations
- User can only send messages as themselves
- All database queries are protected by Supabase policies

### Message Persistence
- All messages are stored in Supabase with timestamps
- Message history is loaded when joining a room
- Efficient pagination for large chat histories
- Optimized database queries with proper indexing

### User Management
- Automatic profile creation on user registration
- Real-time user list updates
- Last seen timestamps
- Email-based user identification

## API Endpoints

### REST API
- `GET /api/health` - Server health check
- `GET /api/rooms` - Get all available chat rooms
- `POST /api/rooms` - Create a new chat room

### Socket.IO Events
- `user_join` - User connects to chat
- `join_room` - User joins a specific room
- `send_message` - Send a new message
- `typing_start/stop` - Typing indicator events
- `new_message` - Receive new messages
- `users_updated` - User list updates

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the server to your preferred hosting platform
3. Configure environment variables in production
4. Ensure Supabase project is configured for production use

## Security Considerations

- All user input is validated and sanitized
- Database queries use parameterized statements
- Row Level Security prevents unauthorized data access
- CORS is properly configured for production
- Authentication tokens are handled securely

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Test thoroughly in both development and production modes
5. Submit a pull request

## License

MIT License - see LICENSE file for details
