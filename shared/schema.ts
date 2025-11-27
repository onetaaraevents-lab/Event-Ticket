import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "organiser", "gatekeeper", "user"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "cancelled", "completed"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["pending", "confirmed", "cancelled", "refunded", "scanned"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const whatsappMessageTypeEnum = pgEnum("whatsapp_message_type", ["ticket_confirmation", "reminder", "update", "cancellation"]);
export const whatsappStatusEnum = pgEnum("whatsapp_status", ["pending", "sent", "delivered", "failed"]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Organizations - Multi-tenant root
export const organizations = pgTable(
  "organizations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    logoUrl: varchar("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }).default("#1a56db"),
    settings: jsonb("settings").default({}),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("org_slug_idx").on(table.slug),
  ]
);

// Users table with roles
export const users = pgTable(
  "users",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: varchar("email").unique(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    profileImageUrl: varchar("profile_image_url"),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").default("user").notNull(),
    organizationId: varchar("organization_id").references(() => organizations.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_org_idx").on(table.organizationId),
  ]
);

// Events
export const events = pgTable(
  "events",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id").references(() => organizations.id).notNull(),
    createdByUserId: varchar("created_by_user_id").references(() => users.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),
    imageUrl: varchar("image_url"),
    venue: varchar("venue", { length: 500 }).notNull(),
    venueAddress: text("venue_address"),
    city: varchar("city", { length: 100 }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    doorsOpen: timestamp("doors_open"),
    totalCapacity: integer("total_capacity").notNull(),
    status: eventStatusEnum("status").default("draft").notNull(),
    isPublic: boolean("is_public").default(true),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("event_org_idx").on(table.organizationId),
    index("event_status_idx").on(table.status),
    index("event_date_idx").on(table.startDate),
  ]
);

// Ticket Tiers (pricing tiers for each event)
export const ticketTiers = pgTable(
  "ticket_tiers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").references(() => events.id).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    quantity: integer("quantity").notNull(),
    soldCount: integer("sold_count").default(0).notNull(),
    maxPerOrder: integer("max_per_order").default(10),
    salesStartDate: timestamp("sales_start_date"),
    salesEndDate: timestamp("sales_end_date"),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("tier_event_idx").on(table.eventId),
  ]
);

// Tickets (individual tickets purchased)
export const tickets = pgTable(
  "tickets",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticketTierId: varchar("ticket_tier_id").references(() => ticketTiers.id).notNull(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    paymentId: varchar("payment_id").references(() => payments.id),
    ticketCode: varchar("ticket_code", { length: 50 }).notNull().unique(),
    qrCodeData: text("qr_code_data"),
    status: ticketStatusEnum("status").default("pending").notNull(),
    attendeeName: varchar("attendee_name", { length: 255 }),
    attendeeEmail: varchar("attendee_email"),
    attendeePhone: varchar("attendee_phone", { length: 20 }),
    scannedAt: timestamp("scanned_at"),
    scannedByUserId: varchar("scanned_by_user_id").references(() => users.id),
    purchasedAt: timestamp("purchased_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("ticket_code_idx").on(table.ticketCode),
    index("ticket_user_idx").on(table.userId),
    index("ticket_tier_idx").on(table.ticketTierId),
    index("ticket_status_idx").on(table.status),
  ]
);

// Payments (Razorpay integration)
export const payments = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id).notNull(),
    eventId: varchar("event_id").references(() => events.id).notNull(),
    razorpayOrderId: varchar("razorpay_order_id").unique(),
    razorpayPaymentId: varchar("razorpay_payment_id").unique(),
    razorpaySignature: varchar("razorpay_signature"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    ticketQuantity: integer("ticket_quantity").notNull(),
    metadata: jsonb("metadata").default({}),
    failureReason: text("failure_reason"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("payment_user_idx").on(table.userId),
    index("payment_event_idx").on(table.eventId),
    index("payment_status_idx").on(table.status),
    uniqueIndex("payment_razorpay_order_idx").on(table.razorpayOrderId),
  ]
);

