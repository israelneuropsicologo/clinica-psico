/**
 * Cache Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cacheManager, cacheKeys, cacheInvalidation } from "./cache";

describe("Cache Manager", () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  afterEach(() => {
    cacheManager.stopCleanupInterval();
  });

  describe("Basic Operations", () => {
    it("should set and get values", () => {
      const testData = { name: "Test", value: 123 };
      cacheManager.set("test:key", testData);

      const retrieved = cacheManager.get("test:key");
      expect(retrieved).toEqual(testData);
    });

    it("should return null for non-existent keys", () => {
      const result = cacheManager.get("non:existent");
      expect(result).toBeNull();
    });

    it("should check if key exists", () => {
      cacheManager.set("existing:key", { data: "test" });

      expect(cacheManager.has("existing:key")).toBe(true);
      expect(cacheManager.has("non:existent")).toBe(false);
    });

    it("should delete specific keys", () => {
      cacheManager.set("key:to:delete", { data: "test" });
      expect(cacheManager.has("key:to:delete")).toBe(true);

      const deleted = cacheManager.delete("key:to:delete");
      expect(deleted).toBe(true);
      expect(cacheManager.has("key:to:delete")).toBe(false);
    });

    it("should clear all cache", () => {
      cacheManager.set("key1", { data: 1 });
      cacheManager.set("key2", { data: 2 });
      cacheManager.set("key3", { data: 3 });

      expect(cacheManager.size()).toBe(3);

      cacheManager.clear();
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe("TTL (Time To Live)", () => {
    it("should expire entries after TTL", async () => {
      const shortTTL = 100; // 100ms
      cacheManager.set("expiring:key", { data: "test" }, shortTTL);

      expect(cacheManager.has("expiring:key")).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cacheManager.has("expiring:key")).toBe(false);
      expect(cacheManager.get("expiring:key")).toBeNull();
    });

    it("should use default TTL of 5 minutes", () => {
      cacheManager.set("default:ttl", { data: "test" });

      // Should still exist immediately
      expect(cacheManager.has("default:ttl")).toBe(true);
    });

    it("should support custom TTL", async () => {
      const customTTL = 50; // 50ms
      cacheManager.set("custom:ttl", { data: "test" }, customTTL);

      expect(cacheManager.has("custom:ttl")).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cacheManager.has("custom:ttl")).toBe(false);
    });
  });

  describe("Pattern Deletion", () => {
    it("should delete entries matching string pattern", () => {
      cacheManager.set("ai:insights:1", { data: 1 });
      cacheManager.set("ai:insights:2", { data: 2 });
      cacheManager.set("ai:planning:1", { data: 3 });
      cacheManager.set("other:key", { data: 4 });

      const deleted = cacheManager.deletePattern("ai:insights:.*");
      expect(deleted).toBe(2);
      expect(cacheManager.size()).toBe(2);
    });

    it("should delete entries matching regex pattern", () => {
      cacheManager.set("patient:1:data", { data: 1 });
      cacheManager.set("patient:2:data", { data: 2 });
      cacheManager.set("patient:1:analysis", { data: 3 });
      cacheManager.set("other:data", { data: 4 });

      const regex = /^patient:\d+:data$/;
      const deleted = cacheManager.deletePattern(regex);
      expect(deleted).toBe(2);
      expect(cacheManager.size()).toBe(2);
    });

    it("should return 0 if no matches found", () => {
      cacheManager.set("key1", { data: 1 });
      cacheManager.set("key2", { data: 2 });

      const deleted = cacheManager.deletePattern("non:matching:.*");
      expect(deleted).toBe(0);
      expect(cacheManager.size()).toBe(2);
    });
  });

  describe("Cache Keys", () => {
    it("should generate patient insights cache key", () => {
      const key = cacheKeys.patientInsights(123);
      expect(key).toBe("ai:insights:123");
    });

    it("should generate session planning cache key", () => {
      const key = cacheKeys.sessionPlanning(456);
      expect(key).toBe("ai:planning:456");
    });

    it("should generate supervision summary cache key", () => {
      const key = cacheKeys.supervisionSummary(789);
      expect(key).toBe("ai:supervision:789");
    });

    it("should generate comparative analysis cache key", () => {
      const key = cacheKeys.comparativeAnalysis([3, 1, 2]);
      expect(key).toBe("ai:comparative:1,2,3");
    });

    it("should generate patient list cache key", () => {
      const key = cacheKeys.patientList(100, "active:all");
      expect(key).toBe("ai:patients:100:active:all");
    });

    it("should generate dashboard cache key", () => {
      const key = cacheKeys.dashboardData(200);
      expect(key).toBe("ai:dashboard:200");
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate all patient data", () => {
      const patientId = 123;
      cacheManager.set(cacheKeys.patientInsights(patientId), { data: 1 });
      cacheManager.set(cacheKeys.sessionPlanning(patientId), { data: 2 });
      cacheManager.set(cacheKeys.supervisionSummary(patientId), { data: 3 });
      cacheManager.set("other:key", { data: 4 });

      expect(cacheManager.size()).toBe(4);

      const invalidated = cacheInvalidation.invalidatePatient(patientId);
      expect(invalidated).toBeGreaterThan(0);
      expect(cacheManager.has("other:key")).toBe(true);
    });

    it("should invalidate all user data", () => {
      const userId = 456;
      cacheManager.set(cacheKeys.dashboardData(userId), { data: 1 });
      cacheManager.set(cacheKeys.patientList(userId, "active"), { data: 2 });
      cacheManager.set(cacheKeys.allPatientInsights(userId), { data: 3 });
      cacheManager.set("other:key", { data: 4 });

      expect(cacheManager.size()).toBe(4);

      const invalidated = cacheInvalidation.invalidateUser(userId);
      expect(invalidated).toBeGreaterThan(0);
      expect(cacheManager.has("other:key")).toBe(true);
    });

    it("should invalidate all cache", () => {
      cacheManager.set("key1", { data: 1 });
      cacheManager.set("key2", { data: 2 });
      cacheManager.set("key3", { data: 3 });

      expect(cacheManager.size()).toBe(3);

      cacheInvalidation.invalidateAll();
      expect(cacheManager.size()).toBe(0);
    });
  });

  describe("Cache Statistics", () => {
    it("should return cache size", () => {
      cacheManager.set("key1", { data: 1 });
      cacheManager.set("key2", { data: 2 });

      expect(cacheManager.size()).toBe(2);
    });

    it("should return cache stats", () => {
      cacheManager.set("key1", { data: 1 });
      cacheManager.set("key2", { data: 2 });

      const stats = cacheManager.getStats();
      expect(stats.size).toBe(2);
      expect(stats.entries).toHaveLength(2);
      expect(stats.entries[0]).toHaveProperty("key");
      expect(stats.entries[0]).toHaveProperty("age");
      expect(stats.entries[0]).toHaveProperty("ttl");
      expect(stats.entries[0]).toHaveProperty("expired");
    });

    it("should mark expired entries in stats", async () => {
      const shortTTL = 50;
      cacheManager.set("expiring:key", { data: "test" }, shortTTL);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = cacheManager.getStats();
      const expiredEntry = stats.entries.find((e) => e.key === "expiring:key");
      expect(expiredEntry?.expired).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should preserve types when storing and retrieving", () => {
      interface TestData {
        id: number;
        name: string;
        active: boolean;
      }

      const data: TestData = { id: 1, name: "Test", active: true };
      cacheManager.set("typed:key", data);

      const retrieved = cacheManager.get<TestData>("typed:key");
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe("Test");
      expect(retrieved?.active).toBe(true);
    });

    it("should handle complex nested objects", () => {
      const complexData = {
        user: {
          id: 1,
          profile: {
            name: "John",
            email: "john@example.com",
          },
        },
        metadata: {
          created: new Date(),
          tags: ["tag1", "tag2"],
        },
      };

      cacheManager.set("complex:key", complexData);
      const retrieved = cacheManager.get("complex:key");

      expect(retrieved?.user.profile.name).toBe("John");
      expect(retrieved?.metadata.tags).toContain("tag1");
    });
  });
});
