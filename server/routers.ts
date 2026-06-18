import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { patients } from "../drizzle/schema";
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatientByIdShared,
  getPatients,
  updatePatient,
  getAnamneseByPatientId,
  createAnamnese,
  updateAnamnese,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { protectedProcedure, router } from "./_core/trpc";

// ─── Patients Router ────────────────────────────────────────────────────────
const patientsRouter = router({
  list: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(({ ctx, input }) => getPatients(String(ctx.user?.id || ''), input.search)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const patient = await getPatientByIdShared(input.id, String(ctx.user?.id || ''));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      return patient;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        cpf: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.user?.id ? parseInt(ctx.user.id) : 0;
        if (userId === 0) throw new Error("User not authenticated");
        
        const fullName = input.fullName || input.name;
        if (!fullName) throw new Error("fullName or name is required");
        
        const id = await createPatient({
          userId,
          fullName,
          email: input.email || null,
          phone: input.phone || null,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          cpf: input.cpf || null,
        });
        return { id };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao cadastrar paciente";
        
        if (message.includes("Duplicate entry") && message.includes("cpf")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CPF já cadastrado no sistema" });
        }
        if (message.includes("Duplicate entry") && message.includes("email")) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Email já cadastrado no sistema" });
        }
        
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao cadastrar paciente." });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        birthDate: z.string().optional(),
        cpf: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rawData } = input;
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rawData)) {
        if (value === undefined) continue;
        if (value === '') {
          data[key] = null;
        } else {
          data[key] = value;
        }
      }
      
      if (Object.keys(data).length > 0) {
        const userId = String(ctx.user?.id || '');
        await updatePatient(id, userId, data);
      }
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || '');
      await deletePatient(input.id, userId);
      return { success: true };
    }),

  deleteMultiple: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const userId = String(ctx.user?.id || '');
      let deletedCount = 0;
      for (const id of input.ids) {
        await deletePatient(id, userId);
        deletedCount++;
      }
      return { success: true, deletedCount };
    }),

  deleteTestData: protectedProcedure
    .mutation(async () => {
      return { success: true };
    }),
});

