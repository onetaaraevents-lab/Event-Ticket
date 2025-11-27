# Design Guidelines: Event-Ticketing SaaS Platform

## Design Approach: Utility-First with High Contrast Emphasis

**Selected System:** Material Design with high-contrast modifications
**Rationale:** Event ticketing requires quick decision-making, clear hierarchies, and excellent readability across diverse lighting conditions (venues, outdoor events, gate scanning). The user explicitly requested high-contrast design.

**Key Design Principles:**
1. Maximum readability through strong contrast ratios (WCAG AAA compliance)
2. Scannable layouts optimized for quick task completion
3. Clear visual separation between organizational data (multi-tenant isolation)
4. Mobile-first design for gate scanning and ticket viewing

---

## Core Design Elements

### A. Typography

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - UI text, buttons, forms
- Accent: Manrope (via Google Fonts CDN) - Headlines, event titles

**Type Scale:**
- Display (event titles): 3xl (30px) / 4xl (36px) on desktop, bold weight
- Headings: xl (20px) / 2xl (24px), semibold
- Body: base (16px), regular weight
- Small/Meta: sm (14px), medium weight
- Button text: base (16px), semibold

**High-Contrast Treatment:**
- Use pure black (#000000) for primary text on light backgrounds
- Use pure white (#FFFFFF) for text on dark backgrounds
- Avoid gray text below 700 weight for critical information

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: py-8, py-12, py-16
- Gap in grids: gap-4, gap-6
- Margins between major sections: mb-8, mb-12

**Grid System:**
- Dashboard cards: 2-3 column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Ticket listings: 1-2 columns (grid-cols-1 lg:grid-cols-2)
- Event details: Single column with sidebar (60/40 split on desktop)
- Analytics: 4-column stat cards (grid-cols-2 lg:grid-cols-4)

**Container Widths:**
- Dashboard/App: max-w-7xl
- Event creation forms: max-w-3xl
- Auth pages: max-w-md

### C. Component Library

**Navigation:**
- Top navbar: Fixed position, contains org switcher (multi-tenant dropdown), role indicator, user menu
- Sidebar (desktop): Collapsible, role-based menu items, organization logo placement
- Mobile: Bottom tab navigation for primary actions (Dashboard, Events, Tickets, Scan)

**Cards:**
- Event cards: Featured image (16:9), title, date/time, location, price, CTA button
- Ticket cards: QR code prominent, event details, validity status indicator, download action
- Dashboard stat cards: Large number display, label, trend indicator (if applicable)
- Payment history: Table-like card with transaction rows, status badges

**Forms:**
- Event creation: Multi-step wizard with progress indicator (4 steps: Details, Tickets, Pricing, Publish)
- Ticket purchase: Shopping cart sidebar, quantity selector, promo code input
- Auth forms: Social login buttons (Google, GitHub) + email/password fields, clear error states

**Buttons:**
- Primary CTA: Large, high-contrast (white text on dark background with blur backdrop when on images)
- Secondary: Outlined style with high border contrast
- Destructive: Red background (#DC2626) with white text
- Icon buttons: Minimal, 44x44px touch target minimum

**Data Display:**
- Tables: Striped rows for readability, sortable headers, sticky header on scroll
- QR codes: Large, centered, with high error correction level, ticket ID below
- Status badges: Pill-shaped, bold text, high-contrast background (Confirmed: green, Pending: yellow, Failed: red, Scanned: blue)
- Charts: Use high-contrast color palette, bold lines, clear axis labels

**Scanning Interface:**
- Camera viewport: Full-screen with overlay frame guiding QR placement
- Scan result overlay: Large success/error feedback, haptic vibration, sound confirmation
- Recent scans list: Quick access to last 10 entries with timestamps

**Overlays:**
- Modals: Dark backdrop (80% opacity), centered content, clear close action
- Ticket preview: Full-screen modal with download and share actions
- Payment confirmation: Centered with order summary, total, and action buttons

### D. Animations

Use sparingly for functional feedback only:
- Loading spinners: Border-based spinner for async actions
- Success/error states: Simple fade-in for status messages (300ms)
- QR scan feedback: Scale pulse on successful scan (200ms)
- No decorative scroll animations or parallax effects

---

## Screen-Specific Guidelines

### Marketing/Pricing Page

**Hero Section (80vh):**
- Large hero image: Event crowd/concert scene with energy
- Headline overlay: "Sell Tickets. Scan Entries. Grow Events." (centered, white text with blur backdrop)
- Primary CTA: "Start Free Trial" + Secondary: "View Pricing"
- Trust indicator: "10,000+ events powered" text below CTAs

**Features Section (3-column grid):**
- Icon + Title + Description cards
- Features: Instant ticketing, QR scanning, WhatsApp confirmations, Multi-organization, Real-time analytics, Razorpay integration

**Pricing Section (3-column comparison):**
- Tiers: Free, Pro, Enterprise
- Card design: Outlined, highlighted "Popular" tier, feature checklist, CTA button

**Footer:**
- 4-column layout: Product links, Resources, Company, Contact
- Newsletter signup inline
- Social links + Payment logos (Razorpay badge)

### Dashboard

**Layout:**
- Top stats row: 4 cards (Total events, Active tickets, Revenue, Pending scans)
- Main content: 2-column split (Upcoming events list + Recent activity feed)
- Quick actions: Floating action button for "Create Event" (mobile), prominent button (desktop)

### Event Creation

**Multi-step form with left sidebar progress:**
1. Event details: Name, description, date/time, venue (with map integration suggestion)
2. Tickets: Tier creation (name, price, quantity), early bird options
3. Settings: WhatsApp notifications toggle, scanning options, organizer assignment
4. Preview & Publish: Final review with preview card

### Ticket Purchase Flow

**Event detail page:**
- Hero image: Event banner (21:9 aspect)
- Two-column: Event info (left 60%) + Ticket selection sidebar (right 40%, sticky on scroll)
- Ticket tiers: List with quantity selectors, dynamic total calculation
- Purchase CTA: Prominent "Proceed to Payment" button

### Gate Scanning Interface

**Optimized for one-handed operation:**
- Full-screen camera with corner guides
- Scan status at top: "Ready to scan"
- Bottom sheet: Recent scans (swipe up for full list)
- Manual entry option: Text input for ticket ID fallback

---

## Images

**Hero Image (Marketing page):** High-energy concert or event crowd, vibrant atmosphere, audience with raised hands. Place as full-width background for hero section.

**Event cards:** Each event should display featured image (organizer uploaded), 16:9 aspect ratio, as card header.

**No custom illustrations** - use icon libraries (Heroicons) for UI elements.