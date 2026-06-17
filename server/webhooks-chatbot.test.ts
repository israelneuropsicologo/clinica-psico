import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { createApiToken } from "./db-webhooks";

describe("ChatBot Webhook Integration", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userId: number;
  let apiToken: string;

  beforeAll(async () => {
    // Criar contexto com usuário autenticado
    const ctx = await createContext({
      req: { headers: {} },
      res: {},
    });

    // Usar ID de teste
    userId = ctx.user?.id || 1;
    caller = appRouter.createCaller(ctx);

    // Gerar token de API para testes
    const tokenResult = await createApiToken(userId, "test-token", "Token para testes");
    apiToken = tokenResult.token;
  });

  it("deve sincronizar agendamento do ChatBot e criar sessão", async () => {
    const appointmentData = {
      customer_id: "chatbot-test-001",
      customer_name: "João Silva",
      customer_email: "joao@example.com",
      customer_phone: "(21) 98765-4321",
      appointment_date: "2026-05-10",
      appointment_time: "15:00",
      service_type: "consultation",
      notes: "Teste de agendamento via ChatBot",
      session_type: "presencial" as const,
      token: apiToken,
    };

    const result = await caller.webhooks.syncChatbotAppointment(appointmentData);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
    expect(result.patientId).toBeDefined();
    expect(result.message).toContain("sucesso");
  });

  it("deve criar paciente como customer quando agendamento é sincronizado", async () => {
    const appointmentData = {
      customer_id: "chatbot-test-002",
      customer_name: "Maria Santos",
      customer_email: "maria@example.com",
      customer_phone: "(21) 99876-5432",
      appointment_date: "2026-05-12",
      appointment_time: "14:00",
      service_type: "consultation",
      notes: "Segundo teste",
      session_type: "online" as const,
      token: apiToken,
    };

    const result = await caller.webhooks.syncChatbotAppointment(appointmentData);

    expect(result.success).toBe(true);
    expect(result.patientId).toBeDefined();
  });

  it("deve atualizar paciente existente quando faz novo agendamento", async () => {
    const customerId = "chatbot-test-003";

    // Primeiro agendamento
    const firstAppointment = {
      customer_id: customerId,
      customer_name: "Pedro Costa",
      customer_email: "pedro@example.com",
      customer_phone: "(21) 97654-3210",
      appointment_date: "2026-05-15",
      appointment_time: "10:00",
      service_type: "consultation",
      notes: "Primeiro agendamento",
      session_type: "presencial" as const,
      token: apiToken,
    };

    const result1 = await caller.webhooks.syncChatbotAppointment(firstAppointment);
    const patientId1 = result1.patientId;

    // Segundo agendamento do mesmo cliente
    const secondAppointment = {
      ...firstAppointment,
      appointment_date: "2026-05-20",
      appointment_time: "11:00",
      notes: "Segundo agendamento",
    };

    const result2 = await caller.webhooks.syncChatbotAppointment(secondAppointment);
    const patientId2 = result2.patientId;

    // Deve ser o mesmo paciente
    expect(patientId1).toBe(patientId2);
  });

  it("deve criar sessão com dados corretos (online)", async () => {
    const appointmentData = {
      customer_id: "chatbot-test-004",
      customer_name: "Ana Paula",
      customer_email: "ana@example.com",
      customer_phone: "(21) 96543-2109",
      appointment_date: "2026-05-25",
      appointment_time: "16:30",
      service_type: "consultation",
      notes: "Teste de sessão online",
      session_type: "online" as const,
      token: apiToken,
    };

    const result = await caller.webhooks.syncChatbotAppointment(appointmentData);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
  });

  it("deve criar sessão com dados corretos (presencial)", async () => {
    const appointmentData = {
      customer_id: "chatbot-test-005",
      customer_name: "Carlos Silva",
      customer_email: "carlos@example.com",
      customer_phone: "(21) 95432-1098",
      appointment_date: "2026-06-01",
      appointment_time: "09:00",
      service_type: "consultation",
      notes: "Teste de sessão presencial",
      session_type: "presencial" as const,
      token: apiToken,
    };

    const result = await caller.webhooks.syncChatbotAppointment(appointmentData);

    expect(result.success).toBe(true);
    expect(result.sessionId).toBeDefined();
  });
});
