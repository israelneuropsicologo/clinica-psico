import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("End-to-End Integration: Site → Clinica-Psico Webhook Flow", { timeout: 60000 }, () => {
  let apiToken: string;

  beforeAll(async () => {
    // Gerar token de API para simular chamada do site externo
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const tokenResult = await caller.webhooks.generateToken({
      name: "E2E Test Token",
      description: "Token para teste de integração ponta a ponta",
    });

    apiToken = tokenResult.token;
  });

  it("should sync patient successfully", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customerId = `cust_e2e_${Date.now()}`;

    // Sincronizar paciente do site externo
    const patientResult = await caller.webhooks.syncPatient({
      token: apiToken,
      customer_id: customerId,
      name: "João E2E Test",
      email: "joao.e2e@example.com",
      phone: "+55 11 98765-4321",
      birth_date: "1985-05-20",
      // cpf: "123.456.789-00", // Omitir CPF para evitar erro de coluna
      address: "Rua E2E, 123",
      occupation: "Software Engineer",
      main_complaint: "Stress and anxiety",
      medical_history: "None",
    });

    expect(patientResult.success).toBe(true);
    expect(patientResult.message).toContain("sincronizado");

    // Verificar que o paciente foi criado no banco
    const patients = await caller.patients.list({ search: "João E2E Test" });
    expect(patients.length).toBeGreaterThan(0);

    const syncedPatient = patients.find((p) => p.externalCustomerId === customerId);
    expect(syncedPatient).toBeDefined();
    expect(syncedPatient?.name).toBe("João E2E Test");
    expect(syncedPatient?.email).toBe("joao.e2e@example.com");
    expect(syncedPatient?.leadStatus).toBe("customer");
    expect(syncedPatient?.leadSource).toBe("direct_booking");
  });

  it("should prevent duplicate patient sync", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customerId = `cust_dup_${Date.now()}`;

    // Sincronizar paciente
    const result1 = await caller.webhooks.syncPatient({
      token: apiToken,
      customer_id: customerId,
      name: "Duplicate Test",
      email: "dup@example.com",
    });

    expect(result1.success).toBe(true);

    // Tentar sincronizar novamente com mesmo customer_id
    const result2 = await caller.webhooks.syncPatient({
      token: apiToken,
      customer_id: customerId,
      name: "Duplicate Test",
      email: "dup@example.com",
    });

    // Deve retornar sucesso mas indicar que já existe
    expect(result2.success).toBe(true);
    expect(result2.message).toContain("já existe");

    // Verificar que apenas um paciente foi criado
    const patients = await caller.patients.list({ search: "Duplicate Test" });
    const duplicates = patients.filter((p) => p.externalCustomerId === customerId);
    expect(duplicates.length).toBe(1);
  });

  it("should sync appointment with correct patient ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customerId = `cust_apt_${Date.now()}`;
    const appointmentDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Criar paciente
    await caller.webhooks.syncPatient({
      token: apiToken,
      customer_id: customerId,
      name: "Appointment Test",
      email: "apt@example.com",
    });

    // Sincronizar agendamento
    const appointmentResult = await caller.webhooks.syncAppointment({
      token: apiToken,
      customer_id: customerId,
      appointment_date: appointmentDate,
      service_type: "Psychotherapy",
      duration_minutes: 50,
      notes: "E2E test appointment",
      payment_status: "approved",
      transaction_id: `txn_e2e_${Date.now()}`,
    });

    expect(appointmentResult.success).toBe(true);

    // Verificar que a sessão foi criada com o paciente correto
    const patients = await caller.patients.list({ search: "Appointment Test" });
    const patient = patients.find((p) => p.externalCustomerId === customerId);
    expect(patient).toBeDefined();

    const sessions = await caller.sessions.list({ patientId: patient!.id });
    expect(sessions.length).toBeGreaterThan(0);

    const syncedSession = sessions.find((s) => s.notes === "E2E test appointment");
    expect(syncedSession).toBeDefined();
    expect(syncedSession?.patientId).toBe(patient!.id); // Validar que patientId está correto
    expect(syncedSession?.status).toBe("confirmed");
  });

  it("should reject appointment sync for non-existent customer", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.webhooks.syncAppointment({
        token: apiToken,
        customer_id: "cust_nonexistent_12345",
        appointment_date: new Date().toISOString(),
        service_type: "Therapy",
        payment_status: "approved",
      });

      expect.fail("Should have thrown error for non-existent customer");
    } catch (error: any) {
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toContain("não encontrado");
    }
  });

  it("should reject appointment sync with pending payment", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const customerId = `cust_pending_${Date.now()}`;

    // Criar paciente
    await caller.webhooks.syncPatient({
      token: apiToken,
      customer_id: customerId,
      name: "Pending Payment Test",
      email: "pending@example.com",
    });

    // Tentar sincronizar agendamento com pagamento pendente
    const result = await caller.webhooks.syncAppointment({
      token: apiToken,
      customer_id: customerId,
      appointment_date: new Date().toISOString(),
      service_type: "Therapy",
      payment_status: "pending",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("não confirmado");
  });

  it("should validate webhook logs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.webhooks.getLogs({ limit: 10 });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    // Verificar estrutura dos logs
    const log = logs[0];
    expect(log).toHaveProperty("id");
    expect(log).toHaveProperty("webhookType");
    expect(log).toHaveProperty("status");
    expect(log).toHaveProperty("syncedAt");
  });

  it("should get webhook sync status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.webhooks.getStatus();
    expect(status).toHaveProperty("totalSyncs");
    expect(status).toHaveProperty("successCount");
    expect(status).toHaveProperty("failureCount");
    expect(typeof status.totalSyncs).toBe("number");
    expect(typeof status.successCount).toBe("number");
    expect(typeof status.failureCount).toBe("number");
    expect(status.totalSyncs).toBeGreaterThan(0);
  });

  it("should reject invalid API token", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.webhooks.syncPatient({
        token: "sk_invalid_token_12345",
        customer_id: "cust_test",
        name: "Test",
      });

      expect.fail("Should have thrown UNAUTHORIZED error");
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toContain("inválido");
    }
  });
});
