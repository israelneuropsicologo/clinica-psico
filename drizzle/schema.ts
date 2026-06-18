import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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