import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  User,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// Placeholder functions for compatibility - these tables don't exist yet
export async function getPatients() { return []; }
export async function getPatientById() { return undefined; }
export async function createPatient() { return 0; }
export async function updatePatient() { return; }
export async function deletePatient() { return; }
export async function getPatientCount() { return 0; }
export async function getSessions() { return []; }
export async function getSessionById() { return undefined; }
export async function createSession() { return 0; }
export async function updateSession() { return; }
export async function deleteSession() { return; }
export async function getSessionsThisMonth() { return 0; }
export async function getUpcomingSessions() { return []; }
export async function getClinicalNotesBySession() { return []; }
export async function getClinicalNotesByPatient() { return []; }
export async function createClinicalNote() { return 0; }
export async function updateClinicalNote() { return; }
export async function deleteClinicalNote() { return; }
export async function getDocumentsByPatient() { return []; }
export async function createDocument() { return 0; }
export async function deletDocument() { return; }
export async function getTransactions() { return []; }
export async function createTransaction() { return 0; }
export async function updateTransaction() { return; }
export async function getMonthlyRevenue() { return 0; }
export async function getOverdueSessions() { return []; }
export async function getPatientByIdShared() { return undefined; }
export async function checkDuplicateSession() { return false; }
