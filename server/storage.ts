import { eq, and, desc, gte, sql, or, like } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  organizations,
  events,
  ticketTiers,
  tickets,
  payments,
  entryScans,
  whatsappLogs,
  auditLogs,
  type User,
  type InsertUser,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Event,
  type InsertEvent,
  type TicketTier,
  type InsertTicketTier,
  type Ticket,
  type InsertTicket,
  type Payment,
  type InsertPayment,
  type EntryScan,
  type InsertEntryScan,
  type WhatsappLog,
  type InsertWhatsappLog,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationBySlug(slug: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  createOrganization(data: InsertOrganization): Promise<Organization>;

  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEvents(filters?: { status?: string; organizationId?: string }): Promise<Event[]>;
  getEventWithTiers(id: string): Promise<(Event & { ticketTiers: TicketTier[] }) | undefined>;
  createEvent(data: InsertEvent): Promise<Event>;
  updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined>;

  // Ticket Tiers
  getTicketTier(id: string): Promise<TicketTier | undefined>;
  getEventTicketTiers(eventId: string): Promise<TicketTier[]>;
  createTicketTier(data: InsertTicketTier): Promise<TicketTier>;
  updateTicketTierSoldCount(id: string, increment: number): Promise<TicketTier | undefined>;

  // Tickets
  getTicket(id: string): Promise<Ticket | undefined>;
  getTicketByCode(code: string): Promise<Ticket | undefined>;
  getUserTickets(userId: string): Promise<Ticket[]>;
  createTicket(data: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket | undefined>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentByRazorpayOrderId(orderId: string): Promise<Payment | undefined>;
  getUserPayments(userId: string): Promise<Payment[]>;
  getEventPayments(eventId: string): Promise<Payment[]>;
  createPayment(data: InsertPayment): Promise<Payment>;
  updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Entry Scans
  createEntryScan(data: InsertEntryScan): Promise<EntryScan>;
  getEventRecentScans(eventId: string, limit?: number): Promise<EntryScan[]>;

  // WhatsApp Logs
  createWhatsappLog(data: InsertWhatsappLog): Promise<WhatsappLog>;
  updateWhatsappLog(id: string, data: Partial<InsertWhatsappLog>): Promise<WhatsappLog | undefined>;

  // Audit Logs
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;

  // Analytics
  getDashboardStats(userId: string): Promise<{
    totalEvents: number;
    activeTickets: number;
    totalRevenue: number;
    pendingScans: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return org;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const user = await this.getUser(userId);
    if (!user || !user.organizationId) return [];
    const org = await this.getOrganization(user.organizationId);
    return org ? [org] : [];
  }

  async createOrganization(data: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(data).returning();
    return org;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEvents(filters?: { status?: string; organizationId?: string }): Promise<Event[]> {
    let query = db.select().from(events);
    
    const conditions = [];
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(events.status, filters.status as any));
    }
    if (filters?.organizationId) {
      conditions.push(eq(events.organizationId, filters.organizationId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(events.startDate));
  }

  async getEventWithTiers(id: string): Promise<(Event & { ticketTiers: TicketTier[] }) | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const tiers = await this.getEventTicketTiers(id);
    return { ...event, ticketTiers: tiers };
  }

  async createEvent(data: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(data).returning();
    return event;
  }

  async updateEvent(id: string, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  // Ticket Tiers
  async getTicketTier(id: string): Promise<TicketTier | undefined> {
    const [tier] = await db.select().from(ticketTiers).where(eq(ticketTiers.id, id));
    return tier;
  }

  async getEventTicketTiers(eventId: string): Promise<TicketTier[]> {
    return await db
      .select()
      .from(ticketTiers)
      .where(eq(ticketTiers.eventId, eventId))
      .orderBy(ticketTiers.sortOrder);
  }

  async createTicketTier(data: InsertTicketTier): Promise<TicketTier> {
    const [tier] = await db.insert(ticketTiers).values(data).returning();
    return tier;
  }

  async updateTicketTierSoldCount(id: string, increment: number): Promise<TicketTier | undefined> {
    const [tier] = await db
      .update(ticketTiers)
      .set({ 
        soldCount: sql`${ticketTiers.soldCount} + ${increment}`,
        updatedAt: new Date() 
      })
      .where(eq(ticketTiers.id, id))
      .returning();
    return tier;
  }

  // Tickets
  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByCode(code: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, code));
    return ticket;
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return await db
      .select()
      .from(tickets)
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt));
  }

  async createTicket(data: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(data).returning();
    return ticket;
  }

  async updateTicket(id: string, data: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByRazorpayOrderId(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayOrderId, orderId));
    return payment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getEventPayments(eventId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.eventId, eventId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(data: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(data).returning();
    return payment;
  }

  async updatePayment(id: string, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  // Entry Scans
  async createEntryScan(data: InsertEntryScan): Promise<EntryScan> {
    const [scan] = await db.insert(entryScans).values(data).returning();
    return scan;
  }

  async getEventRecentScans(eventId: string, limit: number = 10): Promise<EntryScan[]> {
    return await db
      .select()
      .from(entryScans)
      .where(eq(entryScans.eventId, eventId))
      .orderBy(desc(entryScans.scannedAt))
      .limit(limit);
  }

  // WhatsApp Logs
  async createWhatsappLog(data: InsertWhatsappLog): Promise<WhatsappLog> {
    const [log] = await db.insert(whatsappLogs).values(data).returning();
    return log;
  }

  async updateWhatsappLog(id: string, data: Partial<InsertWhatsappLog>): Promise<WhatsappLog | undefined> {
    const [log] = await db
      .update(whatsappLogs)
      .set(data)
      .where(eq(whatsappLogs.id, id))
      .returning();
    return log;
  }

  // Audit Logs
  async createAuditLog(data: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  // Analytics
  async getDashboardStats(userId: string): Promise<{
    totalEvents: number;
    activeTickets: number;
    totalRevenue: number;
    pendingScans: number;
  }> {
    // Get user's events count
    const user = await this.getUser(userId);
    const isOrganizer = user?.role === 'admin' || user?.role === 'organiser';
    
    let totalEvents = 0;
    let totalRevenue = 0;
    let pendingScans = 0;

    if (isOrganizer && user?.organizationId) {
      const orgEvents = await db
        .select()
        .from(events)
        .where(eq(events.organizationId, user.organizationId));
      totalEvents = orgEvents.length;

      // Get revenue from completed payments
      const eventIds = orgEvents.map(e => e.id);
      if (eventIds.length > 0) {
        const completedPayments = await db
          .select()
          .from(payments)
          .where(and(
            eq(payments.status, 'completed'),
            sql`${payments.eventId} = ANY(${eventIds})`
          ));
        totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      }
    }

    // Get user's active tickets
    const userTickets = await db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.userId, userId),
        eq(tickets.status, 'confirmed')
      ));
    const activeTickets = userTickets.length;
    pendingScans = userTickets.filter(t => !t.scannedAt).length;

    return {
      totalEvents,
      activeTickets,
      totalRevenue,
      pendingScans,
    };
  }
}

export const storage = new DatabaseStorage();

// Utility function to generate unique ticket codes
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
