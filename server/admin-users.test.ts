import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Admin Users Management", () => {
  let testUserId: number;
  const testUser = {
    openId: `test_${Date.now()}`,
    name: "Test Admin",
    email: `test-admin-${Date.now()}@example.com`,
    role: "admin" as const,
    isActive: 1,
    loginMethod: "manual",
  };

  beforeAll(async () => {
    // Criar usuário de teste
    const result = await db.insert(users).values(testUser);
    testUserId = result.insertId as number;
  });

  afterAll(async () => {
    // Limpar usuário de teste
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create a new user with admin role", async () => {
    const newUser = {
      openId: `test_new_${Date.now()}`,
      name: "New Admin User",
      email: `new-admin-${Date.now()}@example.com`,
      role: "psychologist" as const,
      isActive: 1,
      loginMethod: "manual",
    };

    const result = await db.insert(users).values(newUser);
    expect(result.insertId).toBeGreaterThan(0);

    // Cleanup
    await db.delete(users).where(eq(users.id, result.insertId as number));
  });

  it("should retrieve user by ID", async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });

    expect(user).toBeDefined();
    expect(user?.name).toBe(testUser.name);
    expect(user?.role).toBe("admin");
  });

  it("should update user role", async () => {
    await db.update(users).set({ role: "secretary" }).where(eq(users.id, testUserId));

    const updated = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });

    expect(updated?.role).toBe("secretary");

    // Restore original role
    await db.update(users).set({ role: "admin" }).where(eq(users.id, testUserId));
  });

  it("should toggle user active status", async () => {
    // Deactivate
    await db.update(users).set({ isActive: 0 }).where(eq(users.id, testUserId));

    let user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    expect(user?.isActive).toBe(0);

    // Reactivate
    await db.update(users).set({ isActive: 1 }).where(eq(users.id, testUserId));

    user = await db.query.users.findFirst({
      where: eq(users.id, testUserId),
    });
    expect(user?.isActive).toBe(1);
  });

  it("should list all users", async () => {
    const allUsers = await db.query.users.findMany();
    expect(Array.isArray(allUsers)).toBe(true);
    expect(allUsers.length).toBeGreaterThan(0);
  });

  it("should support multiple roles", async () => {
    const roles = ["admin", "psychologist", "secretary", "patient"];

    for (const role of roles) {
      const testRole = {
        openId: `test_role_${role}_${Date.now()}`,
        name: `Test ${role}`,
        email: `test-${role}-${Date.now()}@example.com`,
        role: role as any,
        isActive: 1,
        loginMethod: "manual",
      };

      const result = await db.insert(users).values(testRole);
      expect(result.insertId).toBeGreaterThan(0);

      // Cleanup
      await db.delete(users).where(eq(users.id, result.insertId as number));
    }
  });
});
