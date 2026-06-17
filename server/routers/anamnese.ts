import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { anamneseV1 } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// ─── Input Schema ────────────────────────────────────────────────────────────
const anamneseInput = z.object({
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
});

// ─── Anamnese Router ────────────────────────────────────────────────────────
export const anamneseRouter = router({
  // Get anamnese for a specific patient
  get: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const result = await db
        .select()
        .from(anamneseV1)
        .where(eq(anamneseV1.patientId, input.patientId))
        .limit(1);

      return result[0] ?? null;
    }),

  // Save (insert or update) anamnese
  save: protectedProcedure
    .input(anamneseInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { patientId, ...data } = input;

      // Check if anamnese already exists for this patient
      const existing = await db
        .select({ id: anamneseV1.id })
        .from(anamneseV1)
        .where(eq(anamneseV1.patientId, patientId))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(anamneseV1)
          .set(data as any)
          .where(eq(anamneseV1.patientId, patientId));
      } else {
        // Insert new
        await db.insert(anamneseV1).values({
          ...data,
          patientId,
          userId: ctx.user.id,
        } as any);
      }

      return { success: true };
    }),

  // Upsert (alias for save - for compatibility)
  upsert: protectedProcedure
    .input(anamneseInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { patientId, ...data } = input;

      const existing = await db
        .select({ id: anamneseV1.id })
        .from(anamneseV1)
        .where(eq(anamneseV1.patientId, patientId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(anamneseV1)
          .set(data as any)
          .where(eq(anamneseV1.patientId, patientId));
      } else {
        await db.insert(anamneseV1).values({
          ...data,
          patientId,
          userId: ctx.user.id,
        } as any);
      }

      return { success: true };
    }),
});
