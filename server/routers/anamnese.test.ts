import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { anamneseV1, users } from "../../drizzle/schema";
import { getDb } from "../db";

describe("Anamnese Router", () => {
  let db: any;
  let testUserId: number;
  const testPatientId = 9999;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Create a test user if it doesn't exist
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-anamnese-user"))
      .limit(1);

    if (existingUser.length > 0) {
      testUserId = existingUser[0].id;
    } else {
      const result = await db.insert(users).values({
        openId: "test-anamnese-user",
        name: "Test User for Anamnese",
        email: "test-anamnese@example.com",
        loginMethod: "test",
      });
      testUserId = result[0]?.insertId || 1;
    }

    // Clean up test data before tests
    await db.delete(anamneseV1).where(eq(anamneseV1.patientId, testPatientId));
  });

  afterAll(async () => {
    // Clean up test data after tests
    if (db) {
      await db.delete(anamneseV1).where(eq(anamneseV1.patientId, testPatientId));
      // Clean up test user
      await db.delete(users).where(eq(users.openId, "test-anamnese-user"));
    }
  });

  it("should insert a new anamnese record", async () => {
    const testData = {
      patientId: testPatientId,
      userId: testUserId,
      mainComplaintDetail: "Teste de queixa principal",
      therapeuticGoals: "Teste de objetivos terapêuticos",
      cidCode: "F41.1",
      cidDescription: "Transtorno de ansiedade",
    };

    await db.insert(anamneseV1).values(testData);

    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, testPatientId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].mainComplaintDetail).toBe("Teste de queixa principal");
    expect(result[0].cidCode).toBe("F41.1");
  });

  it("should update an existing anamnese record", async () => {
    const updatedData = {
      therapeuticGoals: "Objetivos atualizados",
      personalHistory: "Histórico pessoal atualizado",
    };

    await db
      .update(anamneseV1)
      .set(updatedData)
      .where(eq(anamneseV1.patientId, testPatientId));

    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, testPatientId))
      .limit(1);

    expect(result[0].therapeuticGoals).toBe("Objetivos atualizados");
    expect(result[0].personalHistory).toBe("Histórico pessoal atualizado");
  });

  it("should retrieve anamnese by patient id", async () => {
    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, testPatientId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].patientId).toBe(testPatientId);
  });

  it("should return null for non-existent patient", async () => {
    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, 99999))
      .limit(1);

    expect(result).toHaveLength(0);
  });

  it("should handle all text fields", async () => {
    const completeData = {
      mainComplaintDetail: "Queixa principal completa",
      therapeuticGoals: "Objetivos terapêuticos completos",
      cidCode: "F32.9",
      cidDescription: "Episódio depressivo",
      therapeuticApproach: "Abordagem cognitivo-comportamental",
      currentDiseaseHistory: "Histórico da doença atual",
      personalHistory: "Histórico pessoal",
      familyHistory: "Histórico familiar",
      psychiatricHistory: "Histórico psiquiátrico",
      previousTreatments: "Tratamentos anteriores",
      childhoodHistory: "Histórico da infância",
      relationshipHistory: "Histórico relacional",
      professionalHistory: "Histórico profissional",
      substanceUse: "Uso de substâncias",
      sleepAndEating: "Sono e alimentação",
      sexualAffectiveLife: "Vida sexual e afetiva",
      riskFactors: "Fatores de risco",
      protectiveFactors: "Fatores protetivos",
      additionalNotes: "Observações adicionais",
    };

    await db
      .update(anamneseV1)
      .set(completeData)
      .where(eq(anamneseV1.patientId, testPatientId));

    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, testPatientId))
      .limit(1);

    expect(result[0].mainComplaintDetail).toBe("Queixa principal completa");
    expect(result[0].therapeuticApproach).toBe("Abordagem cognitivo-comportamental");
    expect(result[0].additionalNotes).toBe("Observações adicionais");
    expect(result[0].riskFactors).toBe("Fatores de risco");
  });

  it("should handle partial updates", async () => {
    const partialUpdate = {
      mainComplaintDetail: "Apenas queixa atualizada",
    };

    await db
      .update(anamneseV1)
      .set(partialUpdate)
      .where(eq(anamneseV1.patientId, testPatientId));

    const result = await db
      .select()
      .from(anamneseV1)
      .where(eq(anamneseV1.patientId, testPatientId))
      .limit(1);

    expect(result[0].mainComplaintDetail).toBe("Apenas queixa atualizada");
    // Other fields should remain unchanged
    expect(result[0].therapeuticApproach).toBe("Abordagem cognitivo-comportamental");
  });
});
