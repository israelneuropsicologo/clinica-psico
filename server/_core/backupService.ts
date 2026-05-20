import { getDb } from "../db";
import {
  patients,
  sessions,
  transactions,
  settings,
  clinicalNotes,
  users,
} from "../../drizzle/schema";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";
import { storagePut, storageGet } from "../storage";

// Export all database data to JSON
export async function exportAllData() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const backupData = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    data: {
      patients: await db.select().from(patients),
      sessions: await db.select().from(sessions),
      transactions: await db.select().from(transactions),
      settings: await db.select().from(settings),
      clinicalNotes: await db.select().from(clinicalNotes),
      users: await db.select().from(users),
    },
  };

  return backupData;
}

// Create ZIP file with backup data
export async function createBackupZip(backupData: any): Promise<string> {
  const backupDir = path.join(process.cwd(), ".backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const zipPath = path.join(backupDir, `backup_${timestamp}.zip`);
  const jsonPath = path.join(backupDir, `backup_${timestamp}.json`);

  // Write JSON file
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));

  // Create ZIP file
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      // Clean up JSON file after zipping
      fs.unlinkSync(jsonPath);
      resolve(zipPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.file(jsonPath, { name: `backup_${timestamp}.json` });
    archive.finalize();
  });
}

// Upload backup to Manus Storage
export async function uploadBackupToStorage(zipPath: string): Promise<string> {
  try {
    const fileName = path.basename(zipPath);
    const fileBuffer = fs.readFileSync(zipPath);

    // Upload to Manus Storage
    const { url } = await storagePut(
      `backups/${fileName}`,
      fileBuffer,
      "application/zip"
    );

    // Clean up local ZIP file
    fs.unlinkSync(zipPath);

    return url;
  } catch (error) {
    console.error("[Backup] Storage upload error:", error);
    throw error;
  }
}

// Trigger manual backup
export async function triggerManualBackup() {
  return executeFullBackup();
}

// Execute full backup
export async function executeFullBackup() {
  try {
    console.log("[Backup] Starting full backup...");

    // Export data
    const backupData = await exportAllData();
    console.log("[Backup] Data exported successfully");

    // Create ZIP
    const zipPath = await createBackupZip(backupData);
    console.log(`[Backup] ZIP created: ${zipPath}`);

    // Upload to Manus Storage
    const storageUrl = await uploadBackupToStorage(zipPath);
    console.log(`[Backup] Uploaded to storage: ${storageUrl}`);

    return {
      success: true,
      timestamp: backupData.timestamp,
      storageUrl,
    };
  } catch (error) {
    console.error("[Backup] Error:", error);
    throw error;
  }
}

// List backups from local directory
export async function listBackupsFromGoogleDrive() {
  try {
    const backupDir = path.join(process.cwd(), ".backups");
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter((f) => f.endsWith(".zip"))
      .map((f) => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          id: f,
          name: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          path: filePath,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30); // Return last 30 backups

    return backups;
  } catch (error) {
    console.error("[Backup] Error listing backups:", error);
    return [];
  }
}

// Download and restore backup from storage
export async function restoreBackupFromGoogleDrive(fileId: string) {
  // This would need to be implemented with storage API
  throw new Error("Restore from storage not yet implemented");
}

// Extract and import backup data
export async function extractAndImportBackup(zipPath: string) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database connection failed");
  const extractDir = path.join(path.dirname(zipPath), `extract_${Date.now()}`);

  try {
    // Create extraction directory
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    // Extract ZIP file using archiver
    const unzipper = require("unzipper");
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractDir }))
        .on("close", () => resolve())
        .on("error", reject);
    });

    // Read backup data
    const backupDataPath = path.join(extractDir, "backup.json");
    if (!fs.existsSync(backupDataPath)) {
      throw new Error("backup.json not found in ZIP");
    }

    const backupDataStr = fs.readFileSync(backupDataPath, "utf-8");
    const backupData = JSON.parse(backupDataStr);

    console.log("[Restore] Backup data loaded, starting import...");

    // Clear existing data and import from backup
    // Note: This is a destructive operation - it will replace all data
    if (backupData.data) {
      // Delete all existing data first
      await dbInstance.delete(patients);
      await dbInstance.delete(sessions);
      await dbInstance.delete(transactions);
      await dbInstance.delete(clinicalNotes);
      await dbInstance.delete(users);

      console.log("[Restore] Existing data cleared");

      // Import data from backup
      if (backupData.data.patients && backupData.data.patients.length > 0) {
        await dbInstance.insert(patients).values(backupData.data.patients);
        console.log(`[Restore] Imported ${backupData.data.patients.length} patients`);
      }

      if (backupData.data.sessions && backupData.data.sessions.length > 0) {
        await dbInstance.insert(sessions).values(backupData.data.sessions);
        console.log(`[Restore] Imported ${backupData.data.sessions.length} sessions`);
      }

      if (backupData.data.transactions && backupData.data.transactions.length > 0) {
        await dbInstance.insert(transactions).values(backupData.data.transactions);
        console.log(`[Restore] Imported ${backupData.data.transactions.length} transactions`);
      }

      if (backupData.data.clinicalNotes && backupData.data.clinicalNotes.length > 0) {
        await dbInstance.insert(clinicalNotes).values(backupData.data.clinicalNotes);
        console.log(`[Restore] Imported ${backupData.data.clinicalNotes.length} clinical notes`);
      }

      if (backupData.data.users && backupData.data.users.length > 0) {
        await dbInstance.insert(users).values(backupData.data.users);
        console.log(`[Restore] Imported ${backupData.data.users.length} users`);
      }
    }

    console.log("[Restore] Backup restoration completed successfully");
    return { success: true, message: "Backup restored successfully" };
  } catch (error) {
    console.error("[Restore] Error during restoration:", error);
    throw error;
  } finally {
    // Cleanup
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true });
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}
