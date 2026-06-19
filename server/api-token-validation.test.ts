import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApiToken, validateApiToken } from "./db-webhooks";
import { getDb } from "./db";
import { users, apiTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("API Token Validation - Foreign Key Integrity", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar um usuário de teste
    const result = await db.insert(users).values({
      email: `test-token-${Date.now()}@example.com`,
      name: "Test User for Tokens",
      role: "user",
    });
    testUserId = result.insertId || result[0]?.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (db && testUserId) {
      await db.delete(apiTokens).where(eq(apiTokens.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("deve criar token com userId válido", async () => {
    const result = await createApiToken(testUserId, "Test Token", "Token para testes");
    expect(result).toBeDefined();
    expect(result.token).toBeDefined();
    expect(result.token).toMatch(/^sk_/);
  });

  it("deve rejeitar userId inválido", async () => {
    const invalidUserId = 999999;
    try {
      await createApiToken(invalidUserId, "Invalid Token");
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("does not exist");
    }
  });

  it("deve validar token criado corretamente", async () => {
    const { token } = await createApiToken(testUserId, "Validation Test Token");
    const validatedToken = await validateApiToken(token);
    expect(validatedToken).toBeDefined();
    expect(validatedToken?.token).toBe(token);
    expect(validatedToken?.userId).toBe(testUserId);
  });

  it("deve rejeitar token inválido", async () => {
    const invalidToken = "sk_invalid_token_12345";
    const result = await validateApiToken(invalidToken);
    expect(result).toBeNull();
  });

  it("deve manter integridade referencial", async () => {
    // Criar token válido
    const { token } = await createApiToken(testUserId, "Integrity Test");

    // Verificar que o token foi criado com userId correto
    const tokenRecord = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.token, token));

    expect(tokenRecord.length).toBe(1);
    expect(tokenRecord[0].userId).toBe(testUserId);

    // Verificar que o userId referencia um usuário válido
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord[0].userId));

    expect(userRecord.length).toBe(1);
  });
});
