import { describe, it, expect, beforeEach, vi } from "vitest";
import { autonomousAgentsRouter } from "./autonomous-agents";
import { getDb } from "../db";

// Mock getDb
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Autonomous Agents Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("health endpoint", () => {
    it("should return health status", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.health();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("agent", "esaude-clinica");
      expect(result).toHaveProperty("version", "1.0");
      expect(result).toHaveProperty("connected", true);
    });
  });

  describe("logs endpoint", () => {
    it("should return communication logs", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            createdAt: new Date(),
            fromAgent: "site-psicolog",
            messageType: "health_check",
            status: "received",
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.logs();

      expect(result).toHaveProperty("logs");
      expect(result).toHaveProperty("count");
      expect(Array.isArray(result.logs)).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe("analysis endpoint", () => {
    it("should return module analyses", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            analysisType: "error_pattern",
            module: "sync",
            severity: "medium",
            description: "Sync timeout detected",
            status: "open",
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.analysis();

      expect(result).toHaveProperty("analyses");
      expect(result).toHaveProperty("count");
      expect(Array.isArray(result.analyses)).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe("dailyReports endpoint", () => {
    it("should return daily reports", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          {
            id: 1,
            reportDate: new Date(),
            agentName: "site-psicolog",
            summary: JSON.stringify({
              total_synced: 100,
              total_failed: 5,
            }),
            performance: JSON.stringify({
              avg_sync_time: 250,
              success_rate: 0.95,
            }),
            createdAt: new Date(),
          },
        ]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.dailyReports();

      expect(result).toHaveProperty("reports");
      expect(result).toHaveProperty("count");
      expect(Array.isArray(result.reports)).toBe(true);
      expect(result.count).toBe(1);
    });
  });

  describe("syncStatus endpoint", () => {
    it("should process sync status from site", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.syncStatus({
        type: "health_check",
        metrics: {
          total_appointments: 100,
          synced_appointments: 95,
          failed_appointments: 5,
          sync_success_rate: 0.95,
          average_sync_time_ms: 250,
          last_sync: new Date().toISOString(),
          pending_retries: 2,
          database_health: "healthy",
          api_latency_ms: 150,
        },
      });

      expect(result).toHaveProperty("status", "received");
      expect(result).toHaveProperty("analysis");
      expect(result.analysis.health_score).toBe(95);
      expect(result.analysis.issues_detected).toBe(0);
    });

    it("should calculate correct health score with degraded status", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.syncStatus({
        type: "health_check",
        metrics: {
          total_appointments: 100,
          synced_appointments: 80,
          failed_appointments: 20,
          sync_success_rate: 0.8,
          average_sync_time_ms: 500,
          last_sync: new Date().toISOString(),
          pending_retries: 5,
          database_health: "degraded",
          api_latency_ms: 300,
        },
      });

      expect(result.analysis.health_score).toBe(80);
      expect(result.metrics.pending).toBe(5);
    });

    it("should detect and record errors", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.syncStatus({
        type: "health_check",
        metrics: {
          total_appointments: 100,
          synced_appointments: 90,
          failed_appointments: 10,
          sync_success_rate: 0.9,
          average_sync_time_ms: 300,
          last_sync: new Date().toISOString(),
          pending_retries: 3,
          database_health: "healthy",
          api_latency_ms: 200,
        },
        errors: [
          {
            error: "TIMEOUT",
            appointment_id: "appt_123",
          },
        ],
      });

      expect(result.analysis.issues_detected).toBe(1);
    });
  });

  describe("autoFix endpoint", () => {
    it("should execute auto-fix for sync errors", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.autoFix({
        type: "validate_and_retry",
        module: "sync",
        issue: {
          error: "SYNC_FAILED",
          appointment_id: "appt_123",
        },
      });

      expect(result).toHaveProperty("status", "fixing");
      expect(result).toHaveProperty("actions");
      expect(result.final_status).toBe("resolved");
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it("should return multiple actions in auto-fix", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.autoFix({
        type: "validate_and_retry",
        module: "sync",
        issue: {
          error: "SYNC_FAILED",
          appointment_id: "appt_123",
        },
      });

      expect(result.actions).toEqual([
        {
          action: "validate_data",
          status: "success",
          result: "Data validation passed",
        },
        {
          action: "check_consistency",
          status: "success",
          result: "No inconsistencies found",
        },
        {
          action: "retry_sync",
          status: "success",
          result: "Sync completed successfully",
        },
      ]);
    });
  });

  describe("generateToken endpoint", () => {
    it("should generate new token for admin", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const result = await caller.generateToken({
        agentName: "site-psicolog",
      });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresAt");
      expect(result).toHaveProperty("agentName", "site-psicolog");
      expect(result.token).toContain("site-psicolog-token-");
    });

    it("should reject non-admin token generation", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "user" },
      } as any);

      await expect(
        caller.generateToken({
          agentName: "site-psicolog",
        })
      ).rejects.toThrow("Only admins can generate tokens");
    });

    it("should generate token with 24 hour expiry", async () => {
      const mockDb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = autonomousAgentsRouter.createCaller({
        user: { id: 1, role: "admin" },
      } as any);

      const before = Date.now();
      const result = await caller.generateToken({
        agentName: "site-psicolog",
      });
      const after = Date.now();

      const expiryTime = new Date(result.expiresAt).getTime();
      const expectedExpiry = 24 * 60 * 60 * 1000; // 24 hours in ms

      expect(expiryTime - before).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(expiryTime - after).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });
});
