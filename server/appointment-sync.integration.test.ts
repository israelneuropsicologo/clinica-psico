import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { patients, sessions, apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Testes de integração para sincronização de agendamentos:
 * Site (psicologo.manus.space) → E-SAÚDE → Banco de Dados
 */
describe("Appointment Sync Integration (Site → E-SAÚDE)", () => {
  let db: any;
  let testUserId: number;
  let testToken: string;

  beforeAll(async () => {
    db = await getDb();
    testUserId = 1;

    // Criar token de teste
    const result = await db.insert(apiTokens).values({
      userId: testUserId,
      token: `test_sync_${Date.now()}`,
      name: "Test Sync Token",
      description: "Token para testes de sincronização",
      isActive: 1,
    });
    testToken = `test_sync_${Date.now()}`;
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

  it("Fluxo 1: Site envia agendamento → Paciente criado → Sessão agendada", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    // Step 1: Site envia agendamento
    const appointmentData = {
      name: "Pedro Costa",
      email: `pedro_${Date.now()}@example.com`,
      phone: "11987654321",
      consultationType: "Avaliação Psicológica",
      observations: "Encaminhado por médico",
      appointmentDate: "2026-06-20",
      appointmentTime: "13:30",
      modality: "presencial" as const,
      paymentStatus: "pending" as const,
      token: testToken,
    };

    const result = await caller.websiteAppointments.appointmentFromWebsite(appointmentData);

    // Step 2: Verificar paciente foi criado
    expect(result.success).toBe(true);
    expect(result.patientId).toBeDefined();

    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, result.patientId))
      .limit(1);

    expect(patient).toHaveLength(1);
    expect(patient[0].name).toBe("Pedro Costa");
    expect(patient[0].leadSource).toBe("website");
    expect(patient[0].leadStatus).toBe("lead");

    // Step 3: Verificar sessão foi criada com dados corretos
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
    expect(session[0].isPaid).toBe("pending");

    // Step 4: Verificar data/hora foram parseadas corretamente
    const scheduledDate = new Date(session[0].scheduledAt);
    expect(scheduledDate.getFullYear()).toBe(2026);
    expect(scheduledDate.getMonth()).toBe(5); // Junho (0-indexed)
    expect(scheduledDate.getDate()).toBe(20);
    expect(scheduledDate.getHours()).toBe(13);
    expect(scheduledDate.getMinutes()).toBe(30);
  });

  it("Fluxo 2: Múltiplos agendamentos do mesmo paciente", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });
    const email = `multi_${Date.now()}@example.com`;

    // Primeiro agendamento
    const result1 = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Lucia Ferreira",
      email,
      consultationType: "Primeira Consulta",
      appointmentDate: "2026-06-18",
      appointmentTime: "10:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    });

    // Segundo agendamento (mesmo paciente)
    const result2 = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Lucia Ferreira",
      email,
      consultationType: "Retorno",
      appointmentDate: "2026-06-25",
      appointmentTime: "14:00",
      modality: "virtual",
      paymentStatus: "approved",
      token: testToken,
    });

    // Verificar que é o mesmo paciente
    expect(result1.patientId).toBe(result2.patientId);

    // Verificar que ambas as sessões foram criadas
    const sessions_list = await db
      .select()
      .from(sessions)
      .where(eq(sessions.patientId, result1.patientId));

    expect(sessions_list.length).toBeGreaterThanOrEqual(2);

    // Primeira sessão: presencial, pendente
    const session1 = sessions_list.find((s: any) => s.modality === "in_person");
    expect(session1).toBeDefined();
    expect(session1.isPaid).toBe("pending");

    // Segunda sessão: online, paga
    const session2 = sessions_list.find((s: any) => s.modality === "online");
    expect(session2).toBeDefined();
    expect(session2.isPaid).toBe("paid");
  });

  it("Fluxo 3: Agendamento com dados mínimos", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Roberto Silva",
      email: `min_${Date.now()}@example.com`,
      consultationType: "Consulta",
      token: testToken,
    });

    expect(result.success).toBe(true);

    const patient = await db
      .select()
      .from(patients)
      .where(eq(patients.id, result.patientId))
      .limit(1);

    expect(patient[0].name).toBe("Roberto Silva");
    expect(patient[0].leadSource).toBe("website");
  });

  it("Fluxo 4: Validação de email obrigatório", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    try {
      await caller.websiteAppointments.appointmentFromWebsite({
        name: "Test User",
        email: "not-an-email",
        consultationType: "Consulta",
        token: testToken,
      });
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("email");
    }
  });

  it("Fluxo 5: Validação de nome obrigatório", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    try {
      await caller.websiteAppointments.appointmentFromWebsite({
        name: "",
        email: "test@example.com",
        consultationType: "Consulta",
        token: testToken,
      });
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("name");
    }
  });

  it("Fluxo 6: Agendamento aparece em 'Agendamentos Diretos'", async () => {
    const caller = appRouter.createCaller({ user: { id: testUserId, role: "admin" }, req: {}, res: {} });

    // Criar agendamento
    const appointmentResult = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Fernanda Oliveira",
      email: `fernanda_${Date.now()}@example.com`,
      consultationType: "Avaliação",
      appointmentDate: "2026-06-22",
      appointmentTime: "15:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    });

    // Buscar sessões agendadas
    const sessions_list = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, testUserId),
          eq(sessions.status, "scheduled")
        )
      );

    // Verificar que o agendamento está na lista
    const newAppointment = sessions_list.find(
      (s: any) => s.patientId === appointmentResult.patientId
    );

    expect(newAppointment).toBeDefined();
    expect(newAppointment.status).toBe("scheduled");
  });

  it("Fluxo 7: Sincronização de pagamento", async () => {
    const caller = appRouter.createCaller({ user: null, req: {}, res: {} });

    // Agendamento com pagamento pendente
    const result = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Gabriel Martins",
      email: `gabriel_${Date.now()}@example.com`,
      consultationType: "Consulta",
      appointmentDate: "2026-06-28",
      appointmentTime: "11:00",
      modality: "presencial",
      paymentStatus: "pending",
      token: testToken,
    });

    let session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.patientId, result.patientId))
      .limit(1);

    expect(session[0].isPaid).toBe("pending");

    // Agendamento com pagamento aprovado
    const result2 = await caller.websiteAppointments.appointmentFromWebsite({
      name: "Gabriel Martins",
      email: `gabriel_${Date.now()}@example.com`,
      consultationType: "Retorno",
      appointmentDate: "2026-07-05",
      appointmentTime: "16:00",
      modality: "virtual",
      paymentStatus: "approved",
      token: testToken,
    });

    session = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.patientId, result2.patientId),
          eq(sessions.modality, "online")
        )
      )
      .limit(1);

    expect(session[0].isPaid).toBe("paid");
  });
});
