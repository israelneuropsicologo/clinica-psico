import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { anamnesisIntake } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const anamnesisRouter = router({
  // Listar anamneses de um paciente
  list: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const records = await db
        .select()
        .from(anamnesisIntake)
        .where(eq(anamnesisIntake.patientId, input.patientId))
        .orderBy(desc(anamnesisIntake.createdAt));
      return records;
    }),

  // Criar nova anamnese
  create: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        intakeType: z.enum(["initial_assessment", "follow_up", "reassessment"]).optional(),
        chiefComplaint: z.string().optional(),
        maritalStatus: z.string().optional(),
        education: z.string().optional(),
        substanceUse: z.string().optional(),
        sleepPatterns: z.string().optional(),
        stressFactors: z.string().optional(),
        suicidalityAssessment: z.string().optional(),
        preliminaryDiagnosis: z.string().optional(),
        recommendedTherapy: z.string().optional(),
        questionnaireResponses: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(anamnesisIntake).values({
        patientId: input.patientId,
        userId: ctx.user.id,
        intakeType: input.intakeType || "initial_assessment",
        chiefComplaint: input.chiefComplaint,
        maritalStatus: input.maritalStatus,
        education: input.education,
        substanceUse: input.substanceUse,
        sleepPatterns: input.sleepPatterns,
        stressFactors: input.stressFactors,
        suicidalityAssessment: input.suicidalityAssessment,
        preliminaryDiagnosis: input.preliminaryDiagnosis,
        recommendedTherapy: input.recommendedTherapy,
        questionnaireResponses: input.questionnaireResponses ? JSON.stringify(input.questionnaireResponses) : null,
        status: "in_progress",
      });
      return { success: true };
    }),

  // Atualizar anamnese
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        chiefComplaint: z.string().optional(),
        historyOfPresentIllness: z.string().optional(),
        pastMedicalHistory: z.string().optional(),
        pastPsychiatricHistory: z.string().optional(),
        familyHistory: z.string().optional(),
        mentalStatusExam: z.string().optional(),
        moodAndAffect: z.string().optional(),
        cognitiveFunction: z.string().optional(),
        treatmentPlan: z.string().optional(),
        status: z.enum(["in_progress", "completed", "archived"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db
        .update(anamnesisIntake)
        .set(updates)
        .where(eq(anamnesisIntake.id, id));
      return { success: true };
    }),

  // Completar anamnese
  complete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(anamnesisIntake)
        .set({
          status: "completed",
          completedAt: Date.now(),
        })
        .where(eq(anamnesisIntake.id, input.id));
      return { success: true };
    }),

  // Deletar anamnese
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(anamnesisIntake)
        .where(eq(anamnesisIntake.id, input.id));
      return { success: true };
    }),
});
