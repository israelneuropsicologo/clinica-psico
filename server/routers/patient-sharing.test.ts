import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sharePatient, unsharePatient, getSharedWith, getSharedPatients, getSharePermission, canAccessPatient } from "../db";
import { getDb } from "../db";
import { patients, users, userShares } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Patient Sharing", () => {
  let db: any;
  let userId1: number;
  let userId2: number;
  let patientId: number;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar usuários de teste
    const user1Result = await db.insert(users).values({
      openId: `test-user-1-${Date.now()}`,
      name: "Test User 1",
      email: `user1-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    userId1 = (user1Result[0] as { insertId: number }).insertId;

    const user2Result = await db.insert(users).values({
      openId: `test-user-2-${Date.now()}`,
      name: "Test User 2",
      email: `user2-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    userId2 = (user2Result[0] as { insertId: number }).insertId;

    // Criar paciente de teste
    const patientResult = await db.insert(patients).values({
      userId: userId1,
      name: "Test Patient",
      email: `patient-${Date.now()}@test.com`,
      status: "active",
      leadSource: "manual",
      leadStatus: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    patientId = (patientResult[0] as { insertId: number }).insertId;
  });

  afterEach(async () => {
    if (!db) return;

    // Limpar dados de teste
    await db.delete(userShares).where(eq(userShares.patientId, patientId));
    await db.delete(patients).where(eq(patients.id, patientId));
    await db.delete(users).where(eq(users.id, userId1));
    await db.delete(users).where(eq(users.id, userId2));
  });

  describe("sharePatient", () => {
    it("deve compartilhar um paciente com outro usuário", async () => {
      const shareId = await sharePatient(userId1, userId2, patientId, "view");
      expect(shareId).toBeGreaterThan(0);

      // Verificar se o compartilhamento foi criado
      const shares = await getSharedWith(patientId, userId1);
      expect(shares).toHaveLength(1);
      expect(shares[0].toUserId).toBe(userId2);
      expect(shares[0].permission).toBe("view");
    });

    it("deve atualizar permissão se compartilhamento já existe", async () => {
      // Compartilhar com permissão "view"
      await sharePatient(userId1, userId2, patientId, "view");

      // Compartilhar novamente com permissão "edit"
      const shareId = await sharePatient(userId1, userId2, patientId, "edit");
      expect(shareId).toBeGreaterThan(0);

      // Verificar se a permissão foi atualizada
      const shares = await getSharedWith(patientId, userId1);
      expect(shares).toHaveLength(1);
      expect(shares[0].permission).toBe("edit");
    });

    it("deve lançar erro ao compartilhar paciente que não pertence ao usuário", async () => {
      // Tentar compartilhar paciente de outro usuário
      await expect(sharePatient(userId2, userId1, patientId, "view")).rejects.toThrow(
        "Patient not found or you don't have permission to share it"
      );
    });

    it("deve lançar erro ao compartilhar com o mesmo usuário", async () => {
      // Tentar compartilhar consigo mesmo
      await expect(sharePatient(userId1, userId1, patientId, "view")).rejects.toThrow();
    });
  });

  describe("unsharePatient", () => {
    it("deve remover compartilhamento de um paciente", async () => {
      // Compartilhar
      await sharePatient(userId1, userId2, patientId, "view");

      // Remover compartilhamento
      const removed = await unsharePatient(userId1, userId2, patientId);
      expect(removed).toBe(true);

      // Verificar se foi removido
      const shares = await getSharedWith(patientId, userId1);
      expect(shares).toHaveLength(0);
    });

    it("deve retornar false ao remover compartilhamento inexistente", async () => {
      const removed = await unsharePatient(userId1, userId2, patientId);
      expect(removed).toBe(false);
    });

    it("deve lançar erro ao remover compartilhamento de paciente que não pertence", async () => {
      // Compartilhar
      await sharePatient(userId1, userId2, patientId, "view");

      // Tentar remover com usuário diferente
      await expect(unsharePatient(userId2, userId1, patientId)).rejects.toThrow(
        "Patient not found or you don't have permission"
      );
    });
  });

  describe("getSharedWith", () => {
    it("deve listar usuários com quem um paciente foi compartilhado", async () => {
      // Compartilhar com dois usuários
      const user3Result = await db.insert(users).values({
        openId: `test-user-3-${Date.now()}`,
        name: "Test User 3",
        email: `user3-${Date.now()}@test.com`,
        loginMethod: "test",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      const userId3 = (user3Result[0] as { insertId: number }).insertId;

      await sharePatient(userId1, userId2, patientId, "view");
      await sharePatient(userId1, userId3, patientId, "edit");

      // Listar compartilhamentos
      const shares = await getSharedWith(patientId, userId1);
      expect(shares).toHaveLength(2);
      expect(shares.map((s) => s.toUserId)).toContain(userId2);
      expect(shares.map((s) => s.toUserId)).toContain(userId3);

      // Limpar
      await db.delete(users).where(eq(users.id, userId3));
    });

    it("deve retornar lista vazia se paciente não foi compartilhado", async () => {
      const shares = await getSharedWith(patientId, userId1);
      expect(shares).toHaveLength(0);
    });

    it("deve retornar lista vazia se usuário não é o proprietário", async () => {
      await sharePatient(userId1, userId2, patientId, "view");

      // Tentar listar com usuário que não é proprietário
      const shares = await getSharedWith(patientId, userId2);
      expect(shares).toHaveLength(0);
    });
  });

  describe("getSharedPatients", () => {
    it("deve listar pacientes compartilhados COM o usuário", async () => {
      // Compartilhar paciente com userId2
      await sharePatient(userId1, userId2, patientId, "view");

      // Listar pacientes compartilhados com userId2
      const sharedPatients = await getSharedPatients(userId2);
      expect(sharedPatients.length).toBeGreaterThan(0);
      expect(sharedPatients.map((p) => p.id)).toContain(patientId);
    });

    it("deve filtrar pacientes compartilhados por status", async () => {
      // Compartilhar paciente com userId2
      await sharePatient(userId1, userId2, patientId, "view");

      // Listar com filtro de status
      const activePatients = await getSharedPatients(userId2, undefined, "active");
      expect(activePatients.map((p) => p.id)).toContain(patientId);

      const inactivePatients = await getSharedPatients(userId2, undefined, "inactive");
      expect(inactivePatients.map((p) => p.id)).not.toContain(patientId);
    });

    it("deve retornar lista vazia se nenhum paciente foi compartilhado", async () => {
      const sharedPatients = await getSharedPatients(userId2);
      expect(sharedPatients).toHaveLength(0);
    });
  });

  describe("getSharePermission", () => {
    it("deve retornar permissão de um usuário para um paciente compartilhado", async () => {
      await sharePatient(userId1, userId2, patientId, "edit");

      const permission = await getSharePermission(userId2, patientId);
      expect(permission).toBe("edit");
    });

    it("deve retornar null se paciente não foi compartilhado", async () => {
      const permission = await getSharePermission(userId2, patientId);
      expect(permission).toBeNull();
    });

    it("deve retornar null se usuário não tem acesso", async () => {
      // Compartilhar com userId2
      await sharePatient(userId1, userId2, patientId, "view");

      // Verificar permissão de userId1 (proprietário não tem entrada em userShares)
      const permission = await getSharePermission(userId1, patientId);
      expect(permission).toBeNull();
    });
  });

  describe("canAccessPatient", () => {
    it("deve retornar true se usuário é o proprietário", async () => {
      const hasAccess = await canAccessPatient(userId1, patientId);
      expect(hasAccess).toBe(true);
    });

    it("deve retornar true se paciente foi compartilhado com o usuário", async () => {
      await sharePatient(userId1, userId2, patientId, "view");

      const hasAccess = await canAccessPatient(userId2, patientId);
      expect(hasAccess).toBe(true);
    });

    it("deve retornar false se usuário não tem acesso", async () => {
      const hasAccess = await canAccessPatient(userId2, patientId);
      expect(hasAccess).toBe(false);
    });

    it("deve retornar false após remover compartilhamento", async () => {
      // Compartilhar
      await sharePatient(userId1, userId2, patientId, "view");
      expect(await canAccessPatient(userId2, patientId)).toBe(true);

      // Remover compartilhamento
      await unsharePatient(userId1, userId2, patientId);
      expect(await canAccessPatient(userId2, patientId)).toBe(false);
    });
  });
});
