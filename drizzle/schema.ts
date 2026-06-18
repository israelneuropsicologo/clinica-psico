import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, decimal } from 'drizzle-orm/mysql-core';

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Anamnese v1 Table ───────────────────────────────────────────────────────
export const anamneseV1 = mysqlTable("anamneseV1", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull(),
  
  // Queixa e Objetivos Terapêuticos
  mainComplaintDetail: text("mainComplaintDetail"),
  therapeuticGoals: text("therapeuticGoals"),
  cidCode: varchar("cidCode", { length: 20 }),
  cidDescription: text("cidDescription"),
  therapeuticApproach: text("therapeuticApproach"),
  
  // Histórico Clínico
  currentDiseaseHistory: text("currentDiseaseHistory"),
  personalHistory: text("personalHistory"),
  familyHistory: text("familyHistory"),
  psychiatricHistory: text("psychiatricHistory"),
  previousTreatments: text("previousTreatments"),
  
  // Desenvolvimento e Contexto de Vida
  childhoodHistory: text("childhoodHistory"),
  relationshipHistory: text("relationshipHistory"),
  professionalHistory: text("professionalHistory"),
  
  // Hábitos e Estilo de Vida
  substanceUse: text("substanceUse"),
  sleepAndEating: text("sleepAndEating"),
  sexualAffectiveLife: text("sexualAffectiveLife"),
  
  // Fatores de Risco e Proteção
  riskFactors: text("riskFactors"),
  protectiveFactors: text("protectiveFactors"),
  
  // Observações Adicionais
  additionalNotes: text("additionalNotes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnamneseV1 = typeof anamneseV1.$inferSelect;
export type InsertAnamneseV1 = typeof anamneseV1.$inferInsert;

// Patients Table
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  birthDate: timestamp("birthDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// TODO: Add your tables here

// ─── Analysis History Table ───────────────────────────────────────────────────
export const analysisHistory = mysqlTable("analysisHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  analysisType: varchar("analysisType", { length: 100 }).notNull(),
  findings: text("findings"),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = typeof analysisHistory.$inferInsert;

// ─── Virtual Credits Table ───────────────────────────────────────────────────
export const virtualCredits = mysqlTable("virtualCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: int("balance").default(0).notNull(),
  totalEarned: int("totalEarned").default(0).notNull(),
  totalSpent: int("totalSpent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VirtualCredits = typeof virtualCredits.$inferSelect;
export type InsertVirtualCredits = typeof virtualCredits.$inferInsert;

// ─── Virtual Credit Transactions Table ───────────────────────────────────────
export const virtualCreditTransactions = mysqlTable("virtualCreditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditId: int("creditId").notNull().references(() => virtualCredits.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["earn", "spend"]).notNull(),
  amount: int("amount").notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VirtualCreditTransaction = typeof virtualCreditTransactions.$inferSelect;
export type InsertVirtualCreditTransaction = typeof virtualCreditTransactions.$inferInsert;

// ─── Agent Credit Pool Table ───────────────────────────────────────────────────
export const agentCreditPool = mysqlTable("agentCreditPool", {
  id: int("id").autoincrement().primaryKey(),
  agentId: varchar("agentId", { length: 255 }).notNull().unique(),
  totalCredits: int("totalCredits").default(0).notNull(),
  usedCredits: int("usedCredits").default(0).notNull(),
  availableCredits: int("availableCredits").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentCreditPool = typeof agentCreditPool.$inferSelect;
export type InsertAgentCreditPool = typeof agentCreditPool.$inferInsert;

// ─── Agent Credit Transactions Table ───────────────────────────────────────
export const agentCreditTransactions = mysqlTable("agentCreditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  agentId: varchar("agentId", { length: 255 }).notNull(),
  poolId: int("poolId").notNull().references(() => agentCreditPool.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["allocate", "use", "refund"]).notNull(),
  amount: int("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentCreditTransaction = typeof agentCreditTransactions.$inferSelect;
export type InsertAgentCreditTransaction = typeof agentCreditTransactions.$inferInsert;

// ─── Sessions Table ───────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  sessionDate: timestamp("sessionDate").notNull(),
  duration: int("duration"), // in minutes
  notes: text("notes"),
  isPaid: mysqlEnum("isPaid", ["pending", "paid", "waived"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type SessionWithPatient = Session & { patient?: Patient };

// ─── Clinical Notes Table ───────────────────────────────────────────────────
export const clinicalNotes = mysqlTable("clinicalNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  sessionId: int("sessionId").references(() => sessions.id, { onDelete: "cascade" }),
  noteType: varchar("noteType", { length: 100 }),
  content: text("content"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = typeof clinicalNotes.$inferInsert;

// ─── Documents Table ───────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  documentType: varchar("documentType", { length: 100 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Transactions Table ───────────────────────────────────────────────────
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  patientId: int("patientId").notNull().references(() => patients.id, { onDelete: "cascade" }),
  sessionId: int("sessionId").references(() => sessions.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["payment", "refund", "adjustment"]).default("payment").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Anamnese Table (alias for anamneseV1) ───────────────────────────────────
export const anamnese = anamneseV1;
export type Anamnese = AnamneseV1;
export type InsertAnamnese = InsertAnamneseV1;

// ─── Email Aliases Table ───────────────────────────────────────────────────
export const emailAliases = mysqlTable("emailAliases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  alias: varchar("alias", { length: 255 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAlias = typeof emailAliases.$inferSelect;
export type InsertEmailAlias = typeof emailAliases.$inferInsert;

// ─── Settings Table ───────────────────────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

// ─── Audit Logs Table ───────────────────────────────────────────────────
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  changes: text("changes"), // JSON stringified
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Leads Table ───────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  source: varchar("source", { length: 100 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "lost"]).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Roles Table ───────────────────────────────────────────────────────
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

// ─── Permissions Table ───────────────────────────────────────────────────
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// ─── Role Permissions Table ───────────────────────────────────────────────
export const rolePermissions = mysqlTable("rolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: int("permissionId").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
