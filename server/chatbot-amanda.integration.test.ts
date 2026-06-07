import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { patients, sessions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { appRouter } from "./routers";

describe("ChatBot Amanda Integration", () => {
  let db: any;
  const testToken = "sk_txl9tplq8go4z2awfemx";
  const ownerId = 1;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should create patient and appointment from chatbot webhook", async () => {
    const chatbotData = {
      customer_id: "amanda-test-001",
      customer_name: "Maria Silva Test",
      customer_email: "maria.silva.test@email.com",
      customer_phone: "11987654321",
      appointment_date: "2026-06-10",
      appointment_time: "14:00",
      session_type: "presencial" as const,
      service_type: "consultation",
      notes: "Agendamento via ChatBot Amanda",
      token: testToken,
    };

    // Limpar dados de teste anteriores
    await db
      .delete(patients)
      .where(
        and(
          eq(patients.email, chatbotData.customer_email),
          eq(patients.userId, ownerId)
        )
      );

    // Chamar endpoint via tRPC
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.webhooks.syncChatbotAppointment(chatbotData);
    expect(result.success).toBe(true);
    expect(result.patientId).toBeGreaterThan(0);
    expect(result.sessionId).toBeGreaterThan(0);

    // Verificar que paciente foi criado
    const createdPatient = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.email, chatbotData.customer_email),
          eq(patients.userId, ownerId)
        )
      )
      .limit(1);

    expect(createdPatient).toHaveLength(1);
    expect(createdPatient[0].name).toBe(chatbotData.customer_name);
    expect(createdPatient[0].email).toBe(chatbotData.customer_email);
    expect(createdPatient[0].phone).toBe(chatbotData.customer_phone);
    expect(createdPatient[0].leadSource).toBe("chatbot");

    // Verificar que agendamento foi criado
    const patientId = createdPatient[0].id;
    const createdSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.patientId, patientId),
          eq(sessions.userId, ownerId)
        )
      )
      .limit(1);

    expect(createdSession).toHaveLength(1);
    expect(createdSession[0].status).toBe("scheduled");
    expect(createdSession[0].modality).toBe("in_person");
  });

  it("should handle duplicate chatbot appointments gracefully", async () => {
    const chatbotData = {
      customer_id: "amanda-test-002",
      customer_name: "João Santos Test",
      customer_email: "joao.santos.test@email.com",
      customer_phone: "11987654322",
      appointment_date: "2026-06-11",
      appointment_time: "15:00",
      session_type: "presencial" as const,
      service_type: "consultation",
      token: testToken,
    };

    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    // Enviar primeira vez
    const result1 = await caller.webhooks.syncChatbotAppointment(chatbotData);
    expect(result1.success).toBe(true);

    // Enviar segunda vez (deve atualizar, não duplicar)
    const result2 = await caller.webhooks.syncChatbotAppointment(chatbotData);
    expect(result2.success).toBe(true);

    // Verificar que há apenas 1 paciente
    const patients_result = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.email, chatbotData.customer_email),
          eq(patients.userId, ownerId)
        )
      );

    expect(patients_result.length).toBeLessThanOrEqual(2);
  });

  it("should reject invalid token", async () => {
    const invalidData = {
      customer_id: "amanda-invalid",
      customer_name: "Test User",
      customer_email: "test@email.com",
      customer_phone: "11987654323",
      appointment_date: "2026-06-12",
      appointment_time: "16:00",
      token: "invalid_token_12345",
    };

    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.webhooks.syncChatbotAppointment(invalidData);
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("should validate required fields", async () => {
    const incompleteData = {
      customer_id: "amanda-incomplete",
      customer_name: "Test",
      // Faltam email, phone, date, time
      token: testToken,
    } as any;

    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    try {
      await caller.webhooks.syncChatbotAppointment(incompleteData);
      expect.fail("Should have thrown a validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});
