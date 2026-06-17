import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertPatient,
  InsertUser,
  Patient,
  User,
  patients,
  users,
  anamneseV1,
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

// ─── Patients ──────────────────────────────────────────────────────────────
export async function getPatientById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(patients).where({ id }).limit(1);
  return result[0] ?? null;
}

export async function listPatients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patients);
}

// ─── Users ─────────────────────────────────────────────────────────────────
export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where({ id }).limit(1);
  return result[0] ?? null;
}

// ─── Anamnese ──────────────────────────────────────────────────────────────
export async function getAnamneseByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(anamneseV1).where({ patientId }).limit(1);
  return result[0] ?? null;
}
