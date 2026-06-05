import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { patients, sessions, apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Website Appointments Integration", () => {
  let db: any;
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    db = await getDb();
    testUserId = 1;

    // Criar token de teste
    const result = await db.insert(apiTokens).values({
      userId: testUserId,
      token: `test_website_${Date.now()}`,
      name: "Test Website Token",
      description: "Token para testes de agendamento do site",
      isActive: 1,
    });
    testToken = `test_website_${Date.now()}`;
  });

  afterAll(async () => {
    // Limpar dados de teste
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

  it("deve criar novo paciente e agendamento do site", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "João Silva",
      email: "joao@example.com",
      phone: "11999999999",
      consultationType: "Psicologia Clínica",
      observations: "Primeira consulta",
      appointmentDate: "2026-06-15",
      appointmentTime: "14:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    });

    expect(result.success).toBe(true);
    expect(result.patientId).toBeDefined();
    expect(typeof result.patientId).toBe("number");

    // Verificar se paciente foi criado
    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, result.patientId))
      .limit(1);

    expect(patient).toHaveLength(1);
    expect(patient[0].name).toBe("João Silva");
    expect(patient[0].email).toBe("joao@example.com");
    expect(patient[0].leadSource).toBe("website");
    expect(patient[0].leadStatus).toBe("lead");

    // Verificar se agendamento foi criado
    const session = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, testUserId),
          eq(sessions.patientId, result.patientId)
        )
      )
      .limit(1);

    expect(session).toHaveLength(1);
    expect(session[0].status).toBe("scheduled");
    expect(session[0].modality).toBe("in_person");
  });

  it("deve atualizar paciente existente e criar novo agendamento", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    const email = `update_test_${Date.now()}@example.com`;

    // Primeiro agendamento
    const result1 = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Maria Santos",
      email,
      phone: "11988888888",
      consultationType: "Terapia de Casal",
      observations: "Primeira consulta",
      appointmentDate: "2026-06-15",
      appointmentTime: "10:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    });

    expect(result1.success).toBe(true);

    // Segundo agendamento (mesmo paciente)
    const result2 = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Maria Santos",
      email,
      phone: "11988888888",
      consultationType: "Terapia de Casal",
      observations: "Segunda consulta",
      appointmentDate: "2026-06-22",
      appointmentTime: "15:00",
      modality: "virtual",
      paymentStatus: "pending",
      token: testToken,
    });

    expect(result2.success).toBe(true);
    expect(result2.patientId).toBe(result1.patientId);

    // Verificar que paciente não foi duplicado
    const patientCount = await db
      .select()
      .from(patients)
      .where(
        and(
          eq(patients.userId, testUserId),
          eq(patients.email, email)
        )
      );

    expect(patientCount).toHaveLength(1);

    // Verificar que ambos agendamentos foram criados
    const sessions_list = await db
      .select()
      .from(sessions)
      .where(eq(sessions.patientId, result1.patientId));

    expect(sessions_list.length).toBeGreaterThanOrEqual(2);
  });

  it("deve rejeitar token inválido", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    try {
      await caller.websiteAppointments.appointmentFromWebsite({
        name: "Test User",
        email: "test@example.com",
        consultationType: "Consulta",
        appointmentDate: "2026-06-15",
        appointmentTime: "14:00",
        modality: "presencial",
        paymentStatus: "pending",
        token: "invalid_token_12345",
      });
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });

  it("deve validar email obrigatório", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    try {
      await caller.websiteAppointments.appointmentFromWebsite({
        name: "Test User",
        email: "invalid-email",
        consultationType: "Consulta",
        appointmentDate: "2026-06-15",
        appointmentTime: "14:00",
        modality: "presencial",
        paymentStatus: "pending",
        token: testToken,
      });
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("email");
    }
  });

  it("deve criar agendamento com modality=virtual (online)", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Ana Costa",
      email: `ana_${Date.now()}@example.com`,
      consultationType: "Psicologia Online",
      appointmentDate: "2026-06-20",
      appointmentTime: "16:00",
      modality: "virtual",
      paymentStatus: "pending",
      token: testToken,
    });

    expect(result.success).toBe(true);

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.patientId, result.patientId))
      .limit(1);

    expect(session[0].modality).toBe("online");
  });

  it("deve respeitar status de pagamento", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Carlos Mendes",
      email: `carlos_${Date.now()}@example.com`,
      consultationType: "Consulta",
      appointmentDate: "2026-06-25",
      appointmentTime: "11:00",
      modality: "presencial",
      paymentStatus: "approved",
      token: testToken,
    });

    expect(result.success).toBe(true);

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.patientId, result.patientId))
      .limit(1);

    expect(session[0].isPaid).toBe("paid");
  });
});
