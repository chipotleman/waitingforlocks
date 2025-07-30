# LOCKS SOLD - Queue Management System

## Overview

This is a full-stack TypeScript application built for managing a waitlist/queue system for LOCKS SOLD Shopify drops. The system allows users to hold their spot in line before drops that typically sell out in 60 seconds. Features include dynamic queue growth, real-time position tracking, and a comprehensive admin backend for managing drops and viewing queue entries.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 30, 2025)

✓ Rebranded from HYPEDROP to LOCKS SOLD
✓ Changed "GET IN LINE" to "HOLD YOUR SPOT" 
✓ Removed queue spots remaining display and max queue time concept
✓ Updated messaging: website will change to actual store at drop time
✓ Users get 5 minutes guaranteed access window after joining queue
✓ Updated sellout time to consistent 47 seconds everywhere
✓ Changed queue size to realistic 283 instead of exact 300
✓ Removed "stay on site" warnings - now explains website transition
✓ Updated all explanatory text to emphasize guaranteed 5-minute access window
✓ Added PostgreSQL database with Drizzle ORM
✓ Implemented dynamic queue growth (adds 1 person every 20-30 seconds in hour before drop)
✓ Created comprehensive admin dashboard at /admin
✓ Added drop management system with CRUD operations
✓ Enhanced countdown timer to use active drop times
✓ Built queue entries viewer for admin oversight
✓ Fixed all text visibility issues on dark background
✓ Implemented Instagram story sharing feature - users move up 100 spots by sharing post
✓ Replaced gaming system with social media engagement boost
✓ Added Instagram username verification with 2-3 second loading delay
✓ Changed header badge to "DROPPING SOON!" 
✓ Updated headline to "This will guarantee you a spot for the first 5 minutes of our drop!"
✓ Removed notifications checkbox from registration form
✓ Added "How does it work?" button with smooth scroll to explanation section
✓ Created comprehensive FAQ and process explanation at bottom of page
✓ Added password protection to admin panel (password: "MiamiHeat123")
✓ Fixed database integration - users now properly saved to PostgreSQL database
✓ Added Instagram username capture during verification process  
✓ Implemented email masking for privacy (shows "ma***@domain.com" format)
✓ Fixed queue size consistency - always shows mock base of 283 plus real users
✓ Real users start at position 284+ to maintain realistic queue appearance
✓ Fixed mobile countdown timer display - proper responsive sizing and spacing
✓ Prepared complete Vercel deployment package with optimized configuration
✓ Ready for custom domain deployment at waitingforlocks.com

## CHECKPOINT: Full-Stack Application Complete (January 30, 2025)

The queue management system is fully functional with:
- PostgreSQL database integration with proper schema
- Instagram verification with username capture and 100-spot boost
- Email masking for privacy ("ma***@domain.com" format) 
- Consistent queue display with mock base of 283 + real users
- Password-protected admin panel (password: "MiamiHeat123")
- Real-time countdown timer and queue stats
- Scrollable queue list with 15 mock users for realistic appearance
- All database operations working (create, read, update)
- Instagram boost properly saves usernames and updates positions

## PROJECT DECISION: Keep Full-Stack Application (January 30, 2025)

Decision made to keep the current full-stack Node.js/React application instead of converting to Shopify theme. The application provides:
- Real database functionality with PostgreSQL
- Comprehensive admin panel with full control
- Instagram verification with username capture
- Real-time queue management capabilities
- Can be deployed independently and integrated with any e-commerce platform

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and bundling
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Validation**: Zod schemas for API request/response validation

### UI Component System
- **Design System**: shadcn/ui components built on Radix UI primitives
- **Theme**: "New York" style with neutral base colors
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Icons**: Lucide React icon library

## Key Components

### Database Schema
- **Queue Entries Table**: Stores user queue information including email, phone (optional), position, notification preferences, and join timestamp
- **UUID Primary Keys**: Uses PostgreSQL's `gen_random_uuid()` for unique identifiers
- **Unique Email Constraint**: Prevents duplicate queue entries

### API Endpoints
- `GET /api/queue/stats` - Retrieves queue statistics and top entries
- `POST /api/queue/join` - Adds a user to the queue
- `GET /api/queue/position/:email` - Gets specific user's queue position (implied from frontend code)

### Frontend Pages
- **Home Page**: Main queue interface with join form and statistics
- **Not Found**: 404 error page
- **Toast Notifications**: User feedback system for actions

### Storage Layer
- **Development**: In-memory storage with mock data (287 pre-populated entries)
- **Production**: PostgreSQL database via Drizzle ORM
- **Queue Limit**: Maximum 300 people in queue

## Data Flow

1. **Queue Statistics**: Frontend fetches current queue stats on load
2. **User Registration**: Form submission validates data, checks queue capacity, and adds user
3. **Position Tracking**: Users can check their position and estimated wait time
4. **Real-time Updates**: Countdown timer and periodic queue stat refreshes
5. **Error Handling**: Comprehensive error handling with user-friendly messages

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React 18, React DOM, React Hook Form)
- Express.js for server framework
- Drizzle ORM with PostgreSQL driver

### UI Dependencies
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Lucide React for icons
- shadcn/ui component library

### Development Tools
- Vite for build tooling and development server
- TypeScript for type safety
- ESBuild for production bundling
- Replit-specific plugins for development environment

### Database & Validation
- Neon Database for PostgreSQL hosting
- Zod for schema validation
- Drizzle Kit for database migrations

## Deployment Strategy

### Development
- **Hot Reload**: Vite development server with HMR
- **API Proxy**: Express server runs alongside Vite dev server
- **Mock Data**: In-memory storage with pre-populated queue entries
- **Environment**: NODE_ENV=development

### Production
- **Build Process**: Vite builds frontend assets, ESBuild bundles server code
- **Static Assets**: Frontend built to `dist/public` directory
- **Server Bundle**: Backend compiled to `dist/index.js`
- **Database**: Requires DATABASE_URL environment variable for PostgreSQL connection
- **Session Storage**: PostgreSQL-based session storage with connect-pg-simple

### Configuration
- **TypeScript**: Strict mode enabled with modern ES features
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)
- **Database Migrations**: Managed through Drizzle Kit with schema in `/shared`
- **Environment Variables**: DATABASE_URL required for database connectivity

The application follows a monorepo structure with shared TypeScript definitions between frontend and backend, ensuring type safety across the full stack.