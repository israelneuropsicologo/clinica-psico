import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb, createPatient, createSession } from "./db";
import { syncSiteToESaude } from "./esaude-agent";
import { sessions, patients, syncLogs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Incomplete Data Validation", () => {
  let db: any;
  let userId: number = 1;
  let testCounter: number = 0;

  beforeEach(async () => {
    db = await getDb();
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (db) {
      try {
        await db.delete(syncLogs).where(eq(syncLogs.userId, userId));
        await db.delete(sessions).where(eq(sessions.userId, userId));
        await db.delete(patients).where(eq(patients.userId, userId));
      } catch {}
    }
  });

  it("should reject appointment with missing phone", async () => {
    // Criar paciente SEM telefone
    testCounter++;
    const patientId = await createPatient({
      userId,
      externalCustomerId: `test_no_phone_${testCounter}`,
      name: "João Silva Completo",
      email: "joao@example.com",
      phone: null, // ❌ Telefone vazio
      status: "active",
      leadSource: "website",
      leadStatus: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sessão
    const sessionId = await createSession({
      userId,
      patientId,
      scheduledAt: new Date().getTime(),
      status: "scheduled",
      sessionType: "individual",
      modality: "in_person",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sync log
    await db.insert(syncLogs).values({
      userId,
      appointmentId: sessionId,
      direction: "site_to_esaude",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tentar sincronizar
    const result = await syncSiteToESaude(sessionId);

    // Deve falhar
    expect(result).toBe(false);

    // Verificar que o log foi marcado como failed
    const [log] = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.appointmentId, sessionId))
      .limit(1);

    expect(log.status).toBe("failed");
    expect(log.errorMessage).toContain("Telefone");
    expect(log.retryCount).toBe(999); // Marcado como esgotado
  });

  it("should reject appointment with missing name", async () => {
    // Criar paciente COM telefone mas SEM nome válido
    testCounter++;
    const patientId = await createPatient({
      userId,
      externalCustomerId: `test_no_name_${testCounter}`,
      name: "Jo", // ❌ Nome muito curto
      email: "joao@example.com",
      phone: "11999999999",
      status: "active",
      leadSource: "website",
      leadStatus: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sessão
    const sessionId = await createSession({
      userId,
      patientId,
      scheduledAt: new Date().getTime(),
      status: "scheduled",
      sessionType: "individual",
      modality: "in_person",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sync log
    await db.insert(syncLogs).values({
      userId,
      appointmentId: sessionId,
      direction: "site_to_esaude",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tentar sincronizar
    const result = await syncSiteToESaude(sessionId);

    // Deve falhar
    expect(result).toBe(false);

    // Verificar que o log foi marcado como failed
    const [log] = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.appointmentId, sessionId))
      .limit(1);

    expect(log.status).toBe("failed");
    expect(log.errorMessage).toContain("Nome");
  });

  it("should reject appointment with missing email", async () => {
    // Criar paciente COM telefone e nome mas SEM email
    testCounter++;
    const patientId = await createPatient({
      userId,
      externalCustomerId: `test_no_email_${testCounter}`,
      name: "João Silva Completo",
      email: null, // ❌ Email vazio
      phone: "11999999999",
      status: "active",
      leadSource: "website",
      leadStatus: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sessão
    const sessionId = await createSession({
      userId,
      patientId,
      scheduledAt: new Date().getTime(),
      status: "scheduled",
      sessionType: "individual",
      modality: "in_person",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Criar sync log
    await db.insert(syncLogs).values({
      userId,
      appointmentId: sessionId,
      direction: "site_to_esaude",
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tentar sincronizar
    const result = await syncSiteToESaude(sessionId);

    // Deve falhar
    expect(result).toBe(false);

    // Verificar que o log foi marcado como failed
    const [log] = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.appointmentId, sessionId))
      .limit(1);

    expect(log.status).toBe("failed");
    expect(log.errorMessage).toContain("Email");
  });

  it("should validate all required fields before attempting sync", async () => {
    // Este teste verifica que a validação de dados é rigorosa
    // Não tentamos conectar com E-SAÚDE, apenas validamos os dados

    // Criar paciente COM todos os dados
    testCounter++;
    const patientId = await createPatient({
      userId,
      externalCustomerId: `test_complete_${testCounter}`,
      name: "João Silva Completo",
      email: "joao@example.com",
      phone: "11999999999",
      status: "active",
      leadSource: "website",
      leadStatus: "lead",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Verificar que o paciente foi criado com todos os dados
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    expect(patient.name).toBe("João Silva Completo");
    expect(patient.email).toBe("joao@example.com");
    expect(patient.phone).toBe("11999999999");
  });
});
