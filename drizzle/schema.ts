import {
  bigint,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users (Psicólogos / Admins) ───────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

// ─── Patients (Pacientes) ───────────────────────────────────────────────────
export const patients = mysqlTable("patients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id (psicólogo responsável)
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  birthDate: varchar("birthDate", { length: 10 }),
  cpf: varchar("cpf", { length: 14 }),
  address: text("address"),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 30 }),
  occupation: varchar("occupation", { length: 255 }),
  referredBy: varchar("referredBy", { length: 255 }),
  mainComplaint: text("mainComplaint"),
  medicalHistory: text("medicalHistory"),
  medications: text("medications"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "discharged"]).default("active").notNull(),
  sessionValue: decimal("sessionValue", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

// ─── Sessions (Sessões / Agendamentos) ─────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  patientId: int("patientId").notNull(), // FK → patients.id
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(), // UTC ms
  durationMinutes: int("durationMinutes").default(50).notNull(),
  status: mysqlEnum("status", ["scheduled", "confirmed", "completed", "cancelled", "no_show"])
    .default("scheduled")
    .notNull(),
  sessionType: mysqlEnum("sessionType", ["individual", "couple", "group", "evaluation"])
    .default("individual")
    .notNull(),
  modality: mysqlEnum("modality", ["in_person", "online"]).default("in_person").notNull(),
  sessionValue: decimal("sessionValue", { precision: 10, scale: 2 }),
  isPaid: mysqlEnum("isPaid", ["pending", "paid", "waived"]).default("pending").notNull(),
  cancelReason: text("cancelReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ─── Clinical Notes (Prontuários / Anotações Clínicas) ─────────────────────
export const clinicalNotes = mysqlTable("clinical_notes", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(), // FK → sessions.id
  patientId: int("patientId").notNull(), // FK → patients.id
  userId: int("userId").notNull(), // FK → users.id
  content: text("content").notNull(), // Rich text HTML
  aiSuggestions: text("aiSuggestions"), // Sugestões geradas pela IA
  aiSummary: text("aiSummary"), // Resumo gerado pela IA
  mood: mysqlEnum("mood", ["very_bad", "bad", "neutral", "good", "very_good"]),
  progressRating: int("progressRating"), // 1-10
  goals: text("goals"),
  interventions: text("interventions"),
  homework: text("homework"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = typeof clinicalNotes.$inferInsert;

// ─── Transactions (Transações Financeiras) ─────────────────────────────────
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  patientId: int("patientId"), // FK → patients.id (optional for expenses)
  sessionId: int("sessionId"), // FK → sessions.id (opcional)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["income", "expense", "refund"]).default("income").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pix", "credit_card", "debit_card", "bank_transfer", "health_insurance", "other"]),
  category: varchar("category", { length: 64 }).default("other").notNull(),
  description: text("description"),
  transactionDate: bigint("transactionDate", { mode: "number" }), // UTC ms
  dueDate: bigint("dueDate", { mode: "number" }), // UTC ms
  paidAt: bigint("paidAt", { mode: "number" }), // UTC ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ─── Patient Documents (Documentos / Laudos / PDFs) ────────────────────────
export const patientDocuments = mysqlTable("patient_documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  patientId: int("patientId").notNull(), // FK → patients.id
  sessionId: int("sessionId"), // FK → sessions.id (opcional)
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // URL de acesso
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize"), // bytes
  category: mysqlEnum("category", ["report", "exam", "prescription", "referral", "consent", "other"])
    .default("other")
    .notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PatientDocument = typeof patientDocuments.$inferSelect;
export type InsertPatientDocument = typeof patientDocuments.$inferInsert;

// ─── Settings (Configurações do Sistema) ────────────────────────────────────
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  clinicName: varchar("clinicName", { length: 255 }).notNull(),
  clinicEmail: varchar("clinicEmail", { length: 320 }),
  clinicPhone: varchar("clinicPhone", { length: 20 }),
  clinicAddress: text("clinicAddress"),
  clinicCity: varchar("clinicCity", { length: 100 }),
  clinicState: varchar("clinicState", { length: 2 }),
  clinicZipCode: varchar("clinicZipCode", { length: 10 }),
  ownerName: varchar("ownerName", { length: 255 }),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  ownerPhone: varchar("ownerPhone", { length: 20 }),
  ownerCPF: varchar("ownerCPF", { length: 14 }),
  ownerCRPNumber: varchar("ownerCRPNumber", { length: 20 }),
  sessionDefaultDuration: int("sessionDefaultDuration").default(60).notNull(),
  sessionDefaultPrice: decimal("sessionDefaultPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("America/Sao_Paulo").notNull(),
  language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

// ─── API Tokens (Autenticação Server-to-Server) ──────────────────────────────
export const apiTokens = mysqlTable("api_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  lastUsedAt: timestamp("lastUsedAt"),
});

export type ApiToken = typeof apiTokens.$inferSelect;
export type InsertApiToken = typeof apiTokens.$inferInsert;

// ─── Webhook Logs (Registro de Sincronizações) ──────────────────────────────
export const webhookLogs = mysqlTable("webhook_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  webhookType: varchar("webhookType", { length: 50 }).notNull(), // 'patient', 'appointment', 'payment'
  externalId: varchar("externalId", { length: 255 }).notNull(), // customer_id ou transaction_id
  status: varchar("status", { length: 50 }).notNull(), // 'success', 'failed', 'pending'
  payload: text("payload").notNull(), // JSON do payload recebido
  errorMessage: text("errorMessage"),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = typeof webhookLogs.$inferInsert;
