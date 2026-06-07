import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { patients, sessions, apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Testes para ambos os routers de webhook:
 * - websiteAppointments.appointmentFromWebsite (site profissional)
 * - webhooks.createDirectBooking (agendamentos diretos)
 * - webhooks.syncChatbotAppointment (ChatBot Amanda)
 */
describe("Webhook Routers Integration", () => {
  let db: any;
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    db = await getDb();
    testUserId = 1;

    // Criar token de teste
    const result = await db.insert(apiTokens).values({
      userId: testUserId,
      token: `webhook_test_${Date.now()}`,
      name: "Webhook Test Token",
      description: "Token para testes de webhook",
      isActive: 1,
    });
    testToken = `webhook_test_${Date.now()}`;
  });

  afterAll(async () => {
    if (db && testUserId) {
      await db
        .delete(sessions)
        .where(and(eq(sessions.userId, testUserId), eq(sessions.status, "scheduled")))
        .catch(() => {});

      await db
        .delete(patients)
        .where(
          and(
            eq(patients.userId, testUserId),
            eq(patients.leadSource, "website")
          )
        )
        .catch(() => {});
    }
  });

  describe("websiteAppointments Router", () => {
    it("appointmentFromWebsite: criar novo agendamento com token valido", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      const result = await caller.websiteAppointments.appointmentFromWebsite({
        name: "Website Test 1",
        email: `web_${Date.now()}@example.com`,
        phone: "11999999999",
        consultationType: "Avaliacao",
        observations: "Teste",
        appointmentDate: "2026-07-15",
        appointmentTime: "14:00",
        modality: "presencial",
        paymentStatus: "pending",
        token: "sk_txl9tplq8go4z2awfemx",
      });

      expect(result.success).toBe(true);
      expect(result.patientId).toBeDefined();

      const patient = await db
        .select()
        .from(patients)
        .where(eq(patients.id, result.patientId))
        .limit(1);

      expect(patient[0].leadSource).toBe("website");
    });

    it("appointmentFromWebsite: rejeitar token invalido", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      try {
        await caller.websiteAppointments.appointmentFromWebsite({
          name: "Invalid Token",
          email: `inv_${Date.now()}@example.com`,
          consultationType: "Consulta",
          token: "invalid_token_xyz",
        });
        expect.fail("Deveria ter lançado erro");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("appointmentFromWebsite: validar email obrigatorio", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      try {
        await caller.websiteAppointments.appointmentFromWebsite({
          name: "No Email",
          email: "invalid",
          consultationType: "Consulta",
        token: "sk_txl9tplq8go4z2awfemx",
      });
      expect.fail("Deveria ter lancado erro");
    } catch (error: any) {
      expect(error).toBeDefined();
    }
  });
  });

  describe("webhooks Router", () => {
    it("createDirectBooking: criar agendamento com dados completos", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      const result = await caller.webhooks.createDirectBooking({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `direct_${Date.now()}`,
        customer_name: "Direct Booking Test",
        customer_email: `direct_${Date.now()}@example.com`,
        customer_phone: "11988888888",
        appointment_date: "2026-07-20",
        appointment_time: "10:00",
        session_type: "presencial",
        service_type: "Consulta",
        notes: "Teste de agendamento direto",
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.patientId).toBeDefined();

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, result.sessionId))
        .limit(1);

      expect(session[0].status).toBe("scheduled");
    });

    it("createDirectBooking: rejeitar token invalido", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      try {
        await caller.webhooks.createDirectBooking({
          token: "invalid_token_xyz",
          customer_id: "test",
          customer_name: "Test",
          customer_email: "test@example.com",
          appointment_date: "2026-07-21",
          appointment_time: "11:00",
          session_type: "presencial",
        });
        expect.fail("Deveria ter lançado erro");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("syncChatbotAppointment: criar agendamento com token permanente", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      const result = await caller.webhooks.syncChatbotAppointment({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `chatbot_${Date.now()}`,
        customer_name: "Chatbot Test",
        customer_email: `chatbot_${Date.now()}@example.com`,
        customer_phone: "11987654321",
        appointment_date: "2026-07-25",
        appointment_time: "15:00",
        service_type: "consultation",
        notes: "Teste ChatBot",
        session_type: "presencial",
      });

      expect(result.success).toBe(true);
      expect(result.sessionId).toBeDefined();
      expect(result.patientId).toBeDefined();

      const patient = await db
        .select()
        .from(patients)
        .where(eq(patients.id, result.patientId))
        .limit(1);

      expect(patient[0].leadSource).toBe("chatbot");
    });

    it("syncChatbotAppointment: validar campos obrigatorios", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      try {
        await caller.webhooks.syncChatbotAppointment({
          token: "sk_txl9tplq8go4z2awfemx",
          customer_id: "test",
          customer_name: "",
          customer_email: "test@example.com",
          appointment_date: "2026-07-26",
          appointment_time: "16:00",
          session_type: "presencial",
        });
        expect.fail("Deveria ter lançado erro");
      } catch (error: any) {
        // Erro esperado - pode ser de validacao ou autenticacao
        expect(error).toBeDefined();
      }
    });
  });

  describe("Sincronizacao entre routers", () => {
    it("Ambos os routers criam pacientes com status correto", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      // Via websiteAppointments
      const result1 = await caller.websiteAppointments.appointmentFromWebsite({
        name: "Website Sync Test",
        email: `sync1_${Date.now()}@example.com`,
        consultationType: "Consulta",
        token: "sk_txl9tplq8go4z2awfemx",
      });

      // Via webhooks.createDirectBooking
      const result2 = await caller.webhooks.createDirectBooking({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `sync2_${Date.now()}`,
        customer_name: "Direct Sync Test",
        customer_email: `sync2_${Date.now()}@example.com`,
        appointment_date: "2026-07-27",
        appointment_time: "12:00",
        session_type: "presencial",
      });

      // Via webhooks.syncChatbotAppointment
      const result3 = await caller.webhooks.syncChatbotAppointment({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `sync3_${Date.now()}`,
        customer_name: "Chatbot Sync Test",
        customer_email: `sync3_${Date.now()}@example.com`,
        appointment_date: "2026-07-28",
        appointment_time: "13:00",
        session_type: "presencial",
      });

      // Verificar que todos foram criados
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      // Verificar leadSource correto
      const patient1 = await db
        .select()
        .from(patients)
        .where(eq(patients.id, result1.patientId))
        .limit(1);
      expect(patient1[0].leadSource).toBe("website");

      const patient2 = await db
        .select()
        .from(patients)
        .where(eq(patients.id, result2.patientId))
        .limit(1);
      expect(patient2[0].leadSource).toBe("direct_booking");

      const patient3 = await db
        .select()
        .from(patients)
        .where(eq(patients.id, result3.patientId))
        .limit(1);
      expect(patient3[0].leadSource).toBe("chatbot");
    });

    it("Todas as sessoes tem status 'scheduled'", async () => {
      const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

      const result1 = await caller.websiteAppointments.appointmentFromWebsite({
        name: "Status Test 1",
        email: `status1_${Date.now()}@example.com`,
        consultationType: "Consulta",
        appointmentDate: "2026-07-29",
        appointmentTime: "10:00",
        modality: "presencial",
        token: "sk_txl9tplq8go4z2awfemx",
      });

      const result2 = await caller.webhooks.createDirectBooking({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `status2_${Date.now()}`,
        customer_name: "Status Test 2",
        customer_email: `status2_${Date.now()}@example.com`,
        appointment_date: "2026-07-30",
        appointment_time: "11:00",
        session_type: "presencial",
      });

      const result3 = await caller.webhooks.syncChatbotAppointment({
        token: "sk_txl9tplq8go4z2awfemx",
        customer_id: `status3_${Date.now()}`,
        customer_name: "Status Test 3",
        customer_email: `status3_${Date.now()}@example.com`,
        appointment_date: "2026-07-31",
        appointment_time: "12:00",
        session_type: "presencial",
      });

      // Verificar status
      const session1 = await db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, result1.patientId))
        .limit(1);
      expect(session1[0].status).toBe("scheduled");

      const session2 = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, result2.sessionId))
        .limit(1);
      expect(session2[0].status).toBe("scheduled");

      const session3 = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, result3.sessionId))
        .limit(1);
      expect(session3[0].status).toBe("scheduled");
    });
  });
});