// ─── Anamnese Router ───────────────────────────────────────────────────────
const anamneseRouter = router({
  getByPatientId: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Verify patient ownership
      const patient = await getPatientByIdShared(input.patientId, String(ctx.user?.id || '1'));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });
      
      const anamnese = await getAnamneseByPatientId(input.patientId);
      return anamnese;
    }),

  save: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        mainComplaintDetail: z.string().optional(),
        therapeuticGoals: z.string().optional(),
        cidCode: z.string().optional(),
        cidDescription: z.string().optional(),
        therapeuticApproach: z.string().optional(),
        currentDiseaseHistory: z.string().optional(),
        personalHistory: z.string().optional(),
        familyHistory: z.string().optional(),
        psychiatricHistory: z.string().optional(),
        previousTreatments: z.string().optional(),
        childhoodHistory: z.string().optional(),
        relationshipHistory: z.string().optional(),
        professionalHistory: z.string().optional(),
        substanceUse: z.string().optional(),
        sleepAndEating: z.string().optional(),
        sexualAffectiveLife: z.string().optional(),
        riskFactors: z.string().optional(),
        protectiveFactors: z.string().optional(),
        additionalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ? parseInt(ctx.user.id) : 0;
      if (userId === 0) throw new Error("User not authenticated");

      // Verify patient ownership
      const patient = await getPatientByIdShared(input.patientId, String(ctx.user?.id || '1'));
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const existing = await getAnamneseByPatientId(input.patientId);
      
      if (existing) {
        // Update existing
        await updateAnamnese(existing.id, {
          mainComplaintDetail: input.mainComplaintDetail || existing.mainComplaintDetail,
          therapeuticGoals: input.therapeuticGoals || existing.therapeuticGoals,
          cidCode: input.cidCode || existing.cidCode,
          cidDescription: input.cidDescription || existing.cidDescription,
          therapeuticApproach: input.therapeuticApproach || existing.therapeuticApproach,
          currentDiseaseHistory: input.currentDiseaseHistory || existing.currentDiseaseHistory,
          personalHistory: input.personalHistory || existing.personalHistory,
          familyHistory: input.familyHistory || existing.familyHistory,
          psychiatricHistory: input.psychiatricHistory || existing.psychiatricHistory,
          previousTreatments: input.previousTreatments || existing.previousTreatments,
          childhoodHistory: input.childhoodHistory || existing.childhoodHistory,
          relationshipHistory: input.relationshipHistory || existing.relationshipHistory,
          professionalHistory: input.professionalHistory || existing.professionalHistory,
          substanceUse: input.substanceUse || existing.substanceUse,
          sleepAndEating: input.sleepAndEating || existing.sleepAndEating,
          sexualAffectiveLife: input.sexualAffectiveLife || existing.sexualAffectiveLife,
          riskFactors: input.riskFactors || existing.riskFactors,
          protectiveFactors: input.protectiveFactors || existing.protectiveFactors,
          additionalNotes: input.additionalNotes || existing.additionalNotes,
        });
      } else {
        // Create new
        await createAnamnese({
          userId,
          patientId: input.patientId,
          mainComplaintDetail: input.mainComplaintDetail || null,
          therapeuticGoals: input.therapeuticGoals || null,
          cidCode: input.cidCode || null,
          cidDescription: input.cidDescription || null,
          therapeuticApproach: input.therapeuticApproach || null,
          currentDiseaseHistory: input.currentDiseaseHistory || null,
          personalHistory: input.personalHistory || null,
          familyHistory: input.familyHistory || null,
          psychiatricHistory: input.psychiatricHistory || null,
          previousTreatments: input.previousTreatments || null,
          childhoodHistory: input.childhoodHistory || null,
          relationshipHistory: input.relationshipHistory || null,
          professionalHistory: input.professionalHistory || null,
          substanceUse: input.substanceUse || null,
          sleepAndEating: input.sleepAndEating || null,
          sexualAffectiveLife: input.sexualAffectiveLife || null,
          riskFactors: input.riskFactors || null,
          protectiveFactors: input.protectiveFactors || null,
          additionalNotes: input.additionalNotes || null,
        });
      }

      return { success: true };
    }),
});

// ─── Auth Router ────────────────────────────────────────────────────────────
const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),

  logout: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.res) {
      ctx.res.clearCookie(COOKIE_NAME);
    }
    return { success: true };
  }),
});

// ─── Reports Router (stub) ────────────────────────────────────────────────
const reportsRouter = router({
  generatePatientPDF: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      patientIds: z.array(z.number()).optional(),
    }))
    .mutation(async () => {
      return { success: true, url: '#' };
    }),
});

// ─── Invitations Router (stub) ────────────────────────────────────────────
const invitationsRouter = router({
  generateLink: protectedProcedure
    .input(z.object({
      patientId: z.number(),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async () => {
      return { inviteUrl: '#' };
    }),
  
  listByUser: protectedProcedure.query(async () => {
    return [];
  }),
});

// ─── Admin Router (stub) ────────────────────────────────────────────────────
const adminRouter = router({
  getAllUsers: protectedProcedure.query(async () => {
    return [];
  }),
});

// ─── Dashboard Router (stub) ────────────────────────────────────────────────
const dashboardRouter = router({
  metrics: protectedProcedure.query(async () => {
    return {
      activePatients: 0,
      sessionsThisMonth: 0,
      monthlyRevenue: 0,
      overallRevenue: 0,
    };
  }),
  
  conversionFunnel: protectedProcedure.query(async () => {
    return {
      stages: [],
    };
  }),
});

// ─── Main Router ────────────────────────────────────────────────────────────
export const appRouter = router({
  auth: authRouter,
  patients: patientsRouter,
  anamnese: anamneseRouter,
  reports: reportsRouter,
  invitations: invitationsRouter,
  admin: adminRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
