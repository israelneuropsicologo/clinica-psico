import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, like } from "drizzle-orm";
import { patients } from "../drizzle/schema";
import {
  createPatient,
  deletePatient,
  getPatientByIdShared,
  getPatients,
  updatePatient,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getDb } from "./db";
import { anamneseRouter } from "./routers/patientProfile";
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
        fullName: z.string().min(2),
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
        
        const id = await createPatient({
          userId,
          fullName: input.fullName,
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

// ─── Main Router ────────────────────────────────────────────────────────────
export const appRouter = router({
  auth: authRouter,
  patients: patientsRouter,
  anamnese: anamneseRouter,
});

export type AppRouter = typeof appRouter;