// Entry Scans (gate scanning logs)
export const entryScans = pgTable(
  "entry_scans",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticketId: varchar("ticket_id").references(() => tickets.id).notNull(),
    scannedByUserId: varchar("scanned_by_user_id").references(() => users.id).notNull(),
    eventId: varchar("event_id").references(() => events.id).notNull(),
    scanResult: varchar("scan_result", { length: 50 }).notNull(), // 'success', 'already_scanned', 'invalid', 'expired'
    gateName: varchar("gate_name", { length: 100 }),
    deviceInfo: varchar("device_info"),
    location: jsonb("location"), // { lat, lng }
    scannedAt: timestamp("scanned_at").defaultNow(),
  },
  (table) => [
    index("scan_ticket_idx").on(table.ticketId),
    index("scan_event_idx").on(table.eventId),
    index("scan_time_idx").on(table.scannedAt),
  ]
);

// WhatsApp Logs
export const whatsappLogs = pgTable(
  "whatsapp_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ticketId: varchar("ticket_id").references(() => tickets.id),
    userId: varchar("user_id").references(() => users.id),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    messageType: whatsappMessageTypeEnum("message_type").notNull(),
    templateName: varchar("template_name", { length: 100 }),
    templateParams: jsonb("template_params"),
    twilioMessageSid: varchar("twilio_message_sid"),
    status: whatsappStatusEnum("status").default("pending").notNull(),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("whatsapp_ticket_idx").on(table.ticketId),
    index("whatsapp_user_idx").on(table.userId),
    index("whatsapp_status_idx").on(table.status),
  ]
);

// Audit Logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id),
    organizationId: varchar("organization_id").references(() => organizations.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // 'event', 'ticket', 'payment', 'user', etc.
    entityId: varchar("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("audit_user_idx").on(table.userId),
    index("audit_org_idx").on(table.organizationId),
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_time_idx").on(table.createdAt),
  ]
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  events: many(events),
  auditLogs: many(auditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  tickets: many(tickets),
  payments: many(payments),
  createdEvents: many(events),
  entryScans: many(entryScans),
  whatsappLogs: many(whatsappLogs),
  auditLogs: many(auditLogs),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [events.createdByUserId],
    references: [users.id],
  }),
  ticketTiers: many(ticketTiers),
  payments: many(payments),
  entryScans: many(entryScans),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  ticketTier: one(ticketTiers, {
    fields: [tickets.ticketTierId],
    references: [ticketTiers.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [tickets.paymentId],
    references: [payments.id],
  }),
  scannedBy: one(users, {
    fields: [tickets.scannedByUserId],
    references: [users.id],
  }),
  entryScans: many(entryScans),
  whatsappLogs: many(whatsappLogs),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [payments.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
}));

export const entryScansRelations = relations(entryScans, ({ one }) => ({
  ticket: one(tickets, {
    fields: [entryScans.ticketId],
    references: [tickets.id],
  }),
  scannedBy: one(users, {
    fields: [entryScans.scannedByUserId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [entryScans.eventId],
    references: [events.id],
  }),
}));

export const whatsappLogsRelations = relations(whatsappLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [whatsappLogs.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [whatsappLogs.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
}));

// Insert Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketTierSchema = createInsertSchema(ticketTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEntryScanSchema = createInsertSchema(entryScans).omit({
  id: true,
});

export const insertWhatsappLogSchema = createInsertSchema(whatsappLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type TicketTier = typeof ticketTiers.$inferSelect;
export type InsertTicketTier = z.infer<typeof insertTicketTierSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type EntryScan = typeof entryScans.$inferSelect;
export type InsertEntryScan = z.infer<typeof insertEntryScanSchema>;

export type WhatsappLog = typeof whatsappLogs.$inferSelect;
export type InsertWhatsappLog = z.infer<typeof insertWhatsappLogSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Extended types with relations
export type EventWithTiers = Event & { ticketTiers: TicketTier[] };
export type TicketWithDetails = Ticket & { ticketTier: TicketTier & { event: Event } };
export type UserRole = "admin" | "organiser" | "gatekeeper" | "user";
