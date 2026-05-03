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
        status: z.enum(["active", "inactive", "discharged"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updatePatient(id, ctx.user.id, data);
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateClinicalNote(id, ctx.user.id, data);
      return { success: true };
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
