// @ts-nocheck
/**
 * Main tRPC Router
 * 
 * Consolidated router for all API procedures:
 * - Sessions management with proper isPaid enum validation
 * - Patient management and leads tracking
 * - Clinical notes and documents
 * - Financial tracking and reports
 * - Webhook integrations (chatbot, direct bookings, etc)
 * - Management reports and analytics
 * 
 * All procedures use proper type validation with Zod schemas
 * to ensure data integrity and prevent type mismatches.
 * 
 * ✅ Database migration applied: isPaid column is now enum('pending','paid','waived')
 * This ensures webhook compatibility and prevents type mismatches.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, like } from "drizzle-orm";
import { patients } from "../drizzle/schema";
import type { SessionWithPatient } from "../drizzle/schema";
import {
  createClinicalNote,
  createDocument,
  createPatient,
  createSession,
  createTransaction,
  deletDocument,
  deletePatient,
  deleteSession,
  getClinicalNotesByPatient,
  getClinicalNotesBySession,
  getDocumentsByPatient,
  getMonthlyRevenue,
  getOverdueSessions,
  getPatientById,
  getPatientCount,
  getPatients,
  getPatientByIdShared,
  getSessionById,
  getSessions,
  getSessionsThisMonth,
  getTransactions,
  getUpcomingSessions,
  updateClinicalNote,
  updatePatient,
  updateSession,
  updateTransaction,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generatePatientReport, generateFinancialReport, type ReportFilters } from "./_core/reportGenerator";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { getDb } from "./db";
import { reportsRouter } from "./routers/reports";
import { settingsRouter } from "./routers/settings";
import { systemRouter } from "./routers/system";
import { financialRouter } from "./routers/financial";
import { webhooksRouter } from "./routers/webhooks";
import { websiteAppointmentsRouter } from "./routers/website-appointments";
import { anamneseRouter, recordingsRouter, timelineRouter } from "./routers/patientProfile";
import { managementReportsRouter } from "./routers/managementReports";
import { pistasRouter } from "./routers/pistas";
import { aiAnalyticsRouter } from "./routers/aiAnalytics";
import { auditRouter } from "./routers/audit";
import { aiIntegrationRouter } from "./routers/aiIntegration";
import { adminRouter } from "./routers/admin";
import { invitationsRouter } from "./routers/invitations";
import { internalAuthRouter } from "./routers/internalAuth";
import { internalUsersRouter } from "./routers/internalUsers";
import { rolesRouter } from "./routers/roles";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Admin guard ────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

// ─── Patients Router ────────────────────────────────────────────────────────
const patientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(({ ctx, input }) => getPatients(ctx.user.id, input.search, input.status)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const patient = await getPatientByIdShared(input.id, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      return patient;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        cpf: z.string().optional(),
        address: z.string().optional(),
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        occupation: z.string().optional(),
        referredBy: z.string().optional(),
        mainComplaint: z.string().optional(),
        medicalHistory: z.string().optional(),
        medications: z.string().optional(),
        notes: z.string().optional(),
        sessionValue: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Converter sessionValue de string para número
        const sessionValueNum = input.sessionValue ? parseFloat(input.sessionValue) : null;
        
        const id = await createPatient({
          userId: ctx.user.id,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          birthDate: input.birthDate || null,
          cpf: input.cpf || null,
          address: input.address || null,
          emergencyContact: input.emergencyContact || null,
          emergencyPhone: input.emergencyPhone || null,
          occupation: input.occupation || null,
          referredBy: input.referredBy || null,
          mainComplaint: input.mainComplaint || null,
          medicalHistory: input.medicalHistory || null,
          medications: input.medications || null,
          notes: input.notes || null,
          status: "active",
          leadSource: "manual",
          leadStatus: "customer",
          interactionCount: 1,
          lastInteractionAt: new Date(),
          sessionValue: sessionValueNum,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { id };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao cadastrar paciente";
        
        // Mensagens de erro customizadas
        if (message.includes("Duplicate entry") && message.includes("cpf")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CPF já cadastrado no sistema" });
        }
        if (message.includes("Duplicate entry") && message.includes("email")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email já cadastrado no sistema" });
        }
        if (message.includes("Column") && message.includes("cannot be null")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Preencha todos os campos obrigatórios" });
        }
        
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao cadastrar paciente. Verifique os dados e tente novamente." });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        phone2: z.string().optional(),
        birthDate: z.string().optional(),
        cpf: z.string().optional(),
        // Endereço detalhado
        address: z.string().optional(),
        addressNumber: z.string().optional(),
        addressComplement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        // Contato de emergência
        emergencyContact: z.string().optional(),
        emergencyPhone: z.string().optional(),
        // Convênio
        insuranceName: z.string().optional(),
        insuranceNumber: z.string().optional(),
        insurancePlan: z.string().optional(),
        insuranceExpiry: z.string().optional(),
        // Dados pessoais
        gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
        maritalStatus: z.enum(["single", "married", "divorced", "widowed", "stable_union", "other"]).optional(),
        schooling: z.enum(["no_schooling", "elementary", "middle", "high_school", "college", "postgrad"]).optional(),
        religion: z.string().optional(),
        occupation: z.string().optional(),
        referredBy: z.string().optional(),
        mainComplaint: z.string().optional(),
        medicalHistory: z.string().optional(),
        medications: z.string().optional(),
        notes: z.string().optional(),
        sessionValue: z.string().optional(),
        status: z.enum(["active", "inactive", "discharged"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rawData } = input;
      // Filter out undefined and empty string values to avoid DB type errors
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawData)) {
        if (value !== undefined && value !== null && value !== '') {
          data[key] = value;
        }
      }
      // Convert sessionValue string to number if present
      if (typeof data.sessionValue === 'string') {
        const parsed = parseFloat(data.sessionValue);
        data.sessionValue = isNaN(parsed) ? undefined : parsed;
        if (data.sessionValue === undefined) delete data.sessionValue;
      }
      if (Object.keys(data).length > 0) {
        await updatePatient(id, ctx.user.id, data as Parameters<typeof updatePatient>[2]);
      }
      return { success: true };
    }),

   delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePatient(input.id, ctx.user.id);
      return { success: true };
    }),
  deleteMultiple: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      let deletedCount = 0;
      for (const id of input.ids) {
        await deletePatient(id, ctx.user.id);
        deletedCount++;
      }
      return { success: true, deletedCount };
    }),
  deleteTestData: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const testPatterns = [
        'Appointment Test',
        'Duplicate Test',
        'Joao E2E Test',
        'João E2E Test',
        'Pending Payment Test',
        'Test Patient',
        'E2E Test',
      ];
      
      let deletedCount = 0;
      for (const pattern of testPatterns) {
        const testPatients = await db.select().from(patients).where(
          and(
            eq(patients.userId, ctx.user.id),
            like(patients.name, `%${pattern}%`)
          )
        );
        
        for (const patient of testPatients) {
          await deletePatient(patient.id, ctx.user.id);
          deletedCount++;
        }
      }
      
      return { success: true, deletedCount };
    }),
});

// ─── Sessions Router ────────────────────────────────────────────────────────
// Handles all session/appointment management
// Note: isPaid field uses enum validation ("pending" | "paid" | "waived")
// to ensure database type consistency
const sessionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        patientId: z.number().optional(),
        status: z.string().optional(),
        isPaid: z.enum(["pending", "paid", "waived"]).optional(),
        from: z.number().optional(),
        to: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => getSessions(ctx.user.id, input)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const session = await getSessionById(input.id, ctx.user.id);
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  upcoming: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(({ ctx, input }) => getUpcomingSessions(ctx.user.id, input.limit)),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        scheduledAt: z.number(),
        durationMinutes: z.number().default(50),
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled"),
        sessionType: z.enum(["individual", "couple", "group", "evaluation"]).default("individual"),
        modality: z.enum(["in_person", "online"]).default("in_person"),
        sessionValue: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createSession({ ...input, userId: ctx.user.id, sessionValue: input.sessionValue || null });
      // Notificar proprietário
      await notifyOwner({
        title: "Nova sessão agendada",
        content: `Uma nova sessão foi agendada para ${new Date(input.scheduledAt).toLocaleString("pt-BR")}.`,
      }).catch(() => {});
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        scheduledAt: z.number().optional(),
        durationMinutes: z.number().optional(),
        status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
        sessionType: z.enum(["individual", "couple", "group", "evaluation"]).optional(),
        modality: z.enum(["in_person", "online"]).optional(),
        sessionValue: z.string().optional(),
        isPaid: z.enum(["pending", "paid", "waived"]).optional(),
        cancelReason: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateSession(id, ctx.user.id, data);
      // Notificar se cancelada
      if (data.status === "cancelled") {
        await notifyOwner({
          title: "Sessão cancelada",
          content: `Uma sessão foi cancelada. Motivo: ${data.cancelReason || "Não informado"}.`,
        }).catch(() => {});
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSession(input.id, ctx.user.id);
      return { success: true };
    }),
  deleteMultiple: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      let deletedCount = 0;
      for (const id of input.ids) {
        await deleteSession(id, ctx.user.id);
        deletedCount++;
      }
      return { success: true, deletedCount };
    }),
});

// ─── Clinical Notes Router ──────────────────────────────────────────────────
const clinicalNotesRouter = router({
  bySession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(({ ctx, input }) => getClinicalNotesBySession(input.sessionId, ctx.user.id)),

  byPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(({ ctx, input }) => getClinicalNotesByPatient(input.patientId, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        patientId: z.number(),
        content: z.string(),
        mood: z.enum(["very_bad", "bad", "neutral", "good", "very_good"]).optional(),
        progressRating: z.number().min(1).max(10).optional(),
        goals: z.string().optional(),
        interventions: z.string().optional(),
        homework: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createClinicalNote({ ...input, userId: ctx.user.id });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().optional(),
        mood: z.enum(["very_bad", "bad", "neutral", "good", "very_good"]).optional(),
        progressRating: z.number().min(1).max(10).optional(),
        goals: z.string().optional(),
        interventions: z.string().optional(),
        homework: z.string().optional(),
        aiSuggestions: z.string().optional(),
        aiSummary: z.string().optional(),
        // Sub-aba Sessão
        sessionNumber: z.number().optional(),
        sessionType2: z.enum(["individual", "couple", "group", "evaluation"]).optional(),
        modality2: z.enum(["in_person", "online"]).optional(),
        sessionLocation: z.string().optional(),
        // Sub-aba Avaliação
        emotionalState: z.string().optional(),
        predominantMood: z.string().optional(),
        sufferingLevel: z.number().min(0).max(10).optional(),
        currentMedications: z.string().optional(),
        generalPresentation: z.string().optional(),
        mainDemand: z.string().optional(),
        topicsAddressed: z.string().optional(),
        relevantNarrative: z.string().optional(),
        clinicalAssessment: z.string().optional(),
        technicalAnalysis: z.string().optional(),
        // Sub-aba Intervenções
        techniquesUsed: z.string().optional(),
        plannedInterventions: z.string().optional(),
        therapeuticPlan: z.string().optional(),
        // Sub-aba Evolução
        treatmentResponse: z.string().optional(),
        goalsProgress: z.string().optional(),
        observedInsights: z.string().optional(),
        observedResistances: z.string().optional(),
        // Sub-aba Próxima
        nextSessionDate: z.string().optional(),
        nextSessionGoals: z.string().optional(),
        treatmentPlanAdjustments: z.string().optional(),
        // Sub-aba Riscos
        selfHarmRisk: z.enum(["absent", "low", "moderate", "high", "extreme"]).optional(),
        thirdPartyRisk: z.enum(["absent", "low", "moderate", "high", "extreme"]).optional(),
        suicideRisk: z.enum(["absent", "low", "moderate", "high", "extreme"]).optional(),
        // Sub-aba Privado
        countertransference: z.string().optional(),
        clinicalHypotheses: z.string().optional(),
        supervisionNotes: z.string().optional(),
        referrals: z.string().optional(),
        privateObservations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateClinicalNote(id, ctx.user.id, data);
      return { success: true };
    }),

  generateAIFeedback: protectedProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { clinicalNotes: cnTable } = await import("../drizzle/schema");
      const [note] = await db.select().from(cnTable).where(and(eq(cnTable.id, input.noteId), eq(cnTable.userId, ctx.user.id))).limit(1);
      if (!note) throw new TRPCError({ code: "NOT_FOUND" });

      const noteContext = [
        note.emotionalState && `Estado emocional: ${note.emotionalState}`,
        note.predominantMood && `Humor: ${note.predominantMood}`,
        note.sufferingLevel != null && `Nível de sofrimento: ${note.sufferingLevel}/10`,
        note.mainDemand && `Demanda principal: ${note.mainDemand}`,
        note.topicsAddressed && `Temas abordados: ${note.topicsAddressed}`,
        note.relevantNarrative && `Narrativa relevante: ${note.relevantNarrative}`,
        note.clinicalAssessment && `Avaliação clínica: ${note.clinicalAssessment}`,
        note.technicalAnalysis && `Análise técnica: ${note.technicalAnalysis}`,
        note.techniquesUsed && `Técnicas utilizadas: ${note.techniquesUsed}`,
        note.plannedInterventions && `Intervenções planejadas: ${note.plannedInterventions}`,
        note.homework && `Tarefa de casa: ${note.homework}`,
        note.therapeuticPlan && `Plano terapêutico: ${note.therapeuticPlan}`,
        note.treatmentResponse && `Resposta ao tratamento: ${note.treatmentResponse}`,
        note.goalsProgress && `Progresso dos objetivos: ${note.goalsProgress}`,
        note.observedInsights && `Insights observados: ${note.observedInsights}`,
        note.observedResistances && `Resistências observadas: ${note.observedResistances}`,
        note.aiSuggestions && `Anotações gerais: ${note.aiSuggestions}`,
      ].filter(Boolean).join("\n");

      if (!noteContext.trim()) {
        return { feedback: "Preencha os campos do prontuário antes de solicitar a análise." };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um supervisor clínico especializado em psicologia. Sua função é fornecer FEEDBACK TÉCNICO sobre o prontuário de sessão de um psicólogo, com foco em clareza, objetividade e fundamentação técnica.

IMPORTANTE: Esta análise é uma ferramenta de apoio para aprimoramento técnico do prontuário. Não substitui o julgamento clínico do profissional.

ESTRUTURA DA RESPOSTA:

FEEDBACK TÉCNICO DO PRONTUÁRIO

[Parágrafo de análise geral: clareza, consistência entre os campos, fundamentação técnica]

Seção 2 - ESTADO ATUAL
[Avalie o registro do estado emocional e apresentação do paciente. Sugira reformulações mais objetivas se necessário]

Seção 3 - INTERVENÇÕES
[Avalie a descrição das técnicas e intervenções. Sugira complementos ou ajustes]

Seção 4 - EVOLUÇÃO
[Avalie o registro da evolução terapêutica. Sugira como aprimorar a documentação]

Seção 5 - RECOMENDAÇÕES
[Pontue melhorias específicas para o próximo prontuário]

Responda em português brasileiro profissional.`,
          },
          {
            role: "user",
            content: `Prontuário da sessão:\n${noteContext}`,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const feedback = typeof rawContent === "string" ? rawContent : "Não foi possível gerar o feedback.";
      await updateClinicalNote(input.noteId, ctx.user.id, {
        aiTechnicalFeedback: feedback,
        aiTechnicalFeedbackAt: Date.now(),
      });
      return { feedback };
    }),

  autoFill: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number(),
        noteId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar dados do paciente
      const patient = await getPatientByIdShared(input.patientId, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

      // Buscar anamnese do paciente
      const { anamnese: anamneseTable, clinicalNotes: cnTable, sessions: sessionsTable } = await import("../drizzle/schema");
      const [anamneseData] = await db.select().from(anamneseTable).where(eq(anamneseTable.patientId, input.patientId)).limit(1);

      // Buscar sessões anteriores com prontuários
      const previousNotes = await db
        .select()
        .from(cnTable)
        .where(and(eq(cnTable.patientId, input.patientId), eq(cnTable.userId, ctx.user.id)))
        .orderBy(cnTable.createdAt)
        .limit(5);

      // Buscar dados da sessão atual
      const [currentSession] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.id, input.sessionId))
        .limit(1);

      // Montar contexto para a IA
      const patientContext = [
        `PACIENTE: ${patient.name}`,
        patient.birthDate && `Data de nascimento: ${patient.birthDate}`,
        patient.gender && `Gênero: ${patient.gender}`,
        patient.notes && `Observações gerais: ${patient.notes}`,
      ].filter(Boolean).join("\n");

      const anamneseContext = anamneseData ? [
        anamneseData.mainComplaint && `Queixa principal: ${anamneseData.mainComplaint}`,
        anamneseData.currentIllnessHistory && `História da doença atual: ${anamneseData.currentIllnessHistory}`,
        anamneseData.familyHistory && `Histórico familiar: ${anamneseData.familyHistory}`,
        anamneseData.personalHistory && `Histórico pessoal: ${anamneseData.personalHistory}`,
        anamneseData.therapeuticObjectives && `Objetivos terapêuticos: ${anamneseData.therapeuticObjectives}`,
        anamneseData.cidDiagnosis && `Diagnóstico CID: ${anamneseData.cidDiagnosis}`,
        anamneseData.therapeuticApproach && `Abordagem terapêutica: ${anamneseData.therapeuticApproach}`,
        anamneseData.riskFactors && `Fatores de risco: ${anamneseData.riskFactors}`,
      ].filter(Boolean).join("\n") : "Anamnese não preenchida";

      const previousNotesContext = previousNotes.length > 0
        ? previousNotes.map((n, i) => {
            const parts = [
              n.content && `Anotações: ${n.content}`,
              n.emotionalState && `Estado emocional: ${n.emotionalState}`,
              n.mainDemand && `Demanda: ${n.mainDemand}`,
              n.sufferingLevel != null && `Sofrimento: ${n.sufferingLevel}/10`,
              n.treatmentResponse && `Resposta ao tratamento: ${n.treatmentResponse}`,
            ].filter(Boolean).join("; ");
            return `Sessão ${i + 1}: ${parts}`;
          }).join("\n")
        : "Primeira sessão do paciente";

      const sessionNumber = previousNotes.length + 1;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um assistente de psicólogo clínico. Sua tarefa é preencher um prontuário de sessão psicológica em formato JSON estruturado.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS um objeto JSON válido, sem texto antes ou depois
2. TODOS os campos abaixo devem ser preenchidos com conteúdo específico e contextualizado
3. NÃO coloque todo o conteúdo em um único campo - cada campo tem seu propósito específico
4. Use linguagem técnica de psicologia clínica em português
5. Baseie-se SEMPRE no histórico do paciente fornecido para criar narrativas coerentes
6. Se for a primeira sessão, crie uma narrativa de apresentação e avaliação inicial
7. Se houver sessões anteriores, crie uma narrativa que demonstre continuidade e evolução
8. Cada campo deve ter conteúdo ÚNICO - não repita informações entre campos
9. NUNCA deixe campos vazios - preencha com conteúdo relevante ou guia de formatação
10. Guie o psicólogo com sugestões de formatação quando apropriado

CAMPOS DO JSON (todos obrigatórios):
- "content": texto narrativo geral da sessão (2-3 parágrafos resumindo o encontro)
- "generalPresentation": aparência física, postura, comportamento motor, contato visual do paciente nesta sessão
- "currentMedications": medicações psiquiátricas ou relevantes em uso (escreva "Nenhuma" se não houver)
- "emotionalState": estado emocional observado durante a sessão (ex: "ansioso com momentos de relaxamento")
- "predominantMood": humor predominante descrito clinicamente (ex: "eutímico com leve disforia")
- "mood": classificação do humor - DEVE ser exatamente um destes valores: "very_bad", "bad", "neutral", "good", "very_good"
- "sufferingLevel": número inteiro de 0 a 10 indicando nível de sofrimento
- "mainDemand": o que o paciente trouxe como demanda principal para esta sessão
- "topicsAddressed": tópicos e temas discutidos durante a sessão
- "relevantNarrative": falas ou narrativas significativas do paciente (pode incluir citações)
- "clinicalAssessment": avaliação clínica do terapeuta sobre o estado do paciente
- "technicalAnalysis": análise técnica aprofundada usando referencial teórico
- "techniquesUsed": técnicas terapêuticas aplicadas nesta sessão
- "plannedInterventions": intervenções planejadas para esta e próximas sessões
- "therapeuticPlan": plano terapêutico atualizado
- "homework": tarefa de casa proposta ao paciente
- "treatmentResponse": como o paciente está respondendo ao tratamento
- "goalsProgress": progresso nos objetivos terapêuticos estabelecidos
- "observedInsights": insights do paciente observados durante a sessão
- "observedResistances": resistências, defesas ou dificuldades observadas
- "nextSessionGoals": objetivos específicos para a próxima sessão
- "treatmentPlanAdjustments": ajustes necessários no plano de tratamento
- "selfHarmRisk": risco de autolesão - DEVE ser exatamente: "absent", "low", "moderate", "high" ou "extreme"
- "thirdPartyRisk": risco a terceiros - DEVE ser exatamente: "absent", "low", "moderate", "high" ou "extreme"
- "suicideRisk": risco de suicídio - DEVE ser exatamente: "absent", "low", "moderate", "high" ou "extreme"
- "countertransference": observações de contratransferência do terapeuta
- "clinicalHypotheses": hipóteses clínicas e diagnósticas
- "supervisionNotes": pontos relevantes para levar à supervisão
- "referrals": encaminhamentos realizados (escreva "Nenhum" se não houver)
- "privateObservations": observações privadas do terapeuta`,
          },
          {
            role: "user",
            content: `DADOS DO PACIENTE:\n${patientContext}\n\nANAMNESE:\n${anamneseContext}\n\nHISTÓRICO DE SESSÕES ANTERIORES:\n${previousNotesContext}\n\nEsta é a sessão número ${sessionNumber}.\n\nCRIE UMA NARRATIVA COERENTE E CONTEXTUALIZADA:\n- Use o histórico do paciente como base para criar continuidade\n- Demonstre evolução ou mudanças em relação às sessões anteriores\n- Crie sugestões específicas e personalizadas para este paciente\n- Se não houver dados anteriores, forneça um guia de formatação para ajudar o psicólogo\n- Cada campo deve complementar os outros, não repetir\n\nGere o preenchimento do prontuário.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IA não retornou resposta" });

      let filled: Record<string, unknown>;
      try {
        if (typeof rawContent !== "string") {
          filled = rawContent as Record<string, unknown>;
        } else {
          let jsonStr = rawContent.trim();
          // Remove markdown code fences if present (```json ... ``` or ``` ... ```)
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          // If not starting with {, try to extract the first JSON object
          if (!jsonStr.startsWith("{")) {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) jsonStr = match[0];
          }
          filled = JSON.parse(jsonStr);
        }
      } catch (parseErr) {
        console.error("[autoFill] Failed to parse AI response:", typeof rawContent === "string" ? rawContent.substring(0, 300) : rawContent);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar resposta da IA: formato inválido" });
      }

      // Validar e normalizar campos de enum
      const riskValues = ["absent", "low", "moderate", "high", "extreme"];
      const moodValues = ["very_bad", "bad", "neutral", "good", "very_good"];
      const safeRisk = (v: unknown) => riskValues.includes(v as string) ? v as string : "absent";
      const safeMood = (v: unknown) => moodValues.includes(v as string) ? v as string : "neutral";
      const safeNum = (v: unknown, min: number, max: number) => {
        const n = Number(v);
        return isNaN(n) ? min : Math.min(max, Math.max(min, n));
      };

      return {
        ...filled,
        mood: safeMood(filled.mood),
        sufferingLevel: safeNum(filled.sufferingLevel, 0, 10),
        selfHarmRisk: safeRisk(filled.selfHarmRisk),
        thirdPartyRisk: safeRisk(filled.thirdPartyRisk),
        suicideRisk: safeRisk(filled.suicideRisk),
        sessionNumber,
      };
    }),

  analyzeWithAI: protectedProcedure
    .input(
      z.object({
        noteId: z.number(),
        content: z.string(),
        patientHistory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se há conteúdo suficiente para analisar
      const contentTrimmed = input.content.trim();
      if (!contentTrimmed || contentTrimmed.length < 10) {
        return { suggestions: "Por favor, adicione anotações clínicas antes de solicitar a análise da IA." };
      }

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um assistente clínico especializado em psicologia clínica. Sua função é analisar as anotações de sessão de um psicólogo e fornecer insights clínicos úteis.

REGRAS OBRIGATÓRIAS:
- Responda SOMENTE em português brasileiro correto e claro
- Use APENAS as informações fornecidas nas anotações. Não invente dados
- Se as anotações forem breves, faça uma análise concisa baseada no que foi informado
- Não faça diagnósticos definitivos
- Seja objetivo e profissional
- Não repita frases ou palavras desnecessariamente

ESTRUTURA DA RESPOSTA (use exatamente este formato):

**Resumo da Sessão**
[Resumo objetivo do que foi relatado nas anotações, em 2-3 frases claras]

**Pontos de Atenção**
[Liste os principais pontos clínicos identificados, baseados apenas nas anotações]

**Sugestões para Próxima Sessão**
[Sugestões práticas de intervenções terapêuticas baseadas no que foi relatado]

**Evolução do Paciente**
[Se houver histórico anterior, compare a evolução. Se não houver, escreva: "Primeira sessão registrada no sistema."]`,
          },
          {
            role: "user",
            content: `Anotações da sessão atual:
${contentTrimmed}${input.patientHistory ? `

Histórico de sessões anteriores do paciente:
${input.patientHistory}` : ""}`,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const aiText = typeof rawContent === "string" ? rawContent : "Não foi possível gerar a análise. Tente novamente.";
      await updateClinicalNote(input.noteId, ctx.user.id, { aiSuggestions: aiText });
      return { suggestions: aiText };
    }),
});

// ─── Transactions Router ────────────────────────────────────────────────────
const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        patientId: z.number().optional(),
        status: z.string().optional(),
        from: z.number().optional(),
        to: z.number().optional(),
      })
    )
    .query(({ ctx, input }) => getTransactions(ctx.user.id, input)),

  create: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        amount: z.string(),
        type: z.enum(["income", "expense", "refund"]).default("income"),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
        paymentMethod: z
          .enum(["cash", "pix", "credit_card", "debit_card", "bank_transfer", "health_insurance", "other"])
          .optional(),
        description: z.string().optional(),
        dueDate: z.number().optional(),
        paidAt: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createTransaction({ ...input, userId: ctx.user.id });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        paymentMethod: z
          .enum(["cash", "pix", "credit_card", "debit_card", "bank_transfer", "health_insurance", "other"])
          .optional(),
        paidAt: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateTransaction(id, ctx.user.id, data);
      return { success: true };
    }),

  summary: protectedProcedure.query(async ({ ctx }) => {
    const [revenue, overdueCount] = await Promise.all([
      getMonthlyRevenue(ctx.user.id),
      getOverdueSessions(ctx.user.id),
    ]);
    return { monthlyRevenue: revenue, overdueCount };
  }),
});

// ─── Documents Router ───────────────────────────────────────────────────────
const documentsRouter = router({
  byPatient: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(({ ctx, input }) => getDocumentsByPatient(input.patientId, ctx.user.id)),

  upload: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number().optional(),
        category: z.enum(["report", "exam", "prescription", "referral", "consent", "other"]).default("other"),
        description: z.string().optional(),
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      const fileKey = `patients/${ctx.user.id}/${input.patientId}/${Date.now()}-${input.fileName}`;
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);
      const id = await createDocument({
        userId: ctx.user.id,
        patientId: input.patientId,
        sessionId: input.sessionId,
        fileName: input.fileName,
        fileKey: key,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        category: input.category,
        description: input.description,
      });
      return { id, url };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletDocument(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Dashboard Router ───────────────────────────────────────────────────────
const dashboardRouter = router({
  metrics: protectedProcedure.query(async ({ ctx }) => {
    const [patientCount, sessionsThisMonth, monthlyRevenue, overdueCount, upcomingSessions] = await Promise.all([
      getPatientCount(ctx.user.id),
      getSessionsThisMonth(ctx.user.id),
      getMonthlyRevenue(ctx.user.id),
      getOverdueSessions(ctx.user.id),
      getUpcomingSessions(ctx.user.id, 5),
    ]);
    return { patientCount, sessionsThisMonth, monthlyRevenue, overdueCount, upcomingSessions };
  }),

  conversionFunnel: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        leads: 0,
        prospects: 0,
        customers: 0,
        conversionRate: 0,
      };
    }

    // Get patients by lead status
    const allPatients = await getPatients(ctx.user.id);
    
    const leads = allPatients.filter((p) => p.leadStatus === "lead").length;
    const prospects = allPatients.filter((p) => p.leadStatus === "prospect").length;
    const customers = allPatients.filter((p) => p.leadStatus === "customer").length;
    
    const total = leads + prospects + customers;
    const conversionRate = total > 0 ? Math.round((customers / total) * 100) : 0;

    return {
      leads,
      prospects,
      customers,
      conversionRate,
      total,
    };
  }),
});

// ─── User Sync Router ───────────────────────────────────
const userSyncRouter = router({
  linkUsers: adminProcedure
    .input(z.object({ primaryUserId: z.number(), linkedUserId: z.number() }))
    .mutation(async ({ input }) => {
      const { linkUsers } = await import("./db");
      await linkUsers(input.primaryUserId, input.linkedUserId);
      return { success: true };
    }),

  getSharedPatients: protectedProcedure
    .input(z.object({ search: z.string().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { getPatientsShared } = await import("./db");
      return getPatientsShared(ctx.user.id, input.search, input.status);
    }),

  getSharedPatientById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { getPatientByIdShared } = await import("./db");
      const patient = await getPatientByIdShared(input.id, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      return patient;
    }),

  getSharedSessions: protectedProcedure
    .input(z.object({ patientId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { getSessionsShared } = await import("./db");
      return getSessionsShared(ctx.user.id, input.patientId, input.status);
    }),
});



// ─── App Router ──────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  settings: settingsRouter,
  reports: reportsRouter,
  webhooks: webhooksRouter,
  websiteAppointments: websiteAppointmentsRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: dashboardRouter,
  patients: patientsRouter,
  sessions: sessionsRouter,
  clinicalNotes: clinicalNotesRouter,
  transactions: transactionsRouter,
  financial: financialRouter,
  documents: documentsRouter,
  anamnese: anamneseRouter,
  recordings: recordingsRouter,
  timeline: timelineRouter,
  managementReports: managementReportsRouter,
  userSync: userSyncRouter,
  pistas: pistasRouter,
  aiAnalytics: aiAnalyticsRouter,
  aiIntegration: aiIntegrationRouter,
  admin: adminRouter,
  invitations: invitationsRouter,
  internalAuth: internalAuthRouter,
  internalUsers: internalUsersRouter,
  roles: rolesRouter,
  audit: auditRouter,
  calendar: router({
    getEvents: protectedProcedure
      .input(z.object({
        accessToken: z.string(),
        calendarId: z.string().optional(),
        timeMin: z.string().optional(),
        timeMax: z.string().optional(),
        maxResults: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { listCalendarEvents } = await import("./_core/google-calendar");
        return listCalendarEvents(
          input.accessToken,
          input.calendarId,
          {
            timeMin: input.timeMin,
            timeMax: input.timeMax,
            maxResults: input.maxResults,
          }
        );
      }),
    createEvent: protectedProcedure
      .input(z.object({
        accessToken: z.string(),
        summary: z.string(),
        description: z.string().optional(),
        start: z.object({
          dateTime: z.string(),
          timeZone: z.string().optional(),
        }),
        end: z.object({
          dateTime: z.string(),
          timeZone: z.string().optional(),
        }),
        attendees: z.array(z.object({ email: z.string() })).optional(),
        calendarId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createCalendarEvent } = await import("./_core/google-calendar");
        const { accessToken, calendarId, ...eventData } = input;
        return createCalendarEvent(accessToken, eventData, calendarId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
