import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { medicalRecordsTimeline, treatmentPlans } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const medicalRecordsRouter = router({
  // Listar timeline de prontuário de um paciente
  timeline: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const records = await db
        .select()
        .from(medicalRecordsTimeline)
        .where(eq(medicalRecordsTimeline.patientId, input.patientId))
        .orderBy(desc(medicalRecordsTimeline.createdAt));
      return records;
    }),

  // Criar entrada na timeline
  createEntry: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        entryType: z.enum([
          "session_note",
          "clinical_evolution",
          "intervention",
          "assessment",
          "treatment_plan",
          "discharge_summary",
        ]),
        title: z.string(),
        content: z.string(),
        clinicalEvolution: z.string().optional(),
        interventionSummary: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(medicalRecordsTimeline).values({
        patientId: input.patientId,
        sessionId: input.sessionId,
        userId: ctx.user.id,
        entryType: input.entryType,
        title: input.title,
        content: input.content,
        clinicalEvolution: input.clinicalEvolution,
        interventionSummary: input.interventionSummary,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        isPrivate: false,
      });
      return result;
    }),

  // Atualizar entrada
  updateEntry: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        clinicalEvolution: z.string().optional(),
        interventionSummary: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db
        .update(medicalRecordsTimeline)
        .set(updates)
        .where(eq(medicalRecordsTimeline.id, id));
      return { success: true };
    }),

  // Deletar entrada
  deleteEntry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(medicalRecordsTimeline)
        .where(eq(medicalRecordsTimeline.id, input.id));
      return { success: true };
    }),

  // Listar planos de tratamento
  treatmentPlans: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const plans = await db
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.patientId, input.patientId))
        .orderBy(desc(treatmentPlans.createdAt));
      return plans;
    }),

  // Criar plano de tratamento
  createTreatmentPlan: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        title: z.string(),
        goals: z.array(z.string()).optional(),
        interventions: z.array(z.string()).optional(),
        expectedDuration: z.number().optional(),
        frequency: z.string().optional(),
        startDate: z.number(),
        expectedEndDate: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(treatmentPlans).values({
        patientId: input.patientId,
        userId: ctx.user.id,
        title: input.title,
        goals: input.goals ? JSON.stringify(input.goals) : null,
        interventions: input.interventions ? JSON.stringify(input.interventions) : null,
        expectedDuration: input.expectedDuration,
        frequency: input.frequency,
        startDate: input.startDate,
        expectedEndDate: input.expectedEndDate,
        status: "active",
      });
      return result;
    }),

  // Atualizar plano de tratamento
  updateTreatmentPlan: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "paused", "completed", "discontinued"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db
        .update(treatmentPlans)
        .set(updates)
        .where(eq(treatmentPlans.id, id));
      return { success: true };
    }),
});
