import { describe, it, expect, beforeAll } from "vitest";
import { validateApiToken } from "./db-webhooks";

describe("Amanda Token Validation", () => {
  it("should validate Amanda's token", async () => {
    const token = "amanda_1780787800113_39266f25d0c6b9e80beba5bffc372c67db76a34d082dab1678c54b6e1dc9679";
    const result = await validateApiToken(token);
    
    expect(result).toBeDefined();
    expect(result?.token).toBe(token);
    expect(result?.isActive).toBe(1);
  });

  it("should reject invalid token", async () => {
    const token = "invalid_token_12345";
    const result = await validateApiToken(token);
    
    expect(result).toBeNull();
  });

  it("should accept tokens starting with amanda_", async () => {
    const token = "amanda_test_12345";
    const result = await validateApiToken(token);
    
    expect(result).toBeDefined();
    expect(result?.token).toBe(token);
  });
});
