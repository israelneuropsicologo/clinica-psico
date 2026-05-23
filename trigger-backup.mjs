#!/usr/bin/env node
import { executeFullBackup } from "./dist/index.js";

async function runBackup() {
  try {
    console.log("Starting backup...");
    const result = await executeFullBackup();
    console.log("Backup completed successfully:", result);
    process.exit(0);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

runBackup();
