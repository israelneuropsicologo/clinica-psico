import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users, patients, sessions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Multi-User Tests", () => {
  let db: any;
  let user1Id: number;
  let user2Id: number;
  let patient1Id: number;
  let patient2Id: number;
  let user1Caller: any;
  let user2Caller: any;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar dois usuários
    const user1Result = await db.insert(users).values({
      openId: `user1-${Date.now()}`,
      name: "User 1",
      email: `user1-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    user1Id = (user1Result[0] as { insertId: number }).insertId;

    const user2Result = await db.insert(users).values({
      openId: `user2-${Date.now()}`,
      name: "User 2",
      email: `user2-${Date.now()}@test.com`,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    user2Id = (user2Result[0] as { insertId: number }).insertId;

    // Criar pacientes para cada usuário
    const patient1Result = await db.insert(patients).values({
      userId: user1Id,
      name: "Patient 1",
      email: `patient1-${Date.now()}@test.com`,
      status: "active",
      leadSource: "manual",
      leadStatus: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    patient1Id = (patient1Result[0] as { insertId: number }).insertId;

    const patient2Result = await db.insert(patients).values({
      userId: user2Id,
      name: "Patient 2",
      email: `patient2-${Date.now()}@test.com`,
      status: "active",
      leadSource: "manual",
      leadStatus: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    patient2Id = (patient2Result[0] as { insertId: number }).insertId;

    // Criar callers para cada usuário
    const user1Ctx = {
      user: {
        id: user1Id,
        openId: `user1-${Date.now()}`,
        role: "user",
        email: `user1-${Date.now()}@test.com`,
      },
    };

    const user2Ctx = {
      user: {
        id: user2Id,
        openId: `user2-${Date.now()}`,
        role: "user",
        email: `user2-${Date.now()}@test.com`,
      },
    };

    user1Caller = appRouter.createCaller(user1Ctx);
    user2Caller = appRouter.createCaller(user2Ctx);
  });

  afterEach(async () => {
    if (!db) return;

    // Limpar dados de teste
    await db.delete(sessions).where(eq(sessions.patientId, patient1Id));
    await db.delete(sessions).where(eq(sessions.patientId, patient2Id));
    await db.delete(patients).where(eq(patients.id, patient1Id));
    await db.delete(patients).where(eq(patients.id, patient2Id));
    await db.delete(users).where(eq(users.id, user1Id));
    await db.delete(users).where(eq(users.id, user2Id));
  });

  describe("Patient Access", () => {
    it("user1 deve ver apenas seus próprios pacientes", async () => {
      const patients = await user1Caller.patients.list({});
      const patientIds = patients.map((p: any) => p.id);

      expect(patientIds).toContain(patient1Id);
      expect(patientIds).not.toContain(patient2Id);
    });

    it("user2 deve ver apenas seus próprios pacientes", async () => {
      const patients = await user2Caller.patients.list({});
      const patientIds = patients.map((p: any) => p.id);

      expect(patientIds).toContain(patient2Id);
      expect(patientIds).not.toContain(patient1Id);
    });

    it("user1 não deve conseguir acessar paciente de user2", async () => {
      await expect(user1Caller.patients.getById({ id: patient2Id })).rejects.toThrow();
    });

    it("user2 não deve conseguir acessar paciente de user1", async () => {
      await expect(user2Caller.patients.getById({ id: patient1Id })).rejects.toThrow();
    });
  });

  describe("Patient Sharing", () => {
    it("user1 deve conseguir compartilhar seu paciente com user2", async () => {
      const result = await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "view",
      });

      expect(result.success).toBe(true);
    });

    it("após compartilhamento, user2 deve ver o paciente de user1", async () => {
      // Compartilhar
      await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "view",
      });

      // User2 deve ver o paciente
      const patients = await user2Caller.patients.list({});
      const patientIds = patients.map((p: any) => p.id);

      expect(patientIds).toContain(patient1Id);
    });

    it("após compartilhamento, user2 deve conseguir acessar o paciente de user1", async () => {
      // Compartilhar
      await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "view",
      });

      // User2 deve conseguir acessar
      const patient = await user2Caller.patients.getById({ id: patient1Id });
      expect(patient.id).toBe(patient1Id);
      expect(patient.name).toBe("Patient 1");
    });

    it("após descompartilhamento, user2 não deve mais ver o paciente", async () => {
      // Compartilhar
      await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "view",
      });

      // Descompartilhar
      await user1Caller.patientSharing.unsharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
      });

      // User2 não deve mais ver
      const patients = await user2Caller.patients.list({});
      const patientIds = patients.map((p: any) => p.id);

      expect(patientIds).not.toContain(patient1Id);
    });
  });

  describe("Session Management", () => {
    it("user1 deve conseguir criar sessão para seu paciente", async () => {
      const result = await user1Caller.sessions.create({
        patientId: patient1Id,
        scheduledAt: Date.now(),
        duration: 60,
        notes: "Test session",
        isPaid: "pending",
      });

      expect(result.id).toBeDefined();
    });

    it("user2 não deve conseguir criar sessão para paciente de user1", async () => {
      await expect(
        user2Caller.sessions.create({
          patientId: patient1Id,
          scheduledAt: Date.now(),
          duration: 60,
          notes: "Test session",
          isPaid: "pending",
        })
      ).rejects.toThrow();
    });

    it("após compartilhamento, user2 deve conseguir criar sessão", async () => {
      // Compartilhar
      await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "edit",
      });

      // User2 deve conseguir criar sessão
      const result = await user2Caller.sessions.create({
        patientId: patient1Id,
        scheduledAt: Date.now(),
        duration: 60,
        notes: "Test session",
        isPaid: "pending",
      });

      expect(result.id).toBeDefined();
    });
  });

  describe("Email Aliases", () => {
    it("admin deve conseguir adicionar alias para user1", async () => {
      // Criar admin
      const adminResult = await db.insert(users).values({
        openId: `admin-${Date.now()}`,
        name: "Admin",
        email: `admin-${Date.now()}@test.com`,
        loginMethod: "test",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      const adminId = (adminResult[0] as { insertId: number }).insertId;

      const adminCtx = {
        user: {
          id: adminId,
          openId: `admin-${Date.now()}`,
          role: "admin",
          email: `admin-${Date.now()}@test.com`,
        },
      };

      const adminCaller = appRouter.createCaller(adminCtx);

      const result = await adminCaller.emailAliases.addAlias({
        userId: user1Id,
        email: `alias-${Date.now()}@test.com`,
        isPrimary: false,
      });

      expect(result.success).toBe(true);

      // Limpar admin
      await db.delete(users).where(eq(users.id, adminId));
    });

    it("user1 deve conseguir ver seus próprios aliases", async () => {
      const result = await user1Caller.emailAliases.myAliases();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.aliases)).toBe(true);
    });
  });

  describe("Patient Sharing with Email Aliases", () => {
    it("user1 com alias deve conseguir compartilhar paciente", async () => {
      // Criar admin para adicionar alias
      const adminResult = await db.insert(users).values({
        openId: `admin-${Date.now()}`,
        name: "Admin",
        email: `admin-${Date.now()}@test.com`,
        loginMethod: "test",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });
      const adminId = (adminResult[0] as { insertId: number }).insertId;

      const adminCtx = {
        user: {
          id: adminId,
          openId: `admin-${Date.now()}`,
          role: "admin",
          email: `admin-${Date.now()}@test.com`,
        },
      };

      const adminCaller = appRouter.createCaller(adminCtx);

      // Adicionar alias para user1
      const aliasEmail = `alias-${Date.now()}@test.com`;
      await adminCaller.emailAliases.addAlias({
        userId: user1Id,
        email: aliasEmail,
        isPrimary: false,
      });

      // User1 deve conseguir compartilhar
      const result = await user1Caller.patientSharing.sharePatient({
        patientId: patient1Id,
        toUserId: user2Id,
        permission: "view",
      });

      expect(result.success).toBe(true);

      // Limpar admin
      await db.delete(users).where(eq(users.id, adminId));
    });
  });
});
