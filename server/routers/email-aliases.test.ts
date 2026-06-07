import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { emailAliasesRouter } from "./email-aliases";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users, emailAliases } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Email Aliases Router", () => {
  let db: any;
  let adminUserId: number;
  let regularUserId: number;
  let adminCaller: any;
  let regularCaller: any;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar usuário admin
    const adminResult = await db.insert(users).values({
      openId: `admin-${Date.now()}`,
      name: "Admin User",
      email: `admin-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    adminUserId = (adminResult[0] as { insertId: number }).insertId;

    // Criar usuário regular
    const regularResult = await db.insert(users).values({
      openId: `regular-${Date.now()}`,
      name: "Regular User",
      email: `regular-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    regularUserId = (regularResult[0] as { insertId: number }).insertId;

    // Criar callers
    const adminCtx = {
      user: {
        id: adminUserId,
        openId: `admin-${Date.now()}`,
        role: "admin",
        email: `admin-${Date.now()}@test.com`,
      },
    };

    const regularCtx = {
      user: {
        id: regularUserId,
        openId: `regular-${Date.now()}`,
        role: "user",
        email: `regular-${Date.now()}@test.com`,
      },
    };

    adminCaller = appRouter.createCaller(adminCtx);
    regularCaller = appRouter.createCaller(regularCtx);
  });

  afterEach(async () => {
    if (!db) return;

    // Limpar dados de teste
    await db.delete(emailAliases).where(eq(emailAliases.userId, adminUserId));
    await db.delete(emailAliases).where(eq(emailAliases.userId, regularUserId));
    await db.delete(users).where(eq(users.id, adminUserId));
    await db.delete(users).where(eq(users.id, regularUserId));
  });

  describe("addAlias", () => {
    it("deve permitir que admin adicione um alias", async () => {
      const result = await adminCaller.emailAliases.addAlias({
        userId: regularUserId,
        email: `alias-${Date.now()}@test.com`,
        isPrimary: false,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("adicionado com sucesso");
    });

    it("deve impedir que usuário regular adicione alias", async () => {
      await expect(
        regularCaller.emailAliases.addAlias({
          userId: regularUserId,
          email: `alias-${Date.now()}@test.com`,
          isPrimary: false,
        })
      ).rejects.toThrow("Apenas administradores");
    });

    it("deve rejeitar email duplicado", async () => {
      const email = `duplicate-${Date.now()}@test.com`;

      // Criar usuário com esse email
      const userResult = await db.insert(users).values({
        openId: `user-${Date.now()}`,
        name: "Test User",
        email: email,
        loginMethod: "test",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      const userId = (userResult[0] as { insertId: number }).insertId;

      // Tentar adicionar como alias
      await expect(
        adminCaller.emailAliases.addAlias({
          userId: regularUserId,
          email: email,
          isPrimary: false,
        })
      ).rejects.toThrow("já está em uso");

      // Limpar
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe("removeAlias", () => {
    it("deve permitir que admin remova um alias", async () => {
      const email = `alias-${Date.now()}@test.com`;

      // Adicionar alias
      await adminCaller.emailAliases.addAlias({
        userId: regularUserId,
        email: email,
        isPrimary: false,
      });

      // Remover alias
      const result = await adminCaller.emailAliases.removeAlias({ email });

      expect(result.success).toBe(true);
      expect(result.message).toContain("removido com sucesso");
    });

    it("deve impedir que usuário regular remova alias", async () => {
      const email = `alias-${Date.now()}@test.com`;

      // Adicionar alias como admin
      await adminCaller.emailAliases.addAlias({
        userId: regularUserId,
        email: email,
        isPrimary: false,
      });

      // Tentar remover como regular
      await expect(regularCaller.emailAliases.removeAlias({ email })).rejects.toThrow(
        "Apenas administradores"
      );
    });
  });

  describe("listAliases", () => {
    it("deve permitir que admin liste aliases de um usuário", async () => {
      const email = `alias-${Date.now()}@test.com`;

      // Adicionar alias
      await adminCaller.emailAliases.addAlias({
        userId: regularUserId,
        email: email,
        isPrimary: false,
      });

      // Listar aliases
      const result = await adminCaller.emailAliases.listAliases({
        userId: regularUserId,
      });

      expect(result.success).toBe(true);
      expect(result.aliases).toContain(email);
    });

    it("deve impedir que usuário regular liste aliases de outro usuário", async () => {
      await expect(
        regularCaller.emailAliases.listAliases({
          userId: adminUserId,
        })
      ).rejects.toThrow("Apenas administradores");
    });

    it("deve retornar lista vazia se usuário não tem aliases", async () => {
      const result = await adminCaller.emailAliases.listAliases({
        userId: regularUserId,
      });

      expect(result.success).toBe(true);
      expect(result.aliases).toHaveLength(0);
    });
  });

  describe("myAliases", () => {
    it("deve permitir que usuário veja seus próprios aliases", async () => {
      const email = `alias-${Date.now()}@test.com`;

      // Adicionar alias como admin
      await adminCaller.emailAliases.addAlias({
        userId: regularUserId,
        email: email,
        isPrimary: false,
      });

      // Usuário regular vê seus aliases
      const result = await regularCaller.emailAliases.myAliases();

      expect(result.success).toBe(true);
      expect(result.aliases).toContain(email);
    });

    it("deve retornar lista vazia se usuário não tem aliases", async () => {
      const result = await regularCaller.emailAliases.myAliases();

      expect(result.success).toBe(true);
      expect(result.aliases).toHaveLength(0);
    });
  });
});
