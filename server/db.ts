import { and, desc, eq, gte, inArray, like, lte, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ClinicalNote,
  EmailAlias,
  InsertClinicalNote,
  InsertPatient,
  InsertPatientDocument,
  InsertSession,
  InsertSettings,
  InsertTransaction,
  InsertUser,
  InsertUserLink,
  InsertUserShare,
  Patient,
  PatientDocument,
  Session,
  SessionWithPatient,
  Settings,
  Transaction,
  User,
  UserLink,
  UserShare,
  clinicalNotes,
  emailAliases,
  patientDocuments,
  patients,
  sessions,
  settings,
  transactions,
  userLinks,
  userShares,
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

// Helper para obter clinicId do usuário (para compartilhamento de clínicas)
export async function getClinicIdForUser(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) return null;
  
  return user[0].clinicId || null;
}

// ─── Users ─────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  // Buscar usuário existente para preservar clinicId
  const existingUser = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);
  const existingClinicId = existingUser?.[0]?.clinicId;

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
  // Preservar clinicId existente
  if (existingClinicId) {
    values.clinicId = existingClinicId;
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

  // Obter clinicId do usuario
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRecord || userRecord.length === 0) return [];
  
  // Buscar pacientes compartilhados
  const sharedPatients = await db
    .select({ patientId: userShares.patientId })
    .from(userShares)
    .where(eq(userShares.toUserId, userId));
  
  const sharedPatientIds = sharedPatients.map((sp) => sp.patientId);
  
  // Construir condicoes: pacientes proprios OU compartilhados
  const patientConditions: any[] = [];
  if (sharedPatientIds.length > 0) {
    patientConditions.push(
      or(
        eq(patients.userId, userId),
        inArray(patients.id, sharedPatientIds)
      )!
    );
  } else {
    patientConditions.push(eq(patients.userId, userId));
  }
  
  if (status && status !== "all") {
    patientConditions.push(eq(patients.status, status as Patient["status"]));
  }
  if (search) {
    patientConditions.push(
      or(
        like(patients.name, `%${search}%`),
        like(patients.email, `%${search}%`),
        like(patients.phone, `%${search}%`),
        like(patients.cpf, `%${search}%`)
      )!
    );
  }

  return db.select().from(patients).where(and(...patientConditions)).orderBy(patients.name);
}

export async function getPatientById(id: number, userId: number): Promise<Patient | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // Verificar se eh o proprietario
  const owned = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, id), eq(patients.userId, userId)))
    .limit(1);
  
  if (owned && owned.length > 0) return owned[0];
  
  // Verificar se foi compartilhado
  const shared = await db
    .select()
    .from(patients)
    .innerJoin(userShares, eq(patients.id, userShares.patientId))
    .where(
      and(
        eq(patients.id, id),
        eq(userShares.toUserId, userId)
      )
    )
    .limit(1);
  
  return shared && shared.length > 0 ? shared[0].patients : undefined;
}

export async function createPatient(data: InsertPatient): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(patients).values(data);
  const patientId = (result[0] as { insertId: number }).insertId;
  
  // NÃO criar sessão/nota automática - deixar para o webhook/router decidir
  // Isso permite que cada origem (site, chatbot, manual) crie a sessão com dados corretos
  
  return patientId;
}

export async function updatePatient(id: number, userId: number, data: Partial<InsertPatient>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Atualizar paciente sem filtro de userId (todos os usuários compartilham o mesmo banco)
  await db.update(patients).set(data).where(eq(patients.id, id));
}

export async function deletePatient(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  // Deletar paciente usando userId diretamente
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
  // Buscar sessões dos pacientes do usuário
  const conditions = [eq(patients.userId, userId)];
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
  // Buscar sessão através do paciente (não apenas sessions.userId)
  // Isso permite acesso em sistema multi-conta
  const patientIds = db.select({ id: patients.id }).from(patients).where(eq(patients.userId, userId));
  const result = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.id, id),
        inArray(sessions.patientId, patientIds)
      )
    )
    .limit(1);
  return result[0];
}

export async function createSession(data: InsertSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  
  // Validar se o usuario tem acesso ao paciente (proprietario ou compartilhado)
  const hasAccess = await canAccessPatient(data.userId, data.patientId);
  if (!hasAccess) {
    throw new Error("You don't have permission to create a session for this patient");
  }
  
  const result = await db.insert(sessions).values(data);
  return (result[0] as { insertId: number }).insertId;
}

