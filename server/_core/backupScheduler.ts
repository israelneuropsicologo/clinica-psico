import * as cron from "node-cron";
import { executeFullBackup } from "./backupService";

let backupJob: cron.ScheduledTask | null = null;

/**
 * Start the daily backup scheduler
 * Runs every day at 2:00 AM (02:00)
 */
export function startBackupScheduler() {
  if (backupJob) {
    console.log("[Backup Scheduler] Scheduler already running");
    return;
  }

  // Schedule backup for 2:00 AM every day
  // Cron format: second minute hour day month dayOfWeek
  backupJob = cron.schedule("0 2 * * *", async () => {
    console.log("[Backup Scheduler] Starting scheduled backup at 2:00 AM");
    try {
      const result = await executeFullBackup();
      console.log("[Backup Scheduler] Backup completed successfully:", result);
    } catch (error) {
      console.error("[Backup Scheduler] Backup failed:", error);
    }
  });

  console.log("[Backup Scheduler] Daily backup scheduler started (2:00 AM)");
}

/**
 * Stop the backup scheduler
 */
export function stopBackupScheduler() {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
    console.log("[Backup Scheduler] Backup scheduler stopped");
  }
}

/**
 * Trigger manual backup immediately
 */
export async function triggerManualBackup() {
  console.log("[Backup Scheduler] Triggering manual backup");
  try {
    const result = await executeFullBackup();
    console.log("[Backup Scheduler] Manual backup completed:", result);
    return result;
  } catch (error) {
    console.error("[Backup Scheduler] Manual backup failed:", error);
    throw error;
  }
}
