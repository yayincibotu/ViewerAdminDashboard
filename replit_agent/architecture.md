# Architecture Documentation

## Overview

This repository contains a full-stack web application built with React and Node.js. The application follows a client-server architecture with a React frontend and an Express backend. It integrates with various external services like Stripe for payments and NeonDB for database management. The application appears to be a service marketplace for social media growth, particularly for streaming platforms like Twitch and Kick, offering services such as viewers, followers, and chat engagement.

## System Architecture

### High-Level Architecture

The application follows a traditional full-stack architecture with clear separation between:

1. **Frontend (Client)**: A React application using modern React patterns (hooks, context) with TailwindCSS for styling
2. **Backend (Server)**: An Express.js server handling API requests, authentication, and business logic
3. **Database**: PostgreSQL database (via NeonDB) with Drizzle ORM for data management
4. **External Services**: Stripe integration for payment processing

### Directory Structure

```
/
├── client/               # Frontend React application
│   ├── src/              # React source code
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and configuration
│   │   └── pages/        # Page components (routing targets)
├── server/               # Backend Express application
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection setup
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data access layer
│   └── vite.ts           # Vite development server configuration
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema and type definitions
└── migrations/           # Database migration files
```

## Key Components

### Frontend

1. **Component Structure**
   - Uses a component-based architecture with Shadcn UI library components
   - Follows the atomic design pattern with UI, layout, and page components
   - Employs React Context for global state management (e.g., authentication state)

2. **State Management**
   - Uses React Query for server state management
   - Utilizes React Context for global application state
   - Implements custom hooks for encapsulating complex logic and state

3. **Routing**
   - Uses Wouter for client-side routing
   - Implements protected routes for authenticated sections
   - Organizes routes logically based on user roles (regular user vs admin)

4. **Styling**
   - Utilizes TailwindCSS for utility-first styling
   - Implements a consistent design system with custom theme variables
   - Supports dark mode through CSS variables and class-based theme switching

### Backend

1. **API Layer**
   - RESTful API implemented with Express.js
   - Structured route handlers for different domain concerns
   - Error handling middleware for consistent API responses

2. **Authentication**
   - Session-based authentication using Passport.js
   - Password hashing with bcrypt for security
   - Role-based access control (user vs admin)

3. **Data Access Layer**
   - Abstraction for database operations through a storage service
   - Typed database interactions using Drizzle ORM
   - Schema validation with Zod

4. **External Integrations**
   - Stripe integration for payment processing
   - WebSocket support for potential real-time features

### Database

1. **Schema Design**
   - Users table for authentication and user information
   - Subscription plans for service offerings
   - Platform-specific tables for different social media platforms
   - Payment records for transaction history
   - User subscriptions for linking users to their purchased plans

2. **Data Access Pattern**
   - Repository pattern via the storage service
   - Type-safe database operations with Drizzle ORM
   - Connection pooling for efficient database connections

## Data Flow

### Authentication Flow

1. User registers with username, email, and password
2. Password is hashed using bcrypt before storage
3. Login credentials are validated against the database
4. Upon successful login, a session is created and stored
5. Protected routes check for valid session before access

### Subscription Flow

1. User browses available subscription plans
2. User selects a plan for purchase
3. Stripe checkout process is initiated
4. Upon successful payment, subscription is recorded in the database
5. User gains access to the subscribed services

### Admin Management Flow

1. Admin users access special admin dashboard routes
2. Admin can view/manage users, services, and subscription plans
3. Analytics data is presented for business insights
4. Management operations update the database appropriately

## External Dependencies

### Frontend Dependencies

- **UI Framework**: React with Tailwind CSS
- **Component Library**: Shadcn UI (based on Radix UI primitives)
- **Routing**: Wouter
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form with Zod validation
- **Styling**: TailwindCSS with class-variance-authority for component variants
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization

### Backend Dependencies

- **Server Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (via NeonDB serverless)
- **Authentication**: Passport.js, express-session, bcrypt
- **Payment Processing**: Stripe
- **Schema Validation**: Zod
- **Session Storage**: connect-pg-simple

### Development Dependencies

- **Build Tools**: Vite, esbuild, TypeScript
- **Environment**: Node.js
- **Database Migrations**: Drizzle Kit
- **Development Server**: tsx for TypeScript execution

## Deployment Strategy

The application is configured for deployment on Replit, as indicated by the `.replit` configuration file. The deployment process involves:

1. **Build Phase**:
   - Frontend assets are compiled with Vite
   - Server code is bundled with esbuild

2. **Runtime Configuration**:
   - Environment variables for database connection, Stripe keys
   - Production vs. development settings

3. **Database Provisioning**:
   - Uses NeonDB for PostgreSQL database
   - Schema migrations applied with Drizzle Kit

4. **Scaling Strategy**:
   - Deployment target is set to "autoscale"
   - Port 5000 is exposed internally and mapped to port 80 externally

5. **Workflow Configuration**:
   - Replit provides organized workflows for starting the application
   - Development server runs on port 5000

## Security Considerations

1. **Authentication Security**:
   - Passwords are hashed using bcrypt with appropriate salt rounds
   - Session management with secure cookies
   - CSRF protection through use of session tokens

2. **Payment Security**:
   - Stripe integration for secure payment processing
   - No storage of sensitive payment information

3. **Data Protection**:
   - Input validation using Zod schemas
   - SQL injection protection through parameterized queries via Drizzle ORM

## Performance Considerations

1. **Frontend Optimization**:
   - Code splitting via dynamic imports
   - Efficient state management with React Query

2. **Backend Efficiency**:
   - Database connection pooling
   - Serverless architecture leveraging NeonDB's capabilities

3. **API Design**:
   - RESTful API with appropriate resource modeling
   - Pagination support for list endpoints (implied in the structure)