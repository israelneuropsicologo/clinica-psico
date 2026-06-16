import {
  bigint,
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Clinics (Clínicas) ────────────────────────────────────────────────────
export const clinics = mysqlTable("clinics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId").notNull(), // FK → users.id (psicólogo proprietário)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = typeof clinics.$inferInsert;

// ─── Users (Psicólogos / Admins) ───────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  clinicId: int("clinicId"), // FK → clinics.id (clínica do usuário)
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
  externalCustomerId: varchar("externalCustomerId", { length: 255 }).unique(), // ID do cliente no site mãe
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  birthDate: varchar("birthDate", { length: 10 }),
  cpf: varchar("cpf", { length: 500 }), // Aumentado para armazenar CPF criptografado
  // Endereço detalhado
  address: text("address"),
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressComplement: varchar("addressComplement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  // Contato adicional
  phone2: varchar("phone2", { length: 30 }),
  emergencyContact: varchar("emergencyContact", { length: 255 }),
  emergencyPhone: varchar("emergencyPhone", { length: 30 }),
  // Convênio
  insuranceName: varchar("insuranceName", { length: 255 }),
  insuranceNumber: varchar("insuranceNumber", { length: 100 }),
  insurancePlan: varchar("insurancePlan", { length: 100 }),
  insuranceExpiry: varchar("insuranceExpiry", { length: 10 }),
  // Dados pessoais
  gender: mysqlEnum("gender", ["male", "female", "other", "prefer_not_to_say"]),
  maritalStatus: mysqlEnum("maritalStatus", ["single", "married", "divorced", "widowed", "stable_union", "other"]),
  schooling: mysqlEnum("schooling", ["no_schooling", "elementary", "middle", "high_school", "college", "postgrad"]),
  religion: varchar("religion", { length: 100 }),
  occupation: varchar("occupation", { length: 255 }),
  referredBy: varchar("referredBy", { length: 255 }),
  mainComplaint: text("mainComplaint"),
  medicalHistory: text("medicalHistory"),
  medications: text("medications"),
  notes: text("notes"),
  status: mysqlEnum("status", ["active", "inactive", "discharged", "archived"]).default("active").notNull(),
  leadSource: mysqlEnum("leadSource", ["chatbot", "direct_booking", "manual", "import", "website"]).default("manual").notNull(),
  leadStatus: mysqlEnum("leadStatus", ["lead", "prospect", "customer", "inactive"]).default("lead").notNull(),
  interactionCount: int("interactionCount").default(0).notNull(),
  lastInteractionAt: timestamp("lastInteractionAt"),
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
  externalBookingId: varchar("externalBookingId", { length: 255 }), // ID único do agendamento do site
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
  rejectionReason: text("rejectionReason"), // ✅ Motivo da recusa do agendamento direto (adicionado em migration)
  rejectionDate: timestamp("rejectionDate"), // ✅ Data da recusa (adicionado em migration)
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
  content: text("content").notNull(), // Rich text HTML (legacy)
  aiSuggestions: text("aiSuggestions"),
  aiSummary: text("aiSummary"),
  // Sub-aba: Sessão
  sessionNumber: int("sessionNumber"),
  sessionType2: mysqlEnum("sessionType2", ["individual", "couple", "group", "evaluation"]).default("individual"),
  modality2: mysqlEnum("modality2", ["in_person", "online"]).default("in_person"),
  sessionLocation: varchar("sessionLocation", { length: 255 }),
  // Sub-aba: Avaliação
  emotionalState: text("emotionalState"),
  predominantMood: text("predominantMood"),
  sufferingLevel: int("sufferingLevel"), // 0-10
  currentMedications: text("currentMedications"),
  generalPresentation: text("generalPresentation"),
  mainDemand: text("mainDemand"),
  topicsAddressed: text("topicsAddressed"),
  relevantNarrative: text("relevantNarrative"),
  clinicalAssessment: text("clinicalAssessment"),
  technicalAnalysis: text("technicalAnalysis"),
  // Sub-aba: Intervenções
  techniquesUsed: text("techniquesUsed"),
  plannedInterventions: text("plannedInterventions"),
  homework: text("homework"),
  therapeuticPlan: text("therapeuticPlan"),
  // Sub-aba: Evolução
  treatmentResponse: text("treatmentResponse"),
  goalsProgress: text("goalsProgress"),
  observedInsights: text("observedInsights"),
  observedResistances: text("observedResistances"),
  // Sub-aba: Próxima
  nextSessionDate: varchar("nextSessionDate", { length: 10 }),
  nextSessionGoals: text("nextSessionGoals"),
  treatmentPlanAdjustments: text("treatmentPlanAdjustments"),
  // Sub-aba: Riscos
  selfHarmRisk: mysqlEnum("selfHarmRisk", ["absent", "low", "moderate", "high", "extreme"]).default("absent"),
  thirdPartyRisk: mysqlEnum("thirdPartyRisk", ["absent", "low", "moderate", "high", "extreme"]).default("absent"),
  suicideRisk: mysqlEnum("suicideRisk", ["absent", "low", "moderate", "high", "extreme"]).default("absent"),
  // Sub-aba: Privado (não incluído em relatórios)
  countertransference: text("countertransference"),
  clinicalHypotheses: text("clinicalHypotheses"),
  supervisionNotes: text("supervisionNotes"),
  referrals: text("referrals"),
  privateObservations: text("privateObservations"),
  // Sub-aba: Análise IA
  aiTechnicalFeedback: text("aiTechnicalFeedback"),
  aiTechnicalFeedbackAt: bigint("aiTechnicalFeedbackAt", { mode: "number" }),
  // Legacy fields
  mood: mysqlEnum("mood", ["very_bad", "bad", "neutral", "good", "very_good"]),
  progressRating: int("progressRating"), // 1-10
  goals: text("goals"),
  interventions: text("interventions"),
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
  ownerSpecialty: varchar("ownerSpecialty", { length: 255 }),
  ownerBio: text("ownerBio"),
  ownerWhatsapp: varchar("ownerWhatsapp", { length: 20 }),
  ownerInstagram: varchar("ownerInstagram", { length: 100 }),
  ownerLinkedin: varchar("ownerLinkedin", { length: 255 }),
  ownerWebsite: varchar("ownerWebsite", { length: 255 }),
  systemTitle: varchar("systemTitle", { length: 100 }),
  systemSubtitle: varchar("systemSubtitle", { length: 255 }),
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

// ─── LGPD Audit Logs (Registro de Auditoria) ────────────────────────────────
export const lgpdAuditLogs = mysqlTable("lgpd_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  eventType: varchar("eventType", { length: 50 }).notNull(), // PATIENT_CREATED, PATIENT_DELETED, etc
  resourceType: varchar("resourceType", { length: 50 }).notNull(), // patient, transaction, document, etc
  resourceId: varchar("resourceId", { length: 255 }).notNull(), // ID do recurso afetado
  action: varchar("action", { length: 20 }).notNull(), // CREATE, READ, UPDATE, DELETE, EXPORT
  dataClassification: varchar("dataClassification", { length: 50 }).notNull(), // PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
  description: text("description").notNull(),
  details: text("details"), // JSON com detalhes adicionais
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 ou IPv6
  userAgent: text("userAgent"),
  status: varchar("status", { length: 20 }).notNull(), // SUCCESS, FAILED
  errorMessage: text("errorMessage"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LGPDAuditLog = typeof lgpdAuditLogs.$inferSelect;
export type InsertLGPDAuditLog = typeof lgpdAuditLogs.$inferInsert;

// ─── ChatBot Interactions (Interações do ChatBot) ──────────────────────────────
export const chatbotInteractions = mysqlTable("chatbot_interactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id (psicólogo responsável)
  customerId: varchar("customerId", { length: 255 }).notNull(), // ID do cliente no site mãe
  patientId: int("patientId"), // FK → patients.id (pode ser null se lead ainda não foi criado)
  message: text("message").notNull(), // Mensagem do usuário
  response: text("response"), // Resposta do ChatBot
  sentiment: varchar("sentiment", { length: 20 }), // positive, neutral, negative
  topic: varchar("topic", { length: 100 }), // Tópico da conversa (agendamento, dúvida, etc)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatbotInteraction = typeof chatbotInteractions.$inferSelect;
export type InsertChatbotInteraction = typeof chatbotInteractions.$inferInsert;

// ─── Conversion Funnel (Funil de Conversão) ────────────────────────────────────
export const conversionFunnel = mysqlTable("conversion_funnel", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  patientId: int("patientId").notNull(), // FK → patients.id
  stage: mysqlEnum("stage", ["lead", "prospect", "customer", "inactive"]).notNull(),
  previousStage: varchar("previousStage", { length: 50 }),
  source: varchar("source", { length: 50 }).notNull(), // chatbot, direct_booking, manual
  conversionTime: int("conversionTime"), // Tempo em ms desde o primeiro contato até esta etapa
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConversionFunnel = typeof conversionFunnel.$inferSelect;
export type InsertConversionFunnel = typeof conversionFunnel.$inferInsert;

// ─── User Links (Sincronização de Usuários) ───────────────────────────────────
export const userLinks = mysqlTable("user_links", {
  id: int("id").autoincrement().primaryKey(),
  primaryUserId: int("primaryUserId").notNull(), // FK → users.id (usuário principal)
  linkedUserId: int("linkedUserId").notNull(), // FK → users.id (usuário vinculado)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserLink = typeof userLinks.$inferSelect;
export type InsertUserLink = typeof userLinks.$inferInsert;

// ─── Expandir Transactions com campos financeiros detalhados ──────────────────
// Nota: A tabela transactions já existe, mas vamos adicionar campos via migration
// paymentMethod: enum (credit_card, debit_card, pix, bank_transfer, cash, other)
// paymentDate: timestamp (data do pagamento efetivo)
// dueDate: timestamp (data de vencimento)
// status: enum (pending, paid, overdue, cancelled, refunded)

// ─── Anamnese (Ficha de Anamnese do Paciente) ────────────────────────────────
export const anamnese = mysqlTable("anamnese", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId").notNull().unique(),
  // Dados de saúde
  bloodType: varchar("bloodType", { length: 10 }),
  allergies: text("allergies"),
  chronicConditions: text("chronicConditions"),
  disabilities: text("disabilities"),
  // Anamnese clínica completa
  mainComplaintDetail: text("mainComplaintDetail"),
  currentDiseaseHistory: text("currentDiseaseHistory"), // HDA
  psychiatricHistory: text("psychiatricHistory"), // internações, crises, tentativas
  familyHistory: text("familyHistory"),
  personalHistory: text("personalHistory"),
  childhoodHistory: text("childhoodHistory"),
  relationshipHistory: text("relationshipHistory"),
  professionalHistory: text("professionalHistory"),
  substanceUse: text("substanceUse"), // álcool, drogas, tabaco
  sleepAndEating: text("sleepAndEating"),
  sexualAffectiveLife: text("sexualAffectiveLife"),
  previousTreatments: text("previousTreatments"),
  therapeuticGoals: text("therapeuticGoals"),
  cidCode: varchar("cidCode", { length: 255 }),
  cidDescription: varchar("cidDescription", { length: 255 }),
  therapeuticApproach: varchar("therapeuticApproach", { length: 100 }),
  riskFactors: text("riskFactors"),
  protectiveFactors: text("protectiveFactors"),
  additionalNotes: text("additionalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anamnese = typeof anamnese.$inferSelect;
export type InsertAnamnese = typeof anamnese.$inferInsert;

// ─── Session Recordings (Gravações de Sessões) ────────────────────────────────
export const sessionRecordings = mysqlTable("session_recordings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId").notNull(),
  sessionId: int("sessionId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  fileSize: int("fileSize"),
  durationSeconds: int("durationSeconds"),
  transcription: text("transcription"),
  transcriptionStatus: mysqlEnum("transcriptionStatus", ["pending", "processing", "done", "error"]).default("pending").notNull(),
  supervision: text("supervision"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionRecording = typeof sessionRecordings.$inferSelect;
export type InsertSessionRecording = typeof sessionRecordings.$inferInsert;

// ─── Timeline Analyses (Análises IA da Linha do Tempo) ────────────────────────
export const timelineAnalyses = mysqlTable("timeline_analyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  patientId: int("patientId").notNull(),
  analysisType: mysqlEnum("analysisType", ["global", "last_session", "next_session"]).notNull(),
  content: text("content").notNull(), // JSON stringified
  sessionCount: int("sessionCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimelineAnalysis = typeof timelineAnalyses.$inferSelect;
export type InsertTimelineAnalysis = typeof timelineAnalyses.$inferInsert;

// ─── Patient Invitations (Convites para Preenchimento de Cadastro) ─────────────
export const patientInvitations = mysqlTable("patient_invitations", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(), // FK → patients.id
  userId: int("userId").notNull(), // FK → users.id (psicólogo que criou)
  token: varchar("token", { length: 255 }).notNull().unique(), // Token seguro único
  expiresAt: timestamp("expiresAt").notNull(), // Quando o link expira
  completedAt: timestamp("completedAt"), // Quando o paciente completou
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PatientInvitation = typeof patientInvitations.$inferSelect;
export type InsertPatientInvitation = typeof patientInvitations.$inferInsert;

// ─── User Shares (Compartilhamento de Pacientes) ────────────────────────────
export const userShares = mysqlTable("user_shares", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(), // FK → users.id (psicólogo que compartilha)
  toUserId: int("toUserId").notNull(), // FK → users.id (psicólogo que recebe acesso)
  patientId: int("patientId").notNull(), // FK → patients.id
  permission: mysqlEnum("permission", ["view", "edit", "admin"]).default("view").notNull(), // Tipo de permissão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserShare = typeof userShares.$inferSelect;
export type InsertUserShare = typeof userShares.$inferInsert;

// ─── Email Aliases (Vinculação de Múltiplos Emails) ────────────────────────────
export const emailAliases = mysqlTable("email_aliases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id (usuário principal)
  email: varchar("email", { length: 320 }).notNull().unique(), // Email alias
  isPrimary: boolean("isPrimary").default(false).notNull(), // Se é o email principal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailAlias = typeof emailAliases.$inferSelect;
export type InsertEmailAlias = typeof emailAliases.$inferInsert;

// ─── Internal Users (Usuários Internos com Login/Senha) ────────────────────────────
export const internalUsers = mysqlTable("internal_users", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(), // FK → clinics.id
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  roleId: int("roleId").notNull(), // FK → roles.id
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InternalUser = typeof internalUsers.$inferSelect;
export type InsertInternalUser = typeof internalUsers.$inferInsert;

// ─── Roles (Papéis/Funções) ────────────────────────────────────────────────────
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(), // FK → clinics.id
  name: varchar("name", { length: 100 }).notNull(), // Secretária, Financeiro, etc
  description: text("description"),
  isSystem: boolean("isSystem").default(false).notNull(), // Se é pré-definida pelo sistema
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

// ─── Permissions (Permissões) ────────────────────────────────────────────────────
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(), // patients.view, patients.edit, etc
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // patients, sessions, financial, etc
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// ─── Role Permissions (Vinculação entre Roles e Permissions) ────────────────────────────────
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(), // FK → roles.id
  permissionId: int("permissionId").notNull(), // FK → permissions.id
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

// ─── Deletion Requests (Requisições de Exclusão com Aprovação) ────────────────────────────────
export const deletionRequests = mysqlTable("deletion_requests", {
  id: int("id").autoincrement().primaryKey(),
  clinicId: int("clinicId").notNull(), // FK → clinics.id
  requestedBy: int("requestedBy").notNull(), // FK → internalUsers.id
  entityType: varchar("entityType", { length: 50 }).notNull(), // patients, sessions, transactions, etc
  entityId: int("entityId").notNull(),
  entityName: varchar("entityName", { length: 255 }), // Nome/descrição do item a ser deletado
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"), // FK → users.id (admin que aprovou)
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeletionRequest = typeof deletionRequests.$inferSelect;
export type InsertDeletionRequest = typeof deletionRequests.$inferInsert;

// ─── Session with Patient (for API responses) ──────────────────────────────
export type SessionWithPatient = Session & { patient?: Patient };

// ─── Audit Logs (Auditoria de Atividades) ──────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → internalUsers.id (usuário que fez a ação)
  action: varchar("action", { length: 50 }).notNull(), // login, logout, create, update, delete, etc
  entityType: varchar("entityType", { length: 50 }), // patients, sessions, users, etc
  entityId: int("entityId"), // ID do objeto afetado
  entityName: varchar("entityName", { length: 255 }), // Nome do objeto (ex: nome do paciente)
  description: text("description"), // Descrição detalhada da ação
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 ou IPv6
  userAgent: text("userAgent"), // Browser/device info
  status: mysqlEnum("status", ["success", "failure"]).default("success").notNull(),
  errorMessage: text("errorMessage"), // Se falhou, qual foi o erro
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Sync Logs (Logs de Sincronização E-SAÚDE) ──────────────────────────────
export const syncLogs = mysqlTable("sync_logs", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(), // FK → appointments.id
  direction: mysqlEnum("direction", ["site_to_esaude", "esaude_to_site"]).notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed", "retry"]).default("pending").notNull(),
  errorMessage: varchar("errorMessage", { length: 500 }),
  esaudeId: varchar("esaudeId", { length: 255 }), // ID do agendamento em E-SAÚDE
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SyncLog = typeof syncLogs.$inferSelect;
export type InsertSyncLog = typeof syncLogs.$inferInsert;

// ─── Agent Communications (Comunicação entre Agentes) ──────────────────────────
export const agentCommunications = mysqlTable("agent_communications", {
  id: int("id").autoincrement().primaryKey(),
  fromAgent: varchar("fromAgent", { length: 100 }).notNull(), // site-psicolog ou esaude-clinica
  toAgent: varchar("toAgent", { length: 100 }).notNull(),
  messageType: mysqlEnum("messageType", [
    "handshake",
    "health_check",
    "error_detected",
    "consistency_check",
    "daily_report_request",
    "sync_status",
    "auto_fix"
  ]).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "received", "processed", "failed"]).default("pending").notNull(),
  payload: text("payload").notNull(), // JSON com dados da mensagem
  response: text("response"), // JSON com resposta
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = typeof agentCommunications.$inferInsert;

// ─── Agent Analysis (Análise de Módulos e Otimizações) ──────────────────────────
export const agentAnalysis = mysqlTable("agent_analysis", {
  id: int("id").autoincrement().primaryKey(),
  analysisType: mysqlEnum("analysisType", [
    "module_health",
    "performance_bottleneck",
    "data_inconsistency",
    "error_pattern",
    "optimization_opportunity",
    "security_issue"
  ]).notNull(),
  module: varchar("module", { length: 100 }).notNull(), // patients, sessions, calendar, email, etc
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description").notNull(),
  findings: text("findings").notNull(), // JSON com detalhes da análise
  recommendations: text("recommendations").notNull(), // JSON com recomendações
  autoFixApplied: boolean("autoFixApplied").default(false).notNull(),
  fixResult: text("fixResult"), // JSON com resultado da correção
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "wont_fix"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentAnalysis = typeof agentAnalysis.$inferSelect;
export type InsertAgentAnalysis = typeof agentAnalysis.$inferInsert;

// ─── Agent Tokens (Tokens de Autenticação entre Agentes) ──────────────────────────
export const agentTokens = mysqlTable("agent_tokens", {
  id: int("id").autoincrement().primaryKey(),
  agentName: varchar("agentName", { length: 100 }).notNull(), // site-psicolog ou esaude-clinica
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentToken = typeof agentTokens.$inferSelect;
export type InsertAgentToken = typeof agentTokens.$inferInsert;

// ─── Agent Health Metrics (Métricas de Saúde dos Agentes) ──────────────────────────
export const agentHealthMetrics = mysqlTable("agent_health_metrics", {
  id: int("id").autoincrement().primaryKey(),
  agentName: varchar("agentName", { length: 100 }).notNull(),
  healthScore: decimal("healthScore", { precision: 5, scale: 2 }).notNull(), // 0-100
  uptime: int("uptime").notNull(), // em segundos
  lastHealthCheck: timestamp("lastHealthCheck").notNull(),
  totalAppointments: int("totalAppointments").default(0).notNull(),
  syncedAppointments: int("syncedAppointments").default(0).notNull(),
  failedAppointments: int("failedAppointments").default(0).notNull(),
  averageSyncTimeMs: int("averageSyncTimeMs").default(0).notNull(),
  databaseHealth: mysqlEnum("databaseHealth", ["healthy", "degraded", "unhealthy"]).default("healthy").notNull(),
  apiLatencyMs: int("apiLatencyMs").default(0).notNull(),
  pendingRetries: int("pendingRetries").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentHealthMetric = typeof agentHealthMetrics.$inferSelect;
export type InsertAgentHealthMetric = typeof agentHealthMetrics.$inferInsert;

// ─── Daily Reports (Relatórios Diários de Saúde) ──────────────────────────
export const dailyReports = mysqlTable("daily_reports", {
  id: int("id").autoincrement().primaryKey(),
  reportDate: date("reportDate").notNull(),
  agentName: varchar("agentName", { length: 100 }).notNull(),
  summary: text("summary").notNull(), // JSON com resumo do dia
  performance: text("performance").notNull(), // JSON com métricas de performance
  errors: text("errors"), // JSON com erros encontrados
  recommendations: text("recommendations").notNull(), // JSON com recomendações
  autoActionsApplied: text("autoActionsApplied"), // JSON com ações automáticas executadas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;


// ─── Virtual Credits (Créditos Virtuais Infinitos) ──────────────────────────
export const virtualCredits = mysqlTable("virtual_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  balance: decimal("balance", { precision: 20, scale: 2 }).default("1000").notNull(), // Saldo de créditos virtuais
  totalEarned: decimal("totalEarned", { precision: 20, scale: 2 }).default("1000").notNull(), // Total ganho
  totalSpent: decimal("totalSpent", { precision: 20, scale: 2 }).default("0").notNull(), // Total gasto
  regenerationRate: decimal("regenerationRate", { precision: 10, scale: 2 }).default("100").notNull(), // Créditos por ciclo
  regenerationInterval: int("regenerationInterval").default(300).notNull(), // Intervalo em segundos (5 min = 300s)
  lastRegeneration: timestamp("lastRegeneration").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VirtualCredit = typeof virtualCredits.$inferSelect;
export type InsertVirtualCredit = typeof virtualCredits.$inferInsert;

// ─── Virtual Credit Transactions (Transações de Créditos Virtuais) ─────────
export const virtualCreditTransactions = mysqlTable("virtual_credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK → users.id
  transactionType: mysqlEnum("transactionType", [
    "regeneration", // Regeneração automática
    "email_send", // Envio de email
    "api_call", // Chamada de API
    "agent_communication", // Comunicação entre agentes (grátis)
    "report_generation", // Geração de relatório
    "data_sync", // Sincronização de dados
    "bonus", // Bônus
    "manual_adjustment", // Ajuste manual
  ]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  balanceBefore: decimal("balanceBefore", { precision: 20, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 20, scale: 2 }).notNull(),
  metadata: text("metadata"), // JSON com dados adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VirtualCreditTransaction = typeof virtualCreditTransactions.$inferSelect;
export type InsertVirtualCreditTransaction = typeof virtualCreditTransactions.$inferInsert;

// ─── Agent Credit Pool (Pool de Créditos para Agentes) ──────────────────────
export const agentCreditPool = mysqlTable("agent_credit_pool", {
  id: int("id").autoincrement().primaryKey(),
  agentName: varchar("agentName", { length: 100 }).notNull(), // site-psicolog ou esaude-clinica
  balance: decimal("balance", { precision: 20, scale: 2 }).default("10000").notNull(), // Saldo compartilhado do agente
  totalEarned: decimal("totalEarned", { precision: 20, scale: 2 }).default("10000").notNull(),
  totalSpent: decimal("totalSpent", { precision: 20, scale: 2 }).default("0").notNull(),
  regenerationRate: decimal("regenerationRate", { precision: 10, scale: 2 }).default("500").notNull(), // Créditos por ciclo
  lastRegeneration: timestamp("lastRegeneration").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AgentCreditPool = typeof agentCreditPool.$inferSelect;
export type InsertAgentCreditPool = typeof agentCreditPool.$inferInsert;

// ─── Agent Credit Transactions (Transações do Pool de Agentes) ──────────────
export const agentCreditTransactions = mysqlTable("agent_credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  agentName: varchar("agentName", { length: 100 }).notNull(), // site-psicolog ou esaude-clinica
  transactionType: mysqlEnum("transactionType", [
    "regeneration", // Regeneração automática
    "communication_sent", // Comunicação enviada (grátis)
    "communication_received", // Comunicação recebida (grátis)
    "analysis_performed", // Análise realizada
    "auto_fix_applied", // Auto-fix aplicado
    "report_generated", // Relatório gerado
    "bonus", // Bônus
  ]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  balanceBefore: decimal("balanceBefore", { precision: 20, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 20, scale: 2 }).notNull(),
  relatedAgent: varchar("relatedAgent", { length: 100 }), // Agente relacionado (para comunicação)
  metadata: text("metadata"), // JSON com dados adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AgentCreditTransaction = typeof agentCreditTransactions.$inferSelect;
export type InsertAgentCreditTransaction = typeof agentCreditTransactions.$inferInsert;

// ─── Analysis History (Histórico de Análises de IA) ───────────────────────────
export const analysisHistory = mysqlTable("analysis_history", {
  id: int("id").autoincrement().primaryKey(),
  patientId: int("patientId").notNull(),
  userId: int("userId").notNull(),
  analysisType: mysqlEnum("analysisType", ["global", "session", "evolution"]).default("global").notNull(),
  content: text("content").notNull(), // JSON stringified
  summary: varchar("summary", { length: 500 }), // Resumo curto
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = typeof analysisHistory.$inferInsert;
