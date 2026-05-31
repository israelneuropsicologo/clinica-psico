import { and, desc, eq, gte, inArray, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ClinicalNote,
  InsertClinicalNote,
  InsertPatient,
  InsertPatientDocument,
  InsertSession,
  InsertTransaction,
  InsertUser,
  InsertUserLink,
  Patient,
  PatientDocument,
  Session,
  SessionWithPatient,
  Transaction,
  User,
  UserLink,
  clinicalNotes,
  patientDocuments,
  patients,
  sessions,
  transactions,
  userLinks,
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

// ─── Patients ──────────────────────────────────────────────────────────────

export async function getPatients(userId: number, search?: string, status?: string): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(patients.userId, userId)];
  if (status && status !== "all") {
    conditions.push(eq(patients.status, status as Patient["status"]));
  }
  if (search) {
    conditions.push(
      or(
        like(patients.name, `%${search}%`),
        like(patients.email, `%${search}%`),
        like(patients.phone, `%${search}%`),
        like(patients.cpf, `%${search}%`)
      )!
    );
  }

  return db.select().from(patients).where(and(...conditions)).orderBy(patients.name);
}

export async function getPatientById(id: number, userId: number): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, id), eq(patients.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createPatient(data: InsertPatient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(patients).values(data);
  const patientId = (result[0] as { insertId: number }).insertId;
  
  // Criar uma sessão padrão automaticamente
  let sessionId: number | null = null;
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Próximo dia
    tomorrow.setHours(9, 0, 0, 0); // 09:00 AM
    const scheduledAtMs = tomorrow.getTime(); // Converter para ms
    
    const sessionResult = await db.insert(sessions).values({
      patientId,
      userId: data.userId,
      scheduledAt: scheduledAtMs,
      durationMinutes: 50,
      sessionType: "individual",
      modality: "in_person",
      status: "scheduled",
      isPaid: "pending",
      notes: "Sessão criada automaticamente",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    sessionId = (sessionResult[0] as { insertId: number }).insertId;
    console.log(`[Success] Sessão automática criada para paciente ${patientId}`);
  } catch (error) {
    console.error("[Error] Falha ao criar sessão padrão para paciente", patientId, ":", error);
    // Não interromper o fluxo se a sessão não for criada
  }
  
  // Criar uma nota clínica padrão automaticamente
  if (sessionId) {
    try {
      await db.insert(clinicalNotes).values({
        sessionId,
        patientId,
        userId: data.userId,
        content: "Nota clínica criada automaticamente ao registrar o paciente.",
        sessionNumber: 0,
        sessionType2: "individual",
        modality2: "in_person",
        selfHarmRisk: "absent" as const,
        thirdPartyRisk: "absent" as const,
        suicideRisk: "absent" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[Success] Nota clínica automática criada para paciente ${patientId}`);
    } catch (error) {
      console.error("[Error] Falha ao criar nota clínica padrão para paciente", patientId, ":", error);
      // Não interromper o fluxo se a nota não for criada
    }
  }
  
  return patientId;
}

export async function updatePatient(id: number, userId: number, data: Partial<InsertPatient>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(patients).set(data).where(and(eq(patients.id, id), eq(patients.userId, userId)));
}

export async function deletePatient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(patients).where(and(eq(patients.id, id), eq(patients.userId, userId)));
}

export async function getPatientCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(and(eq(patients.userId, userId), eq(patients.status, "active")));
  return Number(result[0]?.count ?? 0);
}

// ─── Sessions ──────────────────────────────────────────────────────────────

export async function getSessions(
  userId: number,
  opts?: { patientId?: number; status?: string; isPaid?: string; from?: number; to?: number }
): Promise<SessionWithPatient[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(sessions.userId, userId)];
  if (opts?.patientId) conditions.push(eq(sessions.patientId, opts.patientId));
  if (opts?.status && opts.status !== "all") {
    conditions.push(eq(sessions.status, opts.status as Session["status"]));
  }
  if (opts?.isPaid && opts.isPaid !== "all") {
    conditions.push(eq(sessions.isPaid, opts.isPaid as Session["isPaid"]));
  }
  if (opts?.from) conditions.push(gte(sessions.scheduledAt, opts.from));
  if (opts?.to) conditions.push(lte(sessions.scheduledAt, opts.to));
  
  const result = await db
    .select()
    .from(sessions)
    .leftJoin(patients, eq(sessions.patientId, patients.id))
    .where(and(...conditions))
    .orderBy(desc(sessions.scheduledAt));
  
  return result.map(row => ({
    ...row.sessions,
    patient: row.patients || undefined,
  }));
}

/**
 * Verificar se já existe uma sessão agendada para o mesmo paciente na mesma data/hora
 * Retorna true se há duplicação (sessão já existe)
 */
export async function checkDuplicateSession(
  userId: number,
  patientId: number,
  scheduledAt: number,
  excludeSessionId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verificar se há sessão dentro de 1 hora da data/hora fornecida
  const oneHourMs = 60 * 60 * 1000;
  const startTime = scheduledAt - oneHourMs;
  const endTime = scheduledAt + oneHourMs;

  const conditions: any[] = [
    eq(sessions.userId, userId),
    eq(sessions.patientId, patientId),
    gte(sessions.scheduledAt, startTime),
    lte(sessions.scheduledAt, endTime),
  ];
  
  if (excludeSessionId) {
    conditions.push(ne(sessions.id, excludeSessionId));
  }

  const result = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0;
}

export async function getSessionById(id: number, userId: number): Promise<Session | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function createSession(data: InsertSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(sessions).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set(data).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

export async function deleteSession(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

export async function getSessionsThisMonth(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.scheduledAt, start), lte(sessions.scheduledAt, end)));
  return Number(result[0]?.count ?? 0);
}

export async function getUpcomingSessions(userId: number, limit = 5): Promise<SessionWithPatient[]> {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  const result = await db
    .select()
    .from(sessions)
    .leftJoin(patients, eq(sessions.patientId, patients.id))
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.scheduledAt, now),
        or(eq(sessions.status, "scheduled"), eq(sessions.status, "confirmed"))!
      )
    )
    .orderBy(sessions.scheduledAt)
    .limit(limit);
  return result.map(row => ({
    ...row.sessions,
    patient: row.patients || undefined,
  }));
}

// ─── Clinical Notes ────────────────────────────────────────────────────────

export async function getClinicalNotesBySession(sessionId: number, userId: number): Promise<ClinicalNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clinicalNotes)
    .where(and(eq(clinicalNotes.sessionId, sessionId), eq(clinicalNotes.userId, userId)))
    .orderBy(desc(clinicalNotes.createdAt));
}

export async function getClinicalNotesByPatient(patientId: number, userId: number): Promise<ClinicalNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clinicalNotes)
    .where(and(eq(clinicalNotes.patientId, patientId), eq(clinicalNotes.userId, userId)))
    .orderBy(desc(clinicalNotes.createdAt));
}

export async function createClinicalNote(data: InsertClinicalNote): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(clinicalNotes).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateClinicalNote(id: number, userId: number, data: Partial<InsertClinicalNote>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Strip undefined values to avoid Drizzle sending NULL for NOT NULL columns
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  ) as Partial<InsertClinicalNote>;
  if (Object.keys(cleanData).length === 0) return;
  await db.update(clinicalNotes).set(cleanData).where(and(eq(clinicalNotes.id, id), eq(clinicalNotes.userId, userId)));
}

// ─── Transactions ──────────────────────────────────────────────────────────

export async function getTransactions(
  userId: number,
  opts?: { patientId?: number; status?: string; from?: number; to?: number }
): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(transactions.userId, userId)];
  if (opts?.patientId) conditions.push(eq(transactions.patientId, opts.patientId));
  if (opts?.status && opts.status !== "all") {
    conditions.push(eq(transactions.status, opts.status as Transaction["status"]));
  }
  if (opts?.from) conditions.push(gte(transactions.createdAt, new Date(opts.from)));
  if (opts?.to) conditions.push(lte(transactions.createdAt, new Date(opts.to)));

  return db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.createdAt));
}

export async function createTransaction(data: InsertTransaction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(transactions).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateTransaction(
  id: number,
  userId: number,
  data: Partial<InsertTransaction>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(transactions).set(data).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function getMonthlyRevenue(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "income"),
        eq(transactions.status, "paid"),
        gte(transactions.createdAt, start),
        lte(transactions.createdAt, end)
      )
    );
  return Number(result[0]?.total ?? 0);
}

export async function getOverdueSessions(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.status, "completed"),
        eq(sessions.isPaid, "pending")
      )
    );
  return Number(result[0]?.count ?? 0);
}

// ─── Patient Documents ─────────────────────────────────────────────────────

export async function getDocumentsByPatient(patientId: number, userId: number): Promise<PatientDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(patientDocuments)
    .where(and(eq(patientDocuments.patientId, patientId), eq(patientDocuments.userId, userId)))
    .orderBy(desc(patientDocuments.createdAt));
}

export async function createDocument(data: InsertPatientDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(patientDocuments).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function deletDocument(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(patientDocuments).where(and(eq(patientDocuments.id, id), eq(patientDocuments.userId, userId)));
}


// ─── User Links (Sincronização de Usuários) ────────────────────────────────

export async function linkUsers(primaryUserId: number, linkedUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Verificar se já existe link
  const existing = await db
    .select()
    .from(userLinks)
    .where(and(eq(userLinks.primaryUserId, primaryUserId), eq(userLinks.linkedUserId, linkedUserId)))
    .limit(1);
  
  if (!existing.length) {
    await db.insert(userLinks).values({ primaryUserId, linkedUserId });
  }
}

export async function getLinkedUserIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [userId];
  
  // Buscar onde este usuário é primary
  const primaryLinks = await db
    .select({ linkedUserId: userLinks.linkedUserId })
    .from(userLinks)
    .where(eq(userLinks.primaryUserId, userId));
  
  // Buscar onde este usuário é linked (vinculado por outro)
  const linkedByOthers = await db
    .select({ primaryUserId: userLinks.primaryUserId })
    .from(userLinks)
    .where(eq(userLinks.linkedUserId, userId));
  
  // Retornar o usuário original + todos os vinculados
  const allLinked = [userId, ...primaryLinks.map(l => l.linkedUserId), ...linkedByOthers.map(l => l.primaryUserId)];
  return Array.from(new Set(allLinked)); // Remove duplicatas
}

export async function getPatientsShared(userId: number, search?: string, status?: string): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar IDs de todos os usuários vinculados
  const linkedUserIds = await getLinkedUserIds(userId);
  
  const conditions = [inArray(patients.userId, linkedUserIds)];
  
  if (status && status !== "all") {
    conditions.push(eq(patients.status, status as Patient["status"]));
  }
  if (search) {
    conditions.push(
      or(
        like(patients.name, `%${search}%`),
        like(patients.email, `%${search}%`),
        like(patients.phone, `%${search}%`),
        like(patients.cpf, `%${search}%`)
      )!
    );
  }
  
  return db.select().from(patients).where(and(...conditions)).orderBy(patients.name);
}

export async function getPatientByIdShared(id: number, userId: number): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Buscar IDs de todos os usuários vinculados
  const linkedUserIds = await getLinkedUserIds(userId);
  
  const result = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, id), sql`${patients.userId} IN (${sql.join(linkedUserIds)})`))
    .limit(1);
  
  return result[0];
}

export async function getSessionsShared(userId: number, patientId?: number, status?: string): Promise<Session[]> {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar IDs de todos os usuários vinculados
  const linkedUserIds = await getLinkedUserIds(userId);
  
  const conditions = [sql`${sessions.userId} IN (${sql.join(linkedUserIds)})`];
  
  if (patientId) {
    conditions.push(eq(sessions.patientId, patientId));
  }
  if (status && status !== "all") {
    conditions.push(eq(sessions.status, status as Session["status"]));
  }
  
  return db.select().from(sessions).where(and(...conditions)).orderBy(desc(sessions.scheduledAt));
}

// ─── Shared Patient Count (para sincronização) ──────────────────────────────
export async function getPatientCountShared(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const linkedUserIds = await getLinkedUserIds(userId);
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(patients)
    .where(and(inArray(patients.userId, linkedUserIds), eq(patients.status, "active")));
  return Number(result[0]?.count ?? 0);
}

// ─── Shared Sessions This Month (para sincronização) ────────────────────────
export async function getSessionsThisMonthShared(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const linkedUserIds = await getLinkedUserIds(userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        inArray(sessions.userId, linkedUserIds),
        gte(sessions.scheduledAt, startOfMonth),
        lte(sessions.scheduledAt, endOfMonth)
      )
    );
  return Number(result[0]?.count ?? 0);
}

// ─── Shared Monthly Revenue (para sincronização) ──────────────────────────
export async function getMonthlyRevenueShared(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const linkedUserIds = await getLinkedUserIds(userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime();
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(
      and(
        inArray(transactions.userId, linkedUserIds),
        eq(transactions.type, "income"),
        eq(transactions.status, "paid"),
        gte(transactions.paidAt, startOfMonth),
        lte(transactions.paidAt, endOfMonth)
      )
    );
  return Number(result[0]?.total ?? 0);
}

// ─── Shared Overdue Sessions (para sincronização) ──────────────────────────
export async function getOverdueSessionsShared(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const linkedUserIds = await getLinkedUserIds(userId);
  const now = Date.now();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(
      and(
        inArray(sessions.userId, linkedUserIds),
        lte(sessions.scheduledAt, now),
        eq(sessions.status, "scheduled")
      )
    );
  return Number(result[0]?.count ?? 0);
}

// ─── Shared Upcoming Sessions (para sincronização) ────────────────────────
export async function getUpcomingSessionsShared(userId: number, limit: number = 5): Promise<Session[]> {
  const db = await getDb();
  if (!db) return [];
  const linkedUserIds = await getLinkedUserIds(userId);
  const now = Date.now();
  return db
    .select()
    .from(sessions)
    .where(
      and(
        inArray(sessions.userId, linkedUserIds),
        gte(sessions.scheduledAt, now),
        eq(sessions.status, "scheduled")
      )
    )
    .orderBy(sessions.scheduledAt)
    .limit(limit);
}
