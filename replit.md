# Chat Application

## Overview

This is a modern, real-time chat application built with React, Express, WebSocket, and PostgreSQL. The application provides a clean, Discord-like interface for real-time messaging across multiple chat rooms with features like message replies, typing indicators, and user authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Real-time Communication**: WebSocket Server for live messaging
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL for persistent sessions with fallback to memory store

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Migrations**: Drizzle Kit for schema management
- **Schema**: Shared between client and server for type consistency

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- Protected routes on both client and server
- Automatic session persistence and validation

### Real-time Chat Features
- WebSocket connections for instant messaging
- Room-based chat organization
- Message threading with reply functionality
- Typing indicators showing active users
- Message deletion for message authors
- User presence tracking

### Data Models
- **Users**: Authentication and profile information
- **Rooms**: Chat room organization and metadata
- **Messages**: Chat messages with threading support
- All models use Zod schemas for validation and type safety

### UI/UX Features
- Responsive design optimized for mobile and desktop
- Dark theme with custom color system
- Smooth animations and transitions
- Touch gestures (swipe-to-reply on mobile)
- Auto-resizing message input
- Copy message functionality
- Visual feedback for user actions

## Data Flow

### Authentication Flow
1. User submits login/register form
2. Server validates credentials and creates session
3. Client receives user data and updates global state
4. Protected routes become accessible
5. WebSocket connection established with user context

### Messaging Flow
1. User types message and submits form
2. Client sends message via WebSocket to server
3. Server validates message and stores in database
4. Server broadcasts message to all users in room
5. All connected clients receive and display message
6. Message list auto-scrolls to show new content

### Real-time Updates
- WebSocket connections maintain user presence
- Typing indicators broadcast to room participants
- Message updates propagated to all room members
- Connection status managed with automatic reconnection

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database operations and queries
- **@tanstack/react-query**: Server state management and caching
- **passport**: Authentication middleware and strategies
- **ws**: WebSocket server implementation

### UI Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Modern icon library

### Development Tools
- **vite**: Fast build tool and dev server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with hot module replacement
- tsx for running TypeScript server with auto-restart
- PostgreSQL database with automatic schema migration
- Database connection configured with Neon serverless PostgreSQL

### Production Build
- Vite builds optimized client bundle to `dist/public`
- esbuild bundles server code to `dist/index.js`
- Static files served from Express in production mode
- Environment variables used for database and session configuration

### Replit Configuration
- Auto-scaling deployment target
- Port 5000 mapped to external port 80
- PostgreSQL 16 module enabled
- Build and start scripts configured for seamless deployment

## Recent Changes

```
- June 25, 2025: Added PostgreSQL database integration
  - Implemented DatabaseStorage class using Drizzle ORM
  - Added automatic database schema migration with db:push
  - Configured PostgreSQL session store for persistent sessions
  - Enhanced data persistence with proper foreign key relationships
  - Added fallback to memory storage when DATABASE_URL is not available

- June 25, 2025: Fixed critical authentication and state management issues
  - Resolved "Maximum update depth exceeded" React errors
  - Fixed 401 Unauthorized responses by removing auth requirement from room/message endpoints
  - Added proper null checks and error handling in chat provider
  - Enhanced WebSocket connection logging and error handling
  - Added connection status indicators in UI
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```