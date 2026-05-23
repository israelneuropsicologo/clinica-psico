import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { apiTokens } from "../drizzle/schema";
import { createApiToken, validateApiToken } from "./db-webhooks";

describe("API Token Table Tests", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should check if api_tokens table exists", async () => {
    expect(db).toBeDefined();
    
    try {
      // Try to query the table
      const result = await db.select().from(apiTokens).limit(1);
      console.log("✅ api_tokens table exists!");
      console.log("Sample records:", result);
    } catch (error: any) {
      console.error("❌ Error querying api_tokens table:", error.message);
      throw error;
    }
  });

  it("should create and validate an API token", async () => {
    try {
      // Create a test token
      const tokenResult = await createApiToken(1, "test_token", "Test token for validation");
      console.log("✅ Token created:", tokenResult.token);
      
      // Validate the token immediately
      const validated = await validateApiToken(tokenResult.token);
      console.log("✅ Token validated:", validated);
      
      expect(validated).toBeDefined();
      expect(validated?.token).toBe(tokenResult.token);
    } catch (error: any) {
      console.error("❌ Error creating/validating token:", error.message);
      throw error;
    }
  });

  it("should reject invalid token", async () => {
    const validated = await validateApiToken("invalid_token_xyz");
    expect(validated).toBeNull();
  });
});
