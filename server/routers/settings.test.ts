import { describe, it, expect, beforeEach, vi } from "vitest";
import { settingsRouter } from "./settings";
import { getDb } from "../db";

// Mock do getDb
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Settings Router", () => {
  const mockUserId = 1;
  const mockUser = {
    id: mockUserId,
    email: "test@example.com",
    name: "Test User",
    role: "user" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get procedure", () => {
    it("should return existing settings", async () => {
      const existingSettings = {
        id: 1,
        userId: mockUserId,
        clinicName: "My Clinic",
        clinicEmail: "clinic@example.com",
        clinicPhone: "(21) 98765-4321",
        clinicAddress: "Rua Test, 123",
        clinicCity: "Rio de Janeiro",
        clinicState: "RJ",
        clinicZipCode: "20000-000",
        ownerName: "Test Owner",
        ownerEmail: "owner@example.com",
        ownerPhone: "(21) 98765-4321",
        ownerCPF: "12345678900",
        ownerCRPNumber: "05/12345",
        ownerSpecialty: "Psychologist",
        ownerBio: "Bio",
        ownerWhatsapp: "(21) 98765-4321",
        ownerInstagram: "instagram",
        ownerLinkedin: "linkedin",
        ownerWebsite: "https://example.com",
        systemTitle: "System Title",
        systemSubtitle: "System Subtitle",
        sessionDefaultDuration: 60,
        sessionDefaultPrice: "200.00",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([existingSettings]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.get();

      expect(result).toEqual(existingSettings);
      expect(result.clinicName).toBe("My Clinic");
    });

    it("should return clinic name correctly", async () => {
      const settings = {
        id: 1,
        userId: mockUserId,
        clinicName: "Consultório Test",
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([settings]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.get();

      expect(result.clinicName).toBe("Consultório Test");
    });
  });

  describe("update procedure", () => {
    it("should update existing settings", async () => {
      const existingSettings = {
        id: 1,
        userId: mockUserId,
      };

      const updatedSettings = {
        id: 1,
        userId: mockUserId,
        clinicName: "Updated Clinic",
        clinicEmail: "updated@example.com",
      };

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([existingSettings]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([updatedSettings]),
          }),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([updatedSettings]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.update({
        clinicName: "Updated Clinic",
        clinicEmail: "updated@example.com",
      });

      expect(result).toBeDefined();
      expect(result.clinicName).toBe("Updated Clinic");
      expect(result.clinicEmail).toBe("updated@example.com");
    });

    it("should handle partial updates", async () => {
      const existingSettings = {
        id: 1,
        userId: mockUserId,
        clinicName: "Original Name",
      };

      const updatedSettings = {
        id: 1,
        userId: mockUserId,
        clinicName: "Updated Name",
      };

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([existingSettings]),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue([updatedSettings]),
          }),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([updatedSettings]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.update({
        clinicName: "Updated Name",
      });

      expect(result.clinicName).toBe("Updated Name");
    });


  });

  describe("backup procedures", () => {
    it("should trigger backup successfully", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.triggerBackup();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it("should list backups from Google Drive", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const caller = settingsRouter.createCaller({ user: mockUser });
      const result = await caller.listBackups();

      expect(result).toBeDefined();
      expect(typeof result === "object").toBe(true);
    });
  });


});
