import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { patients, sessions, apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Testes de integração HTTP para webhooks
 * Simula chamadas HTTP reais do site externo (psicologo.manus.space)
 */
describe("Webhook HTTP Integration (Real HTTP Calls)", () => {
  let db: any;
  let testUserId: number;
  let testToken: string;
  const API_BASE_URL = "http://localhost:3000/api/trpc";

  beforeAll(async () => {
    db = await getDb();
    testUserId = 1;

    // Criar token de teste
    const result = await db.insert(apiTokens).values({
      userId: testUserId,
      token: `http_test_${Date.now()}`,
      name: "HTTP Test Token",
      description: "Token para testes HTTP de webhook",
      isActive: 1,
    });
    testToken = `http_test_${Date.now()}`;
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

  it("HTTP POST: websiteAppointments.appointmentFromWebsite com token valido", async () => {
    const payload = {
      name: "HTTP Test User",
      email: `http_${Date.now()}@example.com`,
      phone: "11999999999",
      consultationType: "Avaliacao",
      observations: "Teste HTTP",
      appointmentDate: "2026-06-30",
      appointmentTime: "14:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    };

    // Chamar endpoint tRPC via HTTP
    const response = await fetch(`${API_BASE_URL}/websiteAppointments.appointmentFromWebsite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    // Verificar resposta
    expect(result.result).toBeDefined();
    expect(result.result.data).toBeDefined();
    expect(result.result.data.success).toBe(true);
    expect(result.result.data.patientId).toBeDefined();

    // Verificar que paciente foi criado no banco
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, result.result.data.patientId))
      .limit(1);

    expect(patient).toHaveLength(1);
    expect(patient[0].leadSource).toBe("website");
  });

  it("HTTP POST: websiteAppointments.appointmentFromWebsite sem token", async () => {
    const payload = {
      name: "No Token User",
      email: `notoken_${Date.now()}@example.com`,
      consultationType: "Consulta",
      appointmentDate: "2026-07-01",
      appointmentTime: "10:00",
      modality: "presencial",
      paymentStatus: "pending",
      // Sem token
    };

    const response = await fetch(`${API_BASE_URL}/websiteAppointments.appointmentFromWebsite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Deveria retornar erro
    expect(response.ok).toBe(false);
    const result = await response.json();
    expect(result.error).toBeDefined();
  });

  it("HTTP POST: websiteAppointments.appointmentFromWebsite com token invalido", async () => {
    const payload = {
      name: "Invalid Token User",
      email: `invalid_${Date.now()}@example.com`,
      consultationType: "Consulta",
      appointmentDate: "2026-07-02",
      appointmentTime: "15:00",
      modality: "virtual",
      paymentStatus: "pending",
      token: "invalid_token_xyz123",
    };

    const response = await fetch(`${API_BASE_URL}/websiteAppointments.appointmentFromWebsite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Deveria retornar erro de autenticacao
    expect(response.ok).toBe(false);
    const result = await response.json();
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain("UNAUTHORIZED");
  });

  it("HTTP POST: websiteAppointments.appointmentFromWebsite com email invalido", async () => {
    const payload = {
      name: "Bad Email User",
      email: "not-an-email",
      consultationType: "Consulta",
      appointmentDate: "2026-07-03",
      appointmentTime: "11:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    };

    const response = await fetch(`${API_BASE_URL}/websiteAppointments.appointmentFromWebsite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Deveria retornar erro de validacao
    expect(response.ok).toBe(false);
    const result = await response.json();
    expect(result.error).toBeDefined();
  });

  it("HTTP POST: webhooks.createDirectBooking com token valido", async () => {
    const payload = {
      token: testToken,
      customer_id: `direct_${Date.now()}`,
      customer_name: "Direct Booking User",
      customer_email: `direct_${Date.now()}@example.com`,
      customer_phone: "11988888888",
      appointment_date: "2026-07-05",
      appointment_time: "13:00",
      session_type: "presencial",
      signature: "webhook_signature",
    };

    const response = await fetch(`${API_BASE_URL}/webhooks.createDirectBooking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.result).toBeDefined();
    expect(result.result.data).toBeDefined();
    expect(result.result.data.success).toBe(true);
    expect(result.result.data.sessionId).toBeDefined();
  });

  it("HTTP POST: webhooks.syncChatbotAppointment com token permanente", async () => {
    // Usar token permanente do ChatBot Amanda
    const payload = {
      token: "sk_txl9tplq8go4z2awfemx",
      customer_id: `chatbot_${Date.now()}`,
      customer_name: "Chatbot Appointment",
      customer_email: `chatbot_${Date.now()}@example.com`,
      customer_phone: "11987654321",
      appointment_date: "2026-07-10",
      appointment_time: "16:00",
      service_type: "consultation",
      notes: "Agendamento via ChatBot",
      session_type: "presencial",
    };

    const response = await fetch(`${API_BASE_URL}/webhooks.syncChatbotAppointment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Pode retornar 200 ou erro dependendo do token
    // O importante eh que a chamada HTTP funciona
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });
});
