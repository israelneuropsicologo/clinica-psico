/**
 * Admin Router Tests
 * Validates administrative operations and system configuration
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedAdmin = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedAdmin = {
    id: 1,
    openId: "admin-user",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Admin Router", () => {
  describe("getSystemStats", () => {
    it("should return system statistics", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.admin.getSystemStats();

      expect(stats).toBeDefined();
      expect(stats.overview).toBeDefined();
      expect(stats.overview.totalPatients).toBeGreaterThanOrEqual(0);
      expect(stats.overview.totalSessions).toBeGreaterThanOrEqual(0);
      expect(stats.overview.avgSessionsPerPatient).toBeGreaterThanOrEqual(0);
      expect(stats.system).toBeDefined();
      expect(stats.system.version).toBe("1.0.0");
      expect(stats.ai).toBeDefined();
      expect(stats.ai.averageConfidence).toBeGreaterThan(0);
      expect(stats.ai.averageConfidence).toBeLessThanOrEqual(1);
    });

    it("should have valid uptime", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.admin.getSystemStats();

      expect(stats.system.uptime).toBeGreaterThan(0);
    });
  });

  describe("getSettings", () => {
    it("should return all configuration settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const settings = await caller.admin.getSettings();

      expect(settings).toBeDefined();
      expect(settings.general).toBeDefined();
      expect(settings.general.appName).toBe("Clínica App");
      expect(settings.general.timezone).toBe("America/Sao_Paulo");
      expect(settings.ai).toBeDefined();
      expect(settings.ai.sentimentAnalysisEnabled).toBe(true);
      expect(settings.security).toBeDefined();
      expect(settings.security.encryptionEnabled).toBe(true);
      expect(settings.notifications).toBeDefined();
    });

    it("should have valid confidence threshold", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const settings = await caller.admin.getSettings();

      expect(settings.ai.minConfidenceThreshold).toBeGreaterThanOrEqual(0);
      expect(settings.ai.minConfidenceThreshold).toBeLessThanOrEqual(1);
    });
  });

  describe("updateSettings", () => {
    it("should update general settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.updateSettings({
        section: "general",
        settings: {
          appName: "Clínica App Updated",
          timezone: "America/New_York",
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("general");
    });

    it("should update AI settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.updateSettings({
        section: "ai",
        settings: {
          sentimentAnalysisEnabled: false,
          minConfidenceThreshold: 0.8,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("ai");
    });

    it("should update security settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.updateSettings({
        section: "security",
        settings: {
          encryptionEnabled: true,
          sessionTimeout: 7200,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("security");
    });

    it("should update notification settings", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.updateSettings({
        section: "notifications",
        settings: {
          emailNotificationsEnabled: false,
          riskAlertNotifications: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("notifications");
    });
  });

  describe("getUserManagement", () => {
    it("should return user management data", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const management = await caller.admin.getUserManagement();

      expect(management).toBeDefined();
      expect(management.totalUsers).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(management.users)).toBe(true);
      expect(management.roles).toBeDefined();
      expect(management.roles.admin).toBeGreaterThanOrEqual(0);
      expect(management.roles.user).toBeGreaterThanOrEqual(0);
    });

    it("should have valid user data structure", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const management = await caller.admin.getUserManagement();

      if (management.users.length > 0) {
        const user = management.users[0];
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.status).toMatch(/active|inactive/);
      }
    });
  });

  describe("getSystemHealth", () => {
    it("should return system health status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const health = await caller.admin.getSystemHealth();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded/);
      expect(health.components).toBeDefined();
      expect(health.components.database).toBeDefined();
      expect(health.components.api).toBeDefined();
      expect(health.components.authentication).toBeDefined();
      expect(health.components.encryption).toBeDefined();
    });

    it("should have valid metrics", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const health = await caller.admin.getSystemHealth();

      expect(health.metrics).toBeDefined();
      expect(health.metrics.requestsPerSecond).toBeGreaterThanOrEqual(0);
      expect(health.metrics.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(health.metrics.errorRate).toBeLessThanOrEqual(1);
      expect(health.metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(health.metrics.uptime).toBeLessThanOrEqual(100);
    });
  });

  describe("getActivityLogs", () => {
    it("should return activity logs with default limit", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.admin.getActivityLogs({});

      expect(logs).toBeDefined();
      expect(logs.total).toBeGreaterThanOrEqual(0);
      expect(logs.limit).toBe(50);
      expect(logs.offset).toBe(0);
      expect(Array.isArray(logs.logs)).toBe(true);
    });

    it("should respect limit and offset", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.admin.getActivityLogs({
        limit: 10,
        offset: 0,
      });

      expect(logs.limit).toBe(10);
      expect(logs.offset).toBe(0);
      expect(logs.logs.length).toBeLessThanOrEqual(10);
    });

    it("should have valid log entries", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const logs = await caller.admin.getActivityLogs({});

      if (logs.logs.length > 0) {
        const log = logs.logs[0];
        expect(log.id).toBeDefined();
        expect(log.timestamp).toBeDefined();
        expect(log.action).toBeDefined();
        expect(log.status).toMatch(/success|failed/);
      }
    });
  });

  describe("getAIModelConfig", () => {
    it("should return AI model configuration", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const config = await caller.admin.getAIModelConfig();

      expect(config).toBeDefined();
      expect(config.sentimentAnalysis).toBeDefined();
      expect(config.sentimentAnalysis.enabled).toBe(true);
      expect(config.riskDetection).toBeDefined();
      expect(config.riskDetection.enabled).toBe(true);
      expect(config.recommendations).toBeDefined();
      expect(config.recommendations.enabled).toBe(true);
      expect(config.general).toBeDefined();
    });

    it("should have valid model parameters", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const config = await caller.admin.getAIModelConfig();

      expect(config.general.temperature).toBeGreaterThanOrEqual(0);
      expect(config.general.temperature).toBeLessThanOrEqual(1);
      expect(config.general.max_tokens).toBeGreaterThan(0);
      expect(config.general.top_p).toBeGreaterThanOrEqual(0);
      expect(config.general.top_p).toBeLessThanOrEqual(1);
    });
  });

  describe("updateAIModelConfig", () => {
    it("should update AI model configuration", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.updateAIModelConfig({
        model: "claude-3-opus",
        temperature: 0.8,
        max_tokens: 2500,
      });

      expect(result.success).toBe(true);
      expect(result.config.model).toBe("claude-3-opus");
      expect(result.config.temperature).toBe(0.8);
      expect(result.config.max_tokens).toBe(2500);
    });
  });

  describe("getBackupStatus", () => {
    it("should return backup status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const backup = await caller.admin.getBackupStatus();

      expect(backup).toBeDefined();
      expect(backup.lastBackup).toBeDefined();
      expect(backup.backupFrequency).toBe("daily");
      expect(backup.backupLocation).toBe("AWS S3");
      expect(backup.status).toBe("healthy");
      expect(backup.nextScheduledBackup).toBeDefined();
    });

    it("should have valid backup dates", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const backup = await caller.admin.getBackupStatus();

      expect(backup.lastBackup instanceof Date).toBe(true);
      expect(backup.nextScheduledBackup instanceof Date).toBe(true);
      expect(backup.nextScheduledBackup.getTime()).toBeGreaterThan(backup.lastBackup.getTime());
    });
  });

  describe("triggerBackup", () => {
    it("should trigger manual backup", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.triggerBackup();

      expect(result.success).toBe(true);
      expect(result.message).toContain("Backup");
      expect(result.backupId).toBeDefined();
      expect(result.estimatedTime).toBeDefined();
    });
  });
});
