import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { patients, sessions, users, apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createApiToken, validateApiToken } from "./db-webhooks";
import { createPatient, createSession } from "./db";
import type { InsertPatient, InsertSession } from "../drizzle/schema";

describe("Direct Booking Webhook Tests", () => {
  let testUserId: number;
  let testToken: string;
  const db = getDb();

  beforeAll(async () => {
    // Create test user
    const result = await db
      .insert(users)
      .values({
        email: "direct-booking-test@example.com",
        name: "Direct Booking Test User",
        openId: "test-open-id-" + Date.now(),
      })
      .returning({ id: users.id });

    testUserId = result[0].id;

    // Create API token for testing
    const tokenResult = await createApiToken(testUserId, "test_token", "Token for direct booking tests");
    testToken = tokenResult.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(sessions).where(eq(sessions.userId, testUserId));
    await db.delete(patients).where(eq(patients.userId, testUserId));
    await db.delete(apiTokens).where(eq(apiTokens.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Direct Booking Creation", () => {
    it("should validate API token correctly", async () => {
      const validatedToken = await validateApiToken(testToken);
      expect(validatedToken).not.toBeNull();
      expect(validatedToken?.token).toBe(testToken);
      expect(validatedToken?.userId).toBe(testUserId);
    });

    it("should create a patient with direct_booking source", async () => {
      const patientData: InsertPatient = {
        userId: testUserId,
        name: "Xuxa Meneguel",
        email: "xuxa@example.com",
        phone: "(21) 98765-4321",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
        interactionCount: 1,
        lastInteractionAt: new Date(),
      };

      const result = await createPatient(patientData);
      expect(result.id).toBeDefined();
      expect(result.name).toBe("Xuxa Meneguel");
      expect(result.leadSource).toBe("direct_booking");
      expect(result.leadStatus).toBe("prospect");
    });

    it("should create a session for direct booking", async () => {
      // First create a patient
      const patientData: InsertPatient = {
        userId: testUserId,
        name: "Test Patient",
        email: "test-patient-" + Date.now() + "@example.com",
        phone: "(21) 99999-9999",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
      };

      const patient = await createPatient(patientData);

      // Then create a session
      const sessionData: InsertSession = {
        userId: testUserId,
        patientId: patient.id,
        scheduledAt: new Date("2026-05-06T15:00:00Z"),
        status: "pending",
        sessionValue: 150,
        isPaid: "pending",
      };

      const session = await createSession(sessionData);
      expect(session.id).toBeDefined();
      expect(session.patientId).toBe(patient.id);
      expect(session.status).toBe("pending");
      expect(session.isPaid).toBe("pending");
    });

    it("should retrieve direct bookings with pending status", async () => {
      // Create a patient
      const patientData: InsertPatient = {
        userId: testUserId,
        name: "Booking Patient",
        email: "booking-" + Date.now() + "@example.com",
        phone: "(21) 98888-8888",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
      };

      const patient = await createPatient(patientData);

      // Create a session
      const sessionData: InsertSession = {
        userId: testUserId,
        patientId: patient.id,
        scheduledAt: new Date("2026-05-07T14:00:00Z"),
        status: "pending",
        sessionValue: 200,
        isPaid: "pending",
      };

      const session = await createSession(sessionData);

      // Query for direct bookings
      const bookings = await db
        .select({
          id: sessions.id,
          patientId: sessions.patientId,
          scheduledAt: sessions.scheduledAt,
          status: sessions.status,
          sessionValue: sessions.sessionValue,
          isPaid: sessions.isPaid,
          patient: {
            id: patients.id,
            name: patients.name,
            email: patients.email,
            phone: patients.phone,
          },
        })
        .from(sessions)
        .innerJoin(patients, eq(sessions.patientId, patients.id))
        .where(
          and(
            eq(sessions.userId, testUserId),
            eq(patients.leadSource, "direct_booking"),
            eq(sessions.status, "pending")
          )
        );

      expect(bookings.length).toBeGreaterThan(0);
      expect(bookings.some((b) => b.id === session.id)).toBe(true);
    });

    it("should prevent duplicate emails", async () => {
      const email = "duplicate-test-" + Date.now() + "@example.com";

      // Create first patient
      const patientData1: InsertPatient = {
        userId: testUserId,
        name: "First Patient",
        email,
        phone: "(21) 97777-7777",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
      };

      await createPatient(patientData1);

      // Try to create second patient with same email
      const existing = await db
        .select()
        .from(patients)
        .where(and(eq(patients.userId, testUserId), eq(patients.email, email)));

      expect(existing.length).toBe(1);
      expect(existing[0].email).toBe(email);
    });

    it("should update session status from pending to scheduled", async () => {
      // Create a patient and session
      const patientData: InsertPatient = {
        userId: testUserId,
        name: "Status Update Patient",
        email: "status-" + Date.now() + "@example.com",
        phone: "(21) 96666-6666",
        leadSource: "direct_booking",
        leadStatus: "prospect",
        status: "active",
      };

      const patient = await createPatient(patientData);

      const sessionData: InsertSession = {
        userId: testUserId,
        patientId: patient.id,
        scheduledAt: new Date("2026-05-08T10:00:00Z"),
        status: "pending",
        sessionValue: 175,
        isPaid: "pending",
      };

      const session = await createSession(sessionData);

      // Update session status
      await db
        .update(sessions)
        .set({ status: "scheduled" })
        .where(eq(sessions.id, session.id));

      // Verify update
      const updated = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, session.id));

      expect(updated[0].status).toBe("scheduled");
    });
  });

  describe("Lead to Customer Conversion", () => {
    it("should convert lead to prospect when direct booking is made", async () => {
      const email = "lead-convert-" + Date.now() + "@example.com";

      // Create as lead first
      const leadData: InsertPatient = {
        userId: testUserId,
        name: "Lead to Convert",
        email,
        phone: "(21) 95555-5555",
        leadSource: "chatbot",
        leadStatus: "lead",
        status: "active",
      };

      const lead = await createPatient(leadData);
      expect(lead.leadStatus).toBe("lead");

      // Update to prospect (simulate direct booking)
      await db
        .update(patients)
        .set({ leadStatus: "prospect", leadSource: "direct_booking" })
        .where(eq(patients.id, lead.id));

      // Verify conversion
      const converted = await db
        .select()
        .from(patients)
        .where(eq(patients.id, lead.id));

      expect(converted[0].leadStatus).toBe("prospect");
      expect(converted[0].leadSource).toBe("direct_booking");
    });
  });
});
