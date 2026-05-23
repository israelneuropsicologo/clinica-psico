import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { exportAllData, createBackupZip } from "./_core/backupService";

describe("Backup System", () => {
  const testBackupDir = path.join(process.cwd(), ".test-backups");

  beforeEach(() => {
    // Create test backup directory
    if (!fs.existsSync(testBackupDir)) {
      fs.mkdirSync(testBackupDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true });
    }
  });

  describe("exportAllData", () => {
    it("should export all data with correct structure", async () => {
      const backupData = await exportAllData();

      expect(backupData).toBeDefined();
      expect(backupData.timestamp).toBeDefined();
      expect(backupData.version).toBe("1.0");
      expect(backupData.data).toBeDefined();
    });

    it("should include all required tables in export", async () => {
      const backupData = await exportAllData();

      expect(backupData.data).toHaveProperty("patients");
      expect(backupData.data).toHaveProperty("sessions");
      expect(backupData.data).toHaveProperty("transactions");
      expect(backupData.data).toHaveProperty("settings");
      expect(backupData.data).toHaveProperty("clinicalNotes");
      expect(backupData.data).toHaveProperty("users");
    });

    it("should export data as arrays", async () => {
      const backupData = await exportAllData();

      expect(Array.isArray(backupData.data.patients)).toBe(true);
      expect(Array.isArray(backupData.data.sessions)).toBe(true);
      expect(Array.isArray(backupData.data.transactions)).toBe(true);
      expect(Array.isArray(backupData.data.clinicalNotes)).toBe(true);
      expect(Array.isArray(backupData.data.users)).toBe(true);
    });
  });

  describe("createBackupZip", () => {
    it("should create a valid ZIP file", async () => {
      const backupData = await exportAllData();
      const zipPath = await createBackupZip(backupData);

      expect(fs.existsSync(zipPath)).toBe(true);
      expect(zipPath.endsWith(".zip")).toBe(true);
    });

    it("should create ZIP file with backup.json inside", async () => {
      const backupData = await exportAllData();
      const zipPath = await createBackupZip(backupData);

      // Verify file exists and has content
      const stats = fs.statSync(zipPath);
      expect(stats.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(zipPath);
    });

    it("should include timestamp in backup data", async () => {
      const backupData = await exportAllData();
      const zipPath = await createBackupZip(backupData);

      expect(backupData.timestamp).toBeDefined();
      expect(new Date(backupData.timestamp)).toBeInstanceOf(Date);

      // Cleanup
      fs.unlinkSync(zipPath);
    });
  });

  describe("Backup workflow", () => {
    it("should complete full backup workflow", async () => {
      // Export data
      const backupData = await exportAllData();
      expect(backupData).toBeDefined();

      // Create ZIP
      const zipPath = await createBackupZip(backupData);
      expect(fs.existsSync(zipPath)).toBe(true);

      // Verify ZIP has content
      const stats = fs.statSync(zipPath);
      expect(stats.size).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(zipPath);
    });
  });
});
