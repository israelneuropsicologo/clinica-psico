import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { anamneseV1 } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const anamneseRouter = router({
  get: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(anamneseV1)
        .where(eq(anamneseV1.patientId, input.patientId))
        .limit(1);
      return result[0] ?? null;
    }),

  upsert: protectedProcedure
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
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select()
        .from(anamneseV1)
        .where(eq(anamneseV1.patientId, input.patientId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(anamneseV1)
          .set({
            mainComplaintDetail: input.mainComplaintDetail,
            therapeuticGoals: input.therapeuticGoals,
            cidCode: input.cidCode,
            cidDescription: input.cidDescription,
            therapeuticApproach: input.therapeuticApproach,
            currentDiseaseHistory: input.currentDiseaseHistory,
            personalHistory: input.personalHistory,
            familyHistory: input.familyHistory,
            psychiatricHistory: input.psychiatricHistory,
            previousTreatments: input.previousTreatments,
            childhoodHistory: input.childhoodHistory,
            relationshipHistory: input.relationshipHistory,
            professionalHistory: input.professionalHistory,
            substanceUse: input.substanceUse,
            sleepAndEating: input.sleepAndEating,
            sexualAffectiveLife: input.sexualAffectiveLife,
            riskFactors: input.riskFactors,
            protectiveFactors: input.protectiveFactors,
            additionalNotes: input.additionalNotes,
          })
          .where(eq(anamneseV1.patientId, input.patientId));
      } else {
        await db.insert(anamneseV1).values({
          userId: ctx.user.id,
          patientId: input.patientId,
          mainComplaintDetail: input.mainComplaintDetail,
          therapeuticGoals: input.therapeuticGoals,
          cidCode: input.cidCode,
          cidDescription: input.cidDescription,
          therapeuticApproach: input.therapeuticApproach,
          currentDiseaseHistory: input.currentDiseaseHistory,
          personalHistory: input.personalHistory,
          familyHistory: input.familyHistory,
          psychiatricHistory: input.psychiatricHistory,
          previousTreatments: input.previousTreatments,
          childhoodHistory: input.childhoodHistory,
          relationshipHistory: input.relationshipHistory,
          professionalHistory: input.professionalHistory,
          substanceUse: input.substanceUse,
          sleepAndEating: input.sleepAndEating,
          sexualAffectiveLife: input.sexualAffectiveLife,
          riskFactors: input.riskFactors,
          protectiveFactors: input.protectiveFactors,
          additionalNotes: input.additionalNotes,
        });
      }

      return { success: true };
    }),
});
