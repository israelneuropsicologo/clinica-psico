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
import { systemRouter } from "./_core/systemRouter";
import { reportsRouter } from "./routers/reports";
import { settingsRouter } from "./routers/settings";
import { financialRouter } from "./routers/financial";
import { webhooksRouter } from "./routers/webhooks";
import { anamneseRouter, recordingsRouter, timelineRouter } from "./routers/patientProfile";
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
        sessionValue: input.sessionValue || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return { id };
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
const sessionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        patientId: z.number().optional(),
        status: z.string().optional(),
        isPaid: z.string().optional(),
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
        note.content && `Anotações gerais: ${note.content}`,
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
            content: `Você é um psicólogo clínico experiente preenchendo um prontuário de sessão. Com base no histórico do paciente, gere um preenchimento REALISTA e CONTEXTUALIZADO para todos os campos do prontuário.

IMPORTANTE:
- Use linguagem técnica de psicologia clínica
- Seja específico e contextualizado ao histórico do paciente
- Gere conteúdo que o psicólogo possa aproveitar diretamente ou com pequenos ajustes
- Responda APENAS com JSON válido, sem texto adicional
- Os campos de risco devem ser um dos valores: "absent", "low", "moderate", "high", "extreme"
- Os campos de humor devem ser um dos valores: "very_bad", "bad", "neutral", "good", "very_good"

Retorne um JSON com exatamente esta estrutura:
{
  "content": "anotações clínicas gerais da sessão (2-4 parágrafos)",
  "emotionalState": "descrição do estado emocional observado",
  "predominantMood": "humor predominante",
  "mood": "very_bad|bad|neutral|good|very_good",
  "sufferingLevel": 0-10,
  "mainDemand": "demanda principal trazida pelo paciente",
  "topicsAddressed": "temas abordados na sessão",
  "relevantNarrative": "narrativa relevante do paciente",
  "clinicalAssessment": "avaliação clínica do terapeuta",
  "technicalAnalysis": "análise técnica aprofundada",
  "techniquesUsed": "técnicas terapêuticas utilizadas",
  "plannedInterventions": "intervenções planejadas",
  "therapeuticPlan": "plano terapêutico para as próximas sessões",
  "homework": "tarefa de casa proposta",
  "treatmentResponse": "como o paciente respondeu ao tratamento",
  "goalsProgress": "progresso em relação aos objetivos terapêuticos",
  "observedInsights": "insights observados durante a sessão",
  "observedResistances": "resistências ou dificuldades observadas",
  "nextSessionGoals": "objetivos para a próxima sessão",
  "treatmentPlanAdjustments": "ajustes sugeridos no plano de tratamento",
  "selfHarmRisk": "absent|low|moderate|high|extreme",
  "thirdPartyRisk": "absent|low|moderate|high|extreme",
  "suicideRisk": "absent|low|moderate|high|extreme",
  "countertransference": "observações de contratransferência",
  "clinicalHypotheses": "hipóteses clínicas",
  "supervisionNotes": "pontos para levar à supervisão"
}`,
          },
          {
            role: "user",
            content: `DADOS DO PACIENTE:\n${patientContext}\n\nANAMNESE:\n${anamneseContext}\n\nHISTÓRICO DE SESSÕES ANTERIORES:\n${previousNotesContext}\n\nEsta é a sessão número ${sessionNumber}. Gere o preenchimento do prontuário.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "prontuario_autofill",
            strict: true,
            schema: {
              type: "object",
              properties: {
                content: { type: "string" },
                emotionalState: { type: "string" },
                predominantMood: { type: "string" },
                mood: { type: "string" },
                sufferingLevel: { type: "number" },
                mainDemand: { type: "string" },
                topicsAddressed: { type: "string" },
                relevantNarrative: { type: "string" },
                clinicalAssessment: { type: "string" },
                technicalAnalysis: { type: "string" },
                techniquesUsed: { type: "string" },
                plannedInterventions: { type: "string" },
                therapeuticPlan: { type: "string" },
                homework: { type: "string" },
                treatmentResponse: { type: "string" },
                goalsProgress: { type: "string" },
                observedInsights: { type: "string" },
                observedResistances: { type: "string" },
                nextSessionGoals: { type: "string" },
                treatmentPlanAdjustments: { type: "string" },
                selfHarmRisk: { type: "string" },
                thirdPartyRisk: { type: "string" },
                suicideRisk: { type: "string" },
                countertransference: { type: "string" },
                clinicalHypotheses: { type: "string" },
                supervisionNotes: { type: "string" },
              },
              required: ["content", "emotionalState", "predominantMood", "mood", "sufferingLevel", "mainDemand", "topicsAddressed", "relevantNarrative", "clinicalAssessment", "technicalAnalysis", "techniquesUsed", "plannedInterventions", "therapeuticPlan", "homework", "treatmentResponse", "goalsProgress", "observedInsights", "observedResistances", "nextSessionGoals", "treatmentPlanAdjustments", "selfHarmRisk", "thirdPartyRisk", "suicideRisk", "countertransference", "clinicalHypotheses", "supervisionNotes"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IA não retornou resposta" });

      let filled: Record<string, unknown>;
      try {
        filled = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar resposta da IA" });
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

// ─── App Router ───────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  settings: settingsRouter,
  reports: reportsRouter,
  webhooks: webhooksRouter,
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
  userSync: userSyncRouter,
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
