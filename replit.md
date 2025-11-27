# EventPass - Event Ticketing SaaS Platform

## Overview

EventPass is a multi-tenant event ticketing platform that enables organizations to create events, sell tickets, scan entries via QR codes, and manage attendees. The platform features role-based access control (admin, organiser, gatekeeper, user), real-time analytics, WhatsApp notifications, and payment processing through Razorpay.

**Core Purpose:** Provide a complete ticketing solution for event organizers with features for ticket sales, entry management, audience engagement, and business analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript running on Vite
- Client-side routing using Wouter (lightweight alternative to React Router)
- Mobile-first responsive design with Tailwind CSS
- shadcn/ui component library with Radix UI primitives
- TanStack Query (React Query) for server state management

**Design System:**
- Material Design-inspired with high-contrast modifications for WCAG AAA compliance
- Typography: Inter (UI/body), Manrope (headlines), JetBrains Mono (code)
- Custom CSS variables for theming with light/dark mode support via ThemeProvider
- Utility-first approach optimized for quick scanning and readability in diverse lighting conditions (venues, outdoor events, gate scanning)

**Key Frontend Features:**
- Authentication state managed via custom `useAuth` hook
- Sidebar navigation with collapsible states for desktop/mobile
- Form handling with react-hook-form + Zod validation
- Toast notifications for user feedback
- QR code scanning interface for ticket validation

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript (ESM modules)
- HTTP server created via Node's `http.createServer` for WebSocket potential
- Middleware stack: JSON parsing, URL encoding, session management
- Custom request logging with timestamps

**Authentication & Authorization:**
- Replit Auth via OpenID Connect (OIDC) integration
- Passport.js with custom OIDC strategy
- Session-based authentication using express-session
- PostgreSQL session store (connect-pg-simple) for persistent sessions
- Role-based access control middleware (`requireRole`) enforcing admin/organiser/gatekeeper/user permissions

**Rationale:** Session-based auth chosen over JWT for better security (server-side revocation), simpler implementation, and native Replit platform integration.

### Data Architecture

**Database:**
- PostgreSQL via Neon serverless driver (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and schema management
- WebSocket connection support for Neon (using `ws` package)

**Schema Design (Multi-tenant):**
- **Organizations** - Root tenant entity with slug-based routing, custom branding (logo, colors), settings JSON
- **Users** - Linked to Replit OIDC identity, role-based (admin/organiser/gatekeeper/user), multi-organization membership
- **Events** - Belongs to organization, status workflow (draft → published → completed/cancelled), capacity management
- **Ticket Tiers** - Pricing variations per event (early-bird, VIP, general), quantity tracking, sold count
- **Tickets** - Individual ticket records with unique codes, status tracking (pending → confirmed → scanned), linked to buyers and tiers
- **Payments** - Transaction records with Razorpay integration, status tracking (pending/completed/failed/refunded)
- **Entry Scans** - Audit trail for ticket validation at gates, timestamp + gatekeeper tracking
- **WhatsApp Logs** - Message delivery tracking for notifications (confirmations, reminders, updates)
- **Audit Logs** - System-wide activity tracking for compliance and debugging
- **Sessions** - PostgreSQL-backed session storage for authentication

**Design Decisions:**
- Enum types for status fields ensure data consistency at database level
- JSONB fields for flexible settings/metadata without schema migrations
- Indexes on slug, status, and foreign keys for query performance
- Timestamps (createdAt/updatedAt) for audit trails
- Unique constraints on ticket codes and organization slugs

### API Structure

**Route Organization:**
- REST-style endpoints under `/api/*` prefix
- Authentication middleware applied globally via `setupAuth`
- Role-based middleware (`requireRole`) for protected routes
- Routes registered in `server/routes.ts` with Express Router

**Storage Layer:**
- Abstraction interface (`IStorage`) in `server/storage.ts`
- CRUD operations for all entities with Drizzle query builder
- Transaction support for complex operations (ticket purchase with payment)
- Helper functions (e.g., `generateTicketCode`) for business logic

### Build & Deployment

**Development:**
- Vite dev server with HMR running on middleware mode
- Express serves Vite in development via `server/vite.ts`
- Hot module replacement over custom `/vite-hmr` path
- Replit-specific plugins: cartographer (navigation), dev-banner, runtime-error-modal

**Production:**
- Custom build script (`script/build.ts`) using esbuild for server, Vite for client
- Server bundled with allowlisted dependencies to reduce cold start times
- Static file serving from `dist/public`
- SPA fallback to `index.html` for client-side routing

**Rationale:** Separate build processes optimize server cold starts (critical for serverless) while maintaining fast client builds. Dependency allowlisting reduces filesystem syscalls.

## External Dependencies

### Payment Processing
- **Stripe** - Payment gateway integration for ticket purchases (configured but Razorpay mentioned in docs - likely dual support)
- Payment status webhooks for async confirmation
- Refund processing capabilities

### Communication Services
- **WhatsApp Business API** - Ticket confirmations, event reminders, updates, cancellation notifications
- Delivery status tracking (pending → sent → delivered → failed)
- Message type categorization for analytics

### Authentication
- **Replit Auth (OIDC)** - Primary authentication provider
- OpenID Connect discovery at `https://replit.com/oidc`
- Token-based user identity with claims (sub, email, name, profile image)
- Refresh token support for session extension

### Database & Infrastructure
- **Neon PostgreSQL** - Serverless Postgres with WebSocket support
- Connection pooling via `@neondatabase/serverless` Pool
- DATABASE_URL environment variable for connection string
- SSL/TLS connections by default

### Email Services
- **Nodemailer** - Email delivery for fallback notifications and receipts
- Configured for SMTP relay (credentials in environment)

### AI Services (Optional)
- **Google Generative AI** - Listed in dependencies, potential for smart ticket recommendations or event descriptions
- **OpenAI** - Alternative AI provider, similar use cases

### File Uploads
- **Multer** - Middleware for event image uploads, logo management
- Local or cloud storage for assets (configuration-dependent)

### Development Tools
- **Replit Platform Plugins** - Cartographer (code navigation), dev banner, runtime error overlay
- These are excluded in production builds

### Utility Libraries
- **nanoid** - Short unique ID generation for ticket codes, URLs
- **uuid** - Standard UUID generation for database primary keys
- **date-fns** - Date manipulation and formatting
- **xlsx** - Spreadsheet export for analytics and attendee lists
- **axios** - HTTP client for external API calls
- **zod** - Runtime validation and schema definition
- **jsonwebtoken** - JWT handling for potential API tokens