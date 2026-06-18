import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { deletePatient, getPatientCount } from "./db";
import { patients } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("deletePatient - Exclusão de Pacientes", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  afterAll(async () => {
    // Cleanup
  });

  it("deve deletar paciente sem filtro de userId", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Criar paciente de teste
    const result = await db.insert(patients).values({
      name: "Test Patient Delete",
      email: "delete-test@example.com",
      phone: "1234567890",
      status: "active",
      userId: 1,
    });

    const patientId = (result[0] as { insertId: number }).insertId;

    // Verificar que paciente foi criado
    const created = await db.select().from(patients).where(eq(patients.id, patientId));
    expect(created.length).toBe(1);

    // Deletar paciente
    await deletePatient(patientId, 1);

    // Verificar que paciente foi deletado
    const deleted = await db.select().from(patients).where(eq(patients.id, patientId));
    expect(deleted.length).toBe(0);
  });

  it("deve deletar paciente mesmo com userId diferente", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Criar paciente com userId = 1
    const result = await db.insert(patients).values({
      name: "Test Patient Delete 2",
      email: "delete-test-2@example.com",
      phone: "1234567890",
      status: "active",
      userId: 1,
    });

    const patientId = (result[0] as { insertId: number }).insertId;

    // Deletar com userId = 999 (diferente)
    // Deve deletar mesmo assim porque não há filtro de userId
    await deletePatient(patientId, 999);

    // Verificar que paciente foi deletado
    const deleted = await db.select().from(patients).where(eq(patients.id, patientId));
    expect(deleted.length).toBe(0);
  });

  it("getPatientCount deve contar todos os pacientes ativos", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Contar pacientes antes
    const countBefore = await getPatientCount(1);
    expect(typeof countBefore).toBe("number");
    expect(countBefore).toBeGreaterThanOrEqual(0);

    // Criar paciente
    await db.insert(patients).values({
      name: "Count Test Patient",
      email: "count-test@example.com",
      phone: "1234567890",
      status: "active",
      userId: 1,
    });

    // Contar pacientes depois
    const countAfter = await getPatientCount(1);
    expect(countAfter).toBe(countBefore + 1);
  });

  it("getPatientCount não deve filtrar por userId", async () => {
    if (!db) {
      console.log("Database not available, skipping test");
      return;
    }

    // Contar com userId = 1
    const count1 = await getPatientCount(1);

    // Contar com userId = 999
    const count999 = await getPatientCount(999);

    // Devem ser iguais porque não há filtro de userId
    expect(count1).toBe(count999);
  });
});
