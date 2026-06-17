import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { settings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Settings Persistence", () => {
  let db: any;
  let testUserId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const result = await db.insert(users).values({
      openId: `test-settings-${Date.now()}`,
      name: "Test Settings User",
      email: "test-settings@example.com",
      loginMethod: "oauth",
      role: "user",
    });

    // Get the inserted user ID
    const users_result = await db
      .select()
      .from(users)
      .where(eq(users.email, "test-settings@example.com"))
      .limit(1);

    testUserId = users_result[0]?.id;
    if (!testUserId) throw new Error("Failed to create test user");
  });

  afterAll(async () => {
    if (!db || !testUserId) return;

    // Clean up: delete test settings
    await db.delete(settings).where(eq(settings.userId, testUserId));

    // Clean up: delete test user
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should create settings and persist to database", async () => {
    if (!db || !testUserId) throw new Error("Setup failed");

    // Create settings
    await db.insert(settings).values({
      userId: testUserId,
      clinicName: "Test Clinic",
      clinicEmail: "clinic@test.com",
      clinicPhone: "11999999999",
      systemTitle: "Test System",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
    });

    // Retrieve and verify
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, testUserId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].clinicName).toBe("Test Clinic");
    expect(result[0].clinicEmail).toBe("clinic@test.com");
    expect(result[0].systemTitle).toBe("Test System");
  });

  it("should update settings and persist changes", async () => {
    if (!db || !testUserId) throw new Error("Setup failed");

    // Update settings
    await db
      .update(settings)
      .set({
        clinicName: "Updated Clinic Name",
        clinicPhone: "11988888888",
        updatedAt: new Date(),
      })
      .where(eq(settings.userId, testUserId));

    // Retrieve and verify
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, testUserId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].clinicName).toBe("Updated Clinic Name");
    expect(result[0].clinicPhone).toBe("11988888888");
  });

  it("should not lose data after multiple updates", async () => {
    if (!db || !testUserId) throw new Error("Setup failed");

    // Perform multiple updates
    for (let i = 0; i < 5; i++) {
      await db
        .update(settings)
        .set({
          systemTitle: `System Title ${i}`,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, testUserId));
    }

    // Verify final state
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, testUserId))
      .limit(1);

    expect(result).toHaveLength(1);
    expect(result[0].systemTitle).toBe("System Title 4");
    // Verify other fields are still intact
    expect(result[0].clinicName).toBe("Updated Clinic Name");
    expect(result[0].clinicEmail).toBe("clinic@test.com");
  });

  it("should maintain data integrity across read/write cycles", async () => {
    if (!db || !testUserId) throw new Error("Setup failed");

    const originalData = {
      clinicName: "Integrity Test Clinic",
      clinicEmail: "integrity@test.com",
      clinicPhone: "11977777777",
      ownerName: "Test Owner",
      ownerEmail: "owner@test.com",
    };

    // Write
    await db
      .update(settings)
      .set({
        ...originalData,
        updatedAt: new Date(),
      })
      .where(eq(settings.userId, testUserId));

    // Read multiple times
    for (let i = 0; i < 3; i++) {
      const result = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, testUserId))
        .limit(1);

      expect(result).toHaveLength(1);
      expect(result[0].clinicName).toBe(originalData.clinicName);
      expect(result[0].clinicEmail).toBe(originalData.clinicEmail);
      expect(result[0].clinicPhone).toBe(originalData.clinicPhone);
      expect(result[0].ownerName).toBe(originalData.ownerName);
      expect(result[0].ownerEmail).toBe(originalData.ownerEmail);
    }
  });
});
