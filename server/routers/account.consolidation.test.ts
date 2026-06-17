import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import * as db from "../db";

describe("Account Consolidation", () => {
  let database: any;
  let officialUserId: number;
  let officialOpenId: string;

  beforeAll(async () => {
    database = await getDb();
    if (!database) throw new Error("Database connection failed");

    // Create official user with official email
    const officialResult = await database.insert(users).values({
      openId: `official-${Date.now()}`,
      name: "Official User",
      email: "israelneuropsicolo@gmail.com",
      loginMethod: "oauth",
      role: "admin",
    });

    // Get the official user
    const officialUsers = await database
      .select()
      .from(users)
      .where(eq(users.email, "israelneuropsicolo@gmail.com"))
      .limit(1);

    officialUserId = officialUsers[0]?.id;
    officialOpenId = officialUsers[0]?.openId;

    if (!officialUserId || !officialOpenId) {
      throw new Error("Failed to create official user");
    }
  });

  afterAll(async () => {
    if (!database || !officialUserId) return;

    // Clean up: delete test users
    await database.delete(users).where(eq(users.email, "israelneuropsicolo@gmail.com"));
    await database.delete(users).where(eq(users.email, "israelmengo@gmail.com"));
    await database.delete(users).where(eq(users.email, "test-alt@example.com"));
  });

  it("should return official openId when email is official", async () => {
    const result = await db.getOfficialOpenId("israelneuropsicolo@gmail.com", "some-random-openid");
    expect(result).toBe(officialOpenId);
  });

  it("should return official openId when email is alternative", async () => {
    // Create alternative user
    await database.insert(users).values({
      openId: `alt-${Date.now()}`,
      name: "Alternative User",
      email: "israelmengo@gmail.com",
      loginMethod: "oauth",
    });

    const result = await db.getOfficialOpenId("israelmengo@gmail.com", `alt-${Date.now()}`);
    expect(result).toBe(officialOpenId);
  });

  it("should consolidate alternative email to official account", async () => {
    const altOpenId = `alt-consolidate-${Date.now()}`;

    // Create alternative user
    await database.insert(users).values({
      openId: altOpenId,
      name: "Alt User for Consolidation",
      email: "test-alt@example.com",
      loginMethod: "oauth",
    });

    const result = await db.consolidateToOfficialAccount("test-alt@example.com", altOpenId);
    expect(result).toBe(officialOpenId);
    expect(result).not.toBe(altOpenId);
  });

  it("should return same openId for official email", async () => {
    const result = await db.consolidateToOfficialAccount("israelneuropsicolo@gmail.com", officialOpenId);
    expect(result).toBe(officialOpenId);
  });

  it("should return same openId if official email not found", async () => {
    const randomOpenId = "random-openid-12345";
    const result = await db.consolidateToOfficialAccount("nonexistent@example.com", randomOpenId);
    expect(result).toBe(randomOpenId);
  });
});
