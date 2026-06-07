import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { apiTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Testes para validar tokens de E-SAÚDE
 */
describe("E-SAÚDE Tokens Validation", () => {
  it("Token do ChatBot Amanda deve ser válido", async () => {
    const token = process.env.ESAUDE_AGENT_TOKEN;
    expect(token).toBeDefined();
    expect(token).toBe("sk_tx19tplq8go4z2awfemx");
  });

  it("Token do Site Profissional deve ser válido", async () => {
    const token = process.env.ESAUDE_WEBHOOK_TOKEN;
    expect(token).toBeDefined();
    expect(token).toBe("psi_916535955161d408bb22e55356f2082da03fcedb310f61c6dfc2ddd4d8d5d3d");
  });

  it("Token da Clínica App deve ser válido", async () => {
    const token = process.env.ESAUDE_CLINIC_TOKEN;
    expect(token).toBeDefined();
    expect(token).toBe("sk_stsjbdx872gr51ejsoq6kb");
  });

  it("Token do ChatBot Amanda deve funcionar em syncChatbotAppointment", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });
    const token = process.env.ESAUDE_AGENT_TOKEN;

    const result = await caller.webhooks.syncChatbotAppointment({
      token: token!,
      customer_id: `test_${Date.now()}`,
      customer_name: "Test User",
      customer_email: `test_${Date.now()}@example.com`,
      appointment_date: "2026-06-20",
      appointment_time: "14:00",
      session_type: "presencial",
    });

    expect(result.success).toBe(true);
    expect(result.patientId).toBeDefined();
    expect(result.sessionId).toBeDefined();
  });

  it("Token do Site Profissional deve funcionar em appointmentFromWebsite", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });
    const token = process.env.ESAUDE_WEBHOOK_TOKEN;

    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
      consultationType: "Consulta",
      token: token!,
    });

    expect(result.success).toBe(true);
    expect(result.patientId).toBeDefined();
  });

  it("Token da Clínica App deve funcionar em createDirectBooking", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });
    const token = process.env.ESAUDE_CLINIC_TOKEN;

    const result = await caller.webhooks.createDirectBooking({
      token: token!,
      customer_id: `test_${Date.now()}`,
      customer_name: "Test User",
      customer_email: `test_${Date.now()}@example.com`,
      appointment_date: "2026-06-20",
      appointment_time: "14:00",
      session_type: "presencial",
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
  });

  it("Todos os tokens devem estar no banco de dados", async () => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const tokens = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.isActive, 1));

    expect(tokens.length).toBeGreaterThan(0);

    // Verificar que pelo menos um token de ChatBot existe
    const chatbotTokens = tokens.filter((t) => t.name?.includes("ChatBot") || t.name?.includes("Amanda"));
    expect(chatbotTokens.length).toBeGreaterThan(0);
  });
});
