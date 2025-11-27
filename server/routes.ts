import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, generateTicketCode } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
      };
      access_token?: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

// Role-based middleware
function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const user = await storage.getUser(req.user.claims.sub);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userRole = user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Replit Auth
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================
  
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ==================== USER ROUTES ====================

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { firstName, lastName, phone } = req.body;
      const user = await storage.updateUser(userId, {
        firstName,
        lastName,
        phone,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ==================== DASHBOARD ROUTES ====================

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ==================== EVENT ROUTES ====================

  app.get("/api/events", async (req, res) => {
    try {
      const { status, sort } = req.query;
      const events = await storage.getEvents({ 
        status: status as string,
      });
      
      // Enrich with ticket tier data
      const enrichedEvents = await Promise.all(events.map(async (event) => {
        const tiers = await storage.getEventTicketTiers(event.id);
        const ticketsSold = tiers.reduce((sum, t) => sum + t.soldCount, 0);
        const lowestPrice = tiers.length > 0 
          ? Math.min(...tiers.filter(t => t.isActive).map(t => parseFloat(t.price)))
          : 0;
        return {
          ...event,
          ticketTiers: tiers,
          ticketsSold,
          lowestPrice: isFinite(lowestPrice) ? lowestPrice : 0,
        };
      }));

      res.json(enrichedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/upcoming", isAuthenticated, async (req, res) => {
    try {
      const allEvents = await storage.getEvents({ status: 'published' });
      const now = new Date();
      const upcoming = allEvents
        .filter(e => new Date(e.startDate) >= now)
        .slice(0, 5);
      
      const enrichedEvents = await Promise.all(upcoming.map(async (event) => {
        const tiers = await storage.getEventTicketTiers(event.id);
        const ticketsSold = tiers.reduce((sum, t) => sum + t.soldCount, 0);
        const revenue = 0; // Would need to join with payments
        return {
          ...event,
          ticketTiers: tiers,
          ticketsSold,
          revenue,
        };
      }));

      res.json(enrichedEvents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventWithTiers(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Get organization name
      const org = event.organizationId 
        ? await storage.getOrganization(event.organizationId)
        : null;
      
      res.json({
        ...event,
        organizationName: org?.name || 'Unknown Organizer',
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAuthenticated, requireRole('admin', 'organiser'), async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { ticketTiers: tiersData, ...eventData } = req.body;
      
      // Ensure user has an organization
      let user = await storage.getUser(userId);
      let organizationId = user?.organizationId;
      
      if (!organizationId) {
        // Create default organization for user
        const org = await storage.createOrganization({
          name: `${user?.firstName || 'My'}'s Organization`,
          slug: `org-${userId.slice(0, 8)}`,
        });
        organizationId = org.id;
        await storage.updateUser(userId, { organizationId });
      }

      const event = await storage.createEvent({
        ...eventData,
        organizationId,
        createdByUserId: userId,
        status: 'draft',
      });

      // Create ticket tiers
      if (tiersData && Array.isArray(tiersData)) {
        for (let i = 0; i < tiersData.length; i++) {
          await storage.createTicketTier({
            ...tiersData[i],
            eventId: event.id,
            sortOrder: i,
          });
        }
      }

      res.status(201).json(event);
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", isAuthenticated, requireRole('admin', 'organiser'), async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const updated = await storage.updateEvent(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // ==================== TICKET ROUTES ====================

  app.get("/api/tickets", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tickets = await storage.getUserTickets(userId);
      
      // Enrich with event and tier data
      const enrichedTickets = await Promise.all(tickets.map(async (ticket) => {
        const tier = await storage.getTicketTier(ticket.ticketTierId);
        const event = tier ? await storage.getEvent(tier.eventId) : null;
        return {
          ...ticket,
          ticketTier: tier ? {
            ...tier,
            event: event,
          } : null,
        };
      }));

      res.json(enrichedTickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  app.get("/api/tickets/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tickets = await storage.getUserTickets(userId);
      const recentTickets = tickets.slice(0, 5);
      
      const enrichedTickets = await Promise.all(recentTickets.map(async (ticket) => {
        const tier = await storage.getTicketTier(ticket.ticketTierId);
        const event = tier ? await storage.getEvent(tier.eventId) : null;
        return {
          ...ticket,
          eventName: event?.name || 'Unknown Event',
          eventDate: event?.startDate,
        };
      }));

      res.json(enrichedTickets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent tickets" });
    }
  });

  // ==================== PAYMENT ROUTES ====================

  app.post("/api/payments/create-order", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { eventId, items } = req.body;
      
      // Calculate total
      let totalAmount = 0;
      let totalTickets = 0;
      
      for (const item of items) {
        totalAmount += item.price * item.quantity;
        totalTickets += item.quantity;
      }

      // Create payment record
      const payment = await storage.createPayment({
        userId,
        eventId,
        amount: totalAmount.toFixed(2),
        currency: 'INR',
        ticketQuantity: totalTickets,
        status: 'pending',
        metadata: { items },
      });

      // In production, this would create a Razorpay order
      // For now, we'll simulate an order ID
      const razorpayOrderId = `order_${payment.id}`;
      await storage.updatePayment(payment.id, { razorpayOrderId });

      res.json({
        orderId: payment.id,
        razorpayOrderId,
        amount: totalAmount,
        currency: 'INR',
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/payments/verify", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      
      const payment = await storage.getPaymentByRazorpayOrderId(razorpayOrderId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // In production, verify signature with Razorpay
      // For now, we'll simulate successful verification
      
      await storage.updatePayment(payment.id, {
        razorpayPaymentId,
        razorpaySignature,
        status: 'completed',
        completedAt: new Date(),
      });

      // Create tickets
      const metadata = payment.metadata as { items: Array<{ tierId: string; quantity: number }> };
      const tickets = [];
      
      for (const item of metadata.items) {
        for (let i = 0; i < item.quantity; i++) {
          const ticket = await storage.createTicket({
            ticketTierId: item.tierId,
            userId,
            paymentId: payment.id,
            ticketCode: generateTicketCode(),
            status: 'confirmed',
            purchasedAt: new Date(),
          });
          tickets.push(ticket);
        }
        
        // Update sold count
        await storage.updateTicketTierSoldCount(item.tierId, item.quantity);
      }

      res.json({ success: true, tickets });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.get("/api/payments", isAuthenticated, requireRole('admin', 'organiser'), async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const payments = await storage.getUserPayments(userId);
      
      // Enrich with event data
      const enrichedPayments = await Promise.all(payments.map(async (payment) => {
        const event = await storage.getEvent(payment.eventId);
        const user = await storage.getUser(payment.userId);
        return {
          ...payment,
          event,
          buyerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
          buyerEmail: user?.email || 'Unknown',
        };
      }));

      res.json(enrichedPayments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // ==================== SCANNER ROUTES ====================

  app.post("/api/scans/verify", isAuthenticated, requireRole('admin', 'organiser', 'gatekeeper'), async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { ticketCode, eventId } = req.body;
      
      const ticket = await storage.getTicketByCode(ticketCode);
      
      if (!ticket) {
        return res.json({
          success: false,
          message: 'Invalid ticket code',
          scanResult: 'invalid',
        });
      }

      const tier = await storage.getTicketTier(ticket.ticketTierId);
      if (!tier || tier.eventId !== eventId) {
        return res.json({
          success: false,
          message: 'This ticket is for a different event',
          scanResult: 'wrong_event',
        });
      }

      if (ticket.status === 'scanned') {
        return res.json({
          success: false,
          message: `Already scanned at ${ticket.scannedAt?.toLocaleTimeString()}`,
          scanResult: 'already_scanned',
          ticket: {
            ...ticket,
            tierName: tier.name,
          },
        });
      }

      if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
        return res.json({
          success: false,
          message: 'Ticket has been cancelled or refunded',
          scanResult: 'expired',
        });
      }

      // Mark as scanned
      await storage.updateTicket(ticket.id, {
        status: 'scanned',
        scannedAt: new Date(),
        scannedByUserId: userId,
      });

      // Log the scan
      await storage.createEntryScan({
        ticketId: ticket.id,
        scannedByUserId: userId,
        eventId,
        scanResult: 'success',
      });

      const event = await storage.getEvent(eventId);

      res.json({
        success: true,
        message: 'Entry approved',
        scanResult: 'success',
        ticket: {
          ...ticket,
          eventName: event?.name,
          tierName: tier.name,
          attendeeName: ticket.attendeeName,
        },
      });
    } catch (error) {
      console.error('Scan error:', error);
      res.status(500).json({ error: "Failed to verify ticket" });
    }
  });

  app.get("/api/scans/recent/:eventId", isAuthenticated, requireRole('admin', 'organiser', 'gatekeeper'), async (req, res) => {
    try {
      const scans = await storage.getEventRecentScans(req.params.eventId, 20);
      
      const enrichedScans = await Promise.all(scans.map(async (scan) => {
        const ticket = await storage.getTicket(scan.ticketId);
        return {
          ...scan,
          ticketCode: ticket?.ticketCode || 'Unknown',
          attendeeName: ticket?.attendeeName,
        };
      }));

      res.json(enrichedScans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent scans" });
    }
  });

  // ==================== ANALYTICS ROUTES ====================

  app.get("/api/analytics", isAuthenticated, requireRole('admin', 'organiser'), async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { period } = req.query;
      
      // Get basic stats
      const stats = await storage.getDashboardStats(userId);
      
      // Mock analytics data for now
      // In production, these would be real aggregations
      res.json({
        overview: {
          totalRevenue: stats.totalRevenue,
          revenueChange: 12,
          totalTicketsSold: stats.activeTickets,
          ticketsChange: 8,
          totalEvents: stats.totalEvents,
          eventsChange: 5,
          totalAttendees: stats.activeTickets,
          attendeesChange: 15,
        },
        topEvents: [],
        recentSales: [],
        salesByDay: [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  return httpServer;
}