export async function updateSession(id: number, userId: number, data: Partial<InsertSession>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Autorizar update se o paciente pertence ao usuário (não apenas se a sessão pertence)
  // Isso permite que usuários com acesso ao paciente atualizem a sessão
  const patientIds = db.select({ id: patients.id }).from(patients).where(eq(patients.userId, userId));
  await db.update(sessions)
    .set(data)
    .where(
      and(
        eq(sessions.id, id),
        inArray(sessions.patientId, patientIds)
      )
    );
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
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .innerJoin(patients, eq(sessions.patientId, patients.id))
    .where(and(eq(patients.userId, userId), gte(sessions.scheduledAt, start), lte(sessions.scheduledAt, end)));
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
        eq(patients.userId, userId),
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
    .innerJoin(patients, eq(transactions.patientId, patients.id))
    .where(
      and(
        eq(patients.userId, userId),
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
    .innerJoin(patients, eq(sessions.patientId, patients.id))
    .where(
      and(
        eq(patients.userId, userId),
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
  
  // Verificar se eh o proprietario ou foi compartilhado
  const result = await db
    .select()
    .from(patients)
    .where(
      or(
        and(eq(patients.id, id), sql`${patients.userId} IN (${sql.join(linkedUserIds)})`),
        and(
          eq(patients.id, id),
          inArray(
            patients.id,
            db.select({ patientId: userShares.patientId }).from(userShares).where(eq(userShares.toUserId, userId))
          )
        )
      )
    )
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

// ─── Settings (Configurações do Sistema) ────────────────────────────────────

/**
 * Obter configurações do usuário
 */
export async function getSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Criar ou atualizar configurações do usuário
 */
export async function upsertSettings(userId: number, data: Partial<InsertSettings>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getSettings(userId);

  if (existing) {
    // Atualizar configurações existentes
    await db
      .update(settings)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(settings.userId, userId));
  } else {
    // Criar novas configurações
    await db.insert(settings).values({
      userId,
      clinicName: data.clinicName || "Minha Clínica",
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Atualizar campo específico de configurações
 */
export async function updateSettingsField(
  userId: number,
  field: keyof InsertSettings,
  value: any
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = {
    [field]: value,
    updatedAt: new Date(),
  };

  await db
    .update(settings)
    .set(updateData)
    .where(eq(settings.userId, userId));
}


// ─── Email Mapping (Consolidação de Contas) ────────────────────────────────

/**
 * Mapeia e-mails alternativos para o openId oficial
 * Garante que qualquer e-mail que você use sempre acessa a mesma conta
 */
const OFFICIAL_EMAIL = "israelneuropsicolo@gmail.com";

/**
 * Obter o openId oficial do usuário
 * Se o e-mail for um alias, retorna o openId do usuário principal
 */
export async function getOfficialOpenId(email: string | null | undefined, currentOpenId: string): Promise<string> {
  if (!email) return currentOpenId;

  const db = await getDb();
  if (!db) return currentOpenId;

  try {
    // 1. Verificar se o email é um alias
    const aliasResult = await db
      .select()
      .from(emailAliases)
      .where(eq(emailAliases.email, email))
      .limit(1);

    if (aliasResult[0]) {
      // Email é um alias, obter o usuário principal
      const mainUser = await db
        .select()
        .from(users)
        .where(eq(users.id, aliasResult[0].userId))
        .limit(1);

      if (mainUser[0]) {
        console.log(`[Email Alias] Email ${email} is alias for user ID ${mainUser[0].id}, using openId: ${mainUser[0].openId}`);
        return mainUser[0].openId;
      }
    }

    // 2. Se não for alias, verificar se é o email oficial
    if (email === OFFICIAL_EMAIL) return currentOpenId;

    // 3. Se for outro e-mail, busca o openId do e-mail oficial (fallback)
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, OFFICIAL_EMAIL))
      .limit(1);

    if (result[0]) {
      console.log(`[Email Mapping] Redirecting ${email} to official account ${OFFICIAL_EMAIL} (openId: ${result[0].openId})`);
      return result[0].openId;
    }
  } catch (error) {
    console.error("[Email Mapping] Error fetching official openId:", error);
  }

  return currentOpenId;
}

/**
 * Consolidar usuário para usar a conta oficial
 * Se o usuário fizer login com um e-mail alternativo, redireciona para a conta oficial
 */
export async function consolidateToOfficialAccount(email: string | null | undefined, currentOpenId: string): Promise<string> {
  if (!email || email === OFFICIAL_EMAIL) return currentOpenId;
  
  const officialOpenId = await getOfficialOpenId(email, currentOpenId);
  
  if (officialOpenId !== currentOpenId) {
    console.log(`[Account Consolidation] User logged in with ${email}, using official account`);
    return officialOpenId;
  }
  
  return currentOpenId;
}


// ─── User Shares (Compartilhamento de Pacientes Entre Usuários) ─────────────
/**
 * Compartilhar um paciente com outro usuário
 */
export async function sharePatient(
  fromUserId: number,
  toUserId: number,
  patientId: number,
  permission: "view" | "edit" | "admin" = "view"
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Não permitir compartilhar com a mesma pessoa
  if (fromUserId === toUserId) {
    throw new Error("You cannot share a patient with yourself");
  }

  // Verificar se o paciente pertence ao usuário que está compartilhando
  const patient = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.userId, fromUserId)))
    .limit(1);

  if (!patient || patient.length === 0) {
    throw new Error("Patient not found or you don't have permission to share it");
  }

  // Verificar se o compartilhamento já existe
  const existing = await db
    .select()
    .from(userShares)
    .where(
      and(
        eq(userShares.fromUserId, fromUserId),
        eq(userShares.toUserId, toUserId),
        eq(userShares.patientId, patientId)
      )
    )
    .limit(1);

  if (existing && existing.length > 0) {
    // Atualizar permissão se já existe
    await db
      .update(userShares)
      .set({ permission, updatedAt: new Date() })
      .where(eq(userShares.id, existing[0].id));
    return existing[0].id;
  }

  // Criar novo compartilhamento
  const result = await db.insert(userShares).values({
    fromUserId,
    toUserId,
    patientId,
    permission,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (result[0] as { insertId: number }).insertId;
}

/**
 * Remover compartilhamento de um paciente
 */
export async function unsharePatient(
  fromUserId: number,
  toUserId: number,
  patientId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Verificar se o paciente pertence ao usuario
  const patient = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.userId, fromUserId)))
    .limit(1);

  if (!patient || patient.length === 0) {
    throw new Error("Patient not found or you don't have permission");
  }

  const result = await db
    .delete(userShares)
    .where(
      and(
        eq(userShares.fromUserId, fromUserId),
        eq(userShares.toUserId, toUserId),
        eq(userShares.patientId, patientId)
      )
    );

  return (result[0] as { affectedRows: number }).affectedRows > 0;
}

/**
 * Listar usuários com quem um paciente foi compartilhado
 */
export async function getSharedWith(patientId: number, fromUserId: number): Promise<UserShare[]> {
  const db = await getDb();
  if (!db) return [];

  // Verificar se o paciente pertence ao usuário
  const patient = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.userId, fromUserId)))
    .limit(1);

  if (!patient || patient.length === 0) {
    return [];
  }

  return db
    .select()
    .from(userShares)
    .where(and(eq(userShares.fromUserId, fromUserId), eq(userShares.patientId, patientId)))
    .orderBy(userShares.createdAt);
}

