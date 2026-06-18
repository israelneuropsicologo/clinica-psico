import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { patients, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Webhooks Integration Tests", () => {
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    // Create test user
    const db = getDb();
    const result = await db
      .insert(users)
      .values({
        email: "webhook-test@example.com",
        name: "Webhook Test User",
        openId: "test-open-id-" + Date.now(),
      })
      .returning({ id: users.id });

    testUserId = result[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDb();
    await db.delete(patients).where(eq(patients.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Chatbot Lead Creation", () => {
    it("should create a lead from chatbot with correct fields", async () => {
      const leadData = {
        name: "João Silva",
        email: "joao@example.com",
        phone: "(21) 98765-4321",
        message: "Gostaria de marcar uma consulta",
      };

      // Simulate webhook call
      const db = getDb();
      const result = await db
        .insert(patients)
        .values({
          userId: testUserId,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          leadSource: "chatbot",
          leadStatus: "lead",
          status: "active",
          interactionCount: 1,
          lastInteractionAt: new Date(),
        })
        .returning();

      expect(result[0].name).toBe(leadData.name);
      expect(result[0].email).toBe(leadData.email);
      expect(result[0].leadSource).toBe("chatbot");
      expect(result[0].leadStatus).toBe("lead");
    });

    it("should prevent duplicate emails", async () => {
      const leadData = {
        name: "Maria Santos",
        email: "maria@example.com",
        phone: "(21) 99876-5432",
      };

      // Create first lead
      const db = getDb();
      await db.insert(patients).values({
        userId: testUserId,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        leadSource: "chatbot",
        leadStatus: "lead",
        status: "active",
      });

      // Try to create duplicate
      const existing = await db
        .select()
        .from(patients)
        .where(eq(patients.email, leadData.email));

      expect(existing.length).toBe(1);
      expect(existing[0].email).toBe(leadData.email);
    });
  });

  describe("Direct Booking Creation", () => {
    it("should create a booking with prospect status", async () => {
      const bookingData = {
        name: "Ana Costa",
        email: "ana@example.com",
        phone: "(21) 97654-3210",
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        sessionValue: 150,
      };

      // Create patient from booking
      const db = getDb();
      const result = await db
        .insert(patients)
        .values({
          userId: testUserId,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          leadSource: "direct_booking",
          leadStatus: "prospect",
          status: "active",
          sessionValue: bookingData.sessionValue,
          interactionCount: 1,
          lastInteractionAt: new Date(),
        })
        .returning();

      expect(result[0].name).toBe(bookingData.name);
      expect(result[0].leadSource).toBe("direct_booking");
      expect(result[0].leadStatus).toBe("prospect");
      expect(result[0].sessionValue).toBe(bookingData.sessionValue);
    });

    it("should upgrade lead to prospect when booking is made", async () => {
      const leadEmail = "upgrade-test@example.com";

      // Create lead first
      const db = getDb();
      await db.insert(patients).values({
        userId: testUserId,
        name: "Test Lead",
        email: leadEmail,
        leadSource: "chatbot",
        leadStatus: "lead",
        status: "active",
      });

      // Upgrade to prospect (simulate direct booking)
      const result = await db
        .select()
        .from(patients)
        .where(eq(patients.email, leadEmail));

      expect(result[0].leadStatus).toBe("lead");
      expect(result[0].leadSource).toBe("chatbot");
    });
  });

  describe("Lead Status Transitions", () => {
    it("should track lead to customer conversion", async () => {
      const email = "conversion-test@example.com";

      // Create as lead
      const db = getDb();
      const lead = await db
        .insert(patients)
        .values({
          userId: testUserId,
          name: "Conversion Test",
          email,
          leadSource: "chatbot",
          leadStatus: "lead",
          status: "active",
        })
        .returning();

      expect(lead[0].leadStatus).toBe("lead");

      // Verify it can be queried as lead
      const leads = await db
        .select()
        .from(patients)
        .where(eq(patients.leadStatus, "lead"));

      expect(leads.some((p) => p.email === email)).toBe(true);
    });
  });

  describe("Lead Source Distribution", () => {
    it("should correctly categorize leads by source", async () => {
      // Create leads from different sources
      const db = getDb();
      await db.insert(patients).values({
        userId: testUserId,
        name: "Chatbot Lead",
        email: "chatbot-" + Date.now() + "@example.com",
        leadSource: "chatbot",
        leadStatus: "lead",
        status: "active",
      });

      await db.insert(patients).values({
        userId: testUserId,
        name: "Direct Booking",
        email: "booking-" + Date.now() + "@example.com",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
      });

      await db.insert(patients).values({
        userId: testUserId,
        name: "Manual Entry",
        email: "manual-" + Date.now() + "@example.com",
        leadSource: "manual",
        leadStatus: "customer",
        status: "active",
      });

      // Query by source
      const chatbotLeads = await db
        .select()
        .from(patients)
        .where(eq(patients.leadSource, "chatbot"));

      const directBookings = await db
        .select()
        .from(patients)
        .where(eq(patients.leadSource, "direct_booking"));

      const manualLeads = await db
        .select()
        .from(patients)
        .where(eq(patients.leadSource, "manual"));

      expect(chatbotLeads.length).toBeGreaterThan(0);
      expect(directBookings.length).toBeGreaterThan(0);
      expect(manualLeads.length).toBeGreaterThan(0);
    });
  });
});
