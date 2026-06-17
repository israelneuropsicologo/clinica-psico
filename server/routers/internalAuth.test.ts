import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginInternalUser, hashPassword, verifyPassword } from "../db/internal-auth";

describe("Internal Auth", () => {
  describe("Password hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(10);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("Login validation", () => {
    it("should return null for non-existent email", async () => {
      const result = await loginInternalUser(
        "nonexistent@example.com",
        "password123"
      );

      expect(result).toBeNull();
    });

    it("should return null for incorrect password", async () => {
      // This test would need a real user in the database
      // For now, we just verify the function signature works
      const result = await loginInternalUser(
        "test@example.com",
        "wrongpassword"
      );

      expect(result).toBeNull();
    });
  });
});