/**
 * Listar pacientes compartilhados COM o usuário (que ele recebeu acesso)
 */
export async function getSharedPatients(userId: number, search?: string, status?: string): Promise<Patient[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(userShares.toUserId, userId)];

  const shares = await db
    .select({ patientId: userShares.patientId })
    .from(userShares)
    .where(and(...conditions));

  if (shares.length === 0) return [];

  const patientIds = shares.map((s) => s.patientId);

  const patientConditions = [inArray(patients.id, patientIds)];
  if (status && status !== "all") {
    patientConditions.push(eq(patients.status, status as Patient["status"]));
  }
  if (search) {
    patientConditions.push(
      or(
        like(patients.name, `%${search}%`),
        like(patients.email, `%${search}%`),
        like(patients.phone, `%${search}%`),
        like(patients.cpf, `%${search}%`)
      )!
    );
  }

  return db
    .select()
    .from(patients)
    .where(and(...patientConditions))
    .orderBy(patients.name);
}

/**
 * Obter permissão de um usuário para um paciente compartilhado
 */
export async function getSharePermission(
  userId: number,
  patientId: number
): Promise<"view" | "edit" | "admin" | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ permission: userShares.permission })
    .from(userShares)
    .where(and(eq(userShares.toUserId, userId), eq(userShares.patientId, patientId)))
    .limit(1);

  return result[0]?.permission ?? null;
}

/**
 * Verificar se um usuário tem acesso a um paciente (próprio ou compartilhado)
 */
export async function canAccessPatient(userId: number, patientId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Verificar se é o proprietário
  const owned = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, patientId), eq(patients.userId, userId)))
    .limit(1);

  if (owned && owned.length > 0) return true;

  // Verificar se foi compartilhado
  const shared = await db
    .select()
    .from(userShares)
    .where(and(eq(userShares.toUserId, userId), eq(userShares.patientId, patientId)))
    .limit(1);

  return shared && shared.length > 0;
}
