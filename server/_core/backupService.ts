import { google } from "googleapis";
import { getDb } from "../db";
import {
  patients,
  sessions,
  transactions,
  settings,
  clinicalNotes,
  users,
} from "../../drizzle/schema";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

const drive = google.drive("v3");

// Initialize Google Drive auth
function getGoogleDriveAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || "{}");

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return auth;
}

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

// Upload backup to Google Drive
export async function uploadBackupToGoogleDrive(
  zipPath: string
): Promise<string> {
  const auth = getGoogleDriveAuth();
  const authClient = await auth.getClient();

  // Get or create "Backups" folder
  let backupsFolderId: string | null = null;

  const folderList = await drive.files.list({
    auth: authClient as any,
    q: "name='Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: "drive",
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (folderList.data?.files && folderList.data.files.length > 0) {
    backupsFolderId = folderList.data.files[0].id!;
  } else {
    // Create "Backups" folder
    const folderRes = await drive.files.create({
      auth: authClient as any,
      requestBody: {
        name: "Backups",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    backupsFolderId = folderRes.data?.id!;
  }

  // Upload ZIP file
  const fileName = path.basename(zipPath);
  const fileStream = fs.createReadStream(zipPath);

  const uploadRes = await drive.files.create({
    auth: authClient as any,
    requestBody: {
      name: fileName,
      mimeType: "application/zip",
      parents: [backupsFolderId],
    },
    media: {
      mimeType: "application/zip",
      body: fileStream,
    },
    fields: "id, webViewLink",
  });

  // Clean up local ZIP file
  fs.unlinkSync(zipPath);

  return uploadRes.data?.webViewLink || uploadRes.data?.id || "";
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

    // Upload to Google Drive
    const driveLink = await uploadBackupToGoogleDrive(zipPath);
    console.log(`[Backup] Uploaded to Google Drive: ${driveLink}`);

    return {
      success: true,
      timestamp: backupData.timestamp,
      driveLink,
    };
  } catch (error) {
    console.error("[Backup] Error:", error);
    throw error;
  }
}

// List backups from Google Drive
export async function listBackupsFromGoogleDrive() {
  const auth = getGoogleDriveAuth();
  const authClient = await auth.getClient();

  // Get "Backups" folder
  const folderList = await drive.files.list({
    auth: authClient as any,
    q: "name='Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    spaces: "drive",
    fields: "files(id)",
    pageSize: 1,
  });

  if (!folderList.data?.files || folderList.data.files.length === 0) {
    return [];
  }

  const backupsFolderId = folderList.data.files[0].id!;

  // List backup files
  const fileList = await drive.files.list({
    auth: authClient as any,
    q: `'${backupsFolderId}' in parents and trashed=false`,
    spaces: "drive",
    fields: "files(id, name, createdTime, size, webViewLink)",
    orderBy: "createdTime desc",
    pageSize: 30,
  });

  return (
    fileList.data?.files?.map((file) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      size: file.size,
      webViewLink: file.webViewLink,
    })) || []
  );
}

// Download and restore backup from Google Drive
export async function restoreBackupFromGoogleDrive(fileId: string) {
  const auth = getGoogleDriveAuth();
  const authClient = await auth.getClient();

  // Download file
  const backupDir = path.join(process.cwd(), ".backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const zipPath = path.join(backupDir, `restore_${Date.now()}.zip`);

  const res = await drive.files.get(
    {
      auth: authClient as any,
      fileId,
      alt: "media",
    },
    { responseType: "stream" }
  );

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);
    res.data
      .on("end", () => {
        file.close();
        resolve(zipPath);
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(zipPath, () => {});
        reject(err);
      })
      .pipe(file);
  });
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
