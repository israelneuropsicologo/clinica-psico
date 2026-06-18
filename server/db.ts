import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertPatient,
  InsertUser,
  Patient,
  User,
  patients,
  users,
  anamneseV1,
  AnamneseV1,
  InsertAnamneseV1,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
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
  const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getPatientByIdShared(id: number, userId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);
  if (!result[0]) return null;
  // Check if user owns this patient
  if (result[0].userId !== parseInt(userId)) return null;
  return result[0];
}

export async function getPatients(userId: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    let query = db.select().from(patients).where(eq(patients.userId, parseInt(userId)));
    if (search) {
      query = query.where(eq(patients.name, search));
    }
    const result = await query;
    return result;
  } catch (error) {
    console.error('[DB] getPatients error:', error);
    return [];
  }
}

export async function createPatient(data: InsertPatient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(patients).values(data);
  return result[0].insertId;
}

export async function updatePatient(
  id: number,
  userId: string,
  data: Partial<InsertPatient>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership
  const patient = await getPatientById(id);
  if (!patient || patient.userId !== parseInt(userId)) {
    throw new Error("Unauthorized");
  }
  await db.update(patients).set(data).where(eq(patients.id, id));
}

export async function deletePatient(id: number, userId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verify ownership
  const patient = await getPatientById(id);
  if (!patient || patient.userId !== parseInt(userId)) {
    throw new Error("Unauthorized");
  }
  await db.delete(patients).where(eq(patients.id, id));
}

export async function listPatients() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(patients);
}

// ─── Users ─────────────────────────────────────────────────────────────────
export async function getUserById(id: string | number) {
  const db = await getDb();
  if (!db) return null;
  const numId = typeof id === 'string' ? parseInt(id) : id;
  const result = await db.select().from(users).where(eq(users.id, numId)).limit(1);
  return result[0] ?? null;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUser(data: Partial<InsertUser> & { openId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getUserByOpenId(data.openId);
  
  if (existing) {
    // Update existing user
    const updateData: Partial<InsertUser> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.loginMethod !== undefined) updateData.loginMethod = data.loginMethod;
    if (data.lastSignedIn !== undefined) updateData.lastSignedIn = data.lastSignedIn;
    
    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.openId, data.openId));
    }
  } else {
    // Create new user
    await db.insert(users).values({
      openId: data.openId,
      name: data.name || null,
      email: data.email || null,
      loginMethod: data.loginMethod || null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: data.lastSignedIn || new Date(),
    });
  }
}

export async function consolidateToOfficialAccount(
  email: string | undefined,
  openId: string
): Promise<string> {
  // For now, just return the openId as-is
  // In a multi-account scenario, this would consolidate duplicate accounts
  return openId;
}

// ─── Anamnese ──────────────────────────────────────────────────────────────
export async function getAnamneseByPatientId(patientId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(anamneseV1)
    .where(eq(anamneseV1.patientId, patientId))
    .limit(1);
  return result[0] ?? null;
}

export async function createAnamnese(data: InsertAnamneseV1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(anamneseV1).values(data);
  return result[0].insertId;
}

export async function updateAnamnese(
  id: number,
  data: Partial<InsertAnamneseV1>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(anamneseV1).set(data).where(eq(anamneseV1.id, id));
}
