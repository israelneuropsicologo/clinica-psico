import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import {
  anamnese,
  sessionRecordings,
  timelineAnalyses,
  clinicalNotes,
  sessions,
  patients,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut, storageGetSignedUrl } from "../storage";
import { transcribeAudio } from "../_core/voiceTranscription";

// ─── Anamnese Router ────────────────────────────────────────────────────────
export const anamneseRouter = router({
  get: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db
        .select()
        .from(anamnese)
        .where(
          and(eq(anamnese.patientId, input.patientId), eq(anamnese.userId, ctx.user.id))
        )
        .limit(1);
      return result[0] ?? null;
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        // Saúde
        bloodType: z.string().optional(),
        allergies: z.string().optional(),
        chronicConditions: z.string().optional(),
        disabilities: z.string().optional(),
        // Anamnese - Queixa e objetivos
        mainComplaintDetail: z.string().optional(),
        therapeuticGoals: z.string().optional(),
        cidCode: z.string().optional(),
        cidDescription: z.string().optional(),
        therapeuticApproach: z.string().optional(),
        // Anamnese - Histórico
        familyHistory: z.string().optional(),
        personalHistory: z.string().optional(),
        previousTreatments: z.string().optional(),
        currentDiseaseHistory: z.string().optional(),
        psychiatricHistory: z.string().optional(),
        childhoodHistory: z.string().optional(),
        relationshipHistory: z.string().optional(),
        professionalHistory: z.string().optional(),
        // Anamnese - Hábitos
        substanceUse: z.string().optional(),
        sleepAndEating: z.string().optional(),
        sexualAffectiveLife: z.string().optional(),
        // Anamnese - Fatores
        riskFactors: z.string().optional(),
        protectiveFactors: z.string().optional(),
        additionalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { patientId, ...data } = input;
      console.log("[Anamnese Upsert] patientId:", patientId, "dataKeys:", Object.keys(data).length);

      const existing = await db
        .select({ id: anamnese.id })
        .from(anamnese)
        .where(eq(anamnese.patientId, patientId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(anamnese)
          .set(data as any)
          .where(eq(anamnese.patientId, patientId));
      } else {
        await db.insert(anamnese).values({ ...data, patientId, userId: ctx.user.id } as any);
      }
      return { success: true };
    }),

  autoFill: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const patient = await db.select().from(patients).where(eq(patients.id, input.patientId)).limit(1);
      if (!patient.length) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

      const patientData = patient[0];
      const patientContext = [
        patientData.name && `Nome: ${patientData.name}`,
        patientData.email && `Email: ${patientData.email}`,
        patientData.phone && `Telefone: ${patientData.phone}`,
      ].filter(Boolean).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um assistente de psicólogo clínico experiente. Sua tarefa é preencher uma ficha de anamnese com base nos dados do paciente. Retorne um JSON estruturado com campos preenchidos de forma realista e clinicamente apropriada.`,
          },
          {
            role: "user",
            content: `DADOS DO PACIENTE:\n${patientContext}\n\nPreencha os campos da anamnese com informações clínicas realistas. Inclua histórico familiar, pessoal, profissional, hábitos de vida, fatores de risco e proteção.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "anamnese_fill",
            strict: true,
            schema: {
              type: "object",
              properties: {
                mainComplaintDetail: { type: "string" },
                therapeuticGoals: { type: "string" },
                cidCode: { type: "string" },
                cidDescription: { type: "string" },
                therapeuticApproach: { type: "string" },
                familyHistory: { type: "string" },
                personalHistory: { type: "string" },
                previousTreatments: { type: "string" },
                currentDiseaseHistory: { type: "string" },
                psychiatricHistory: { type: "string" },
                childhoodHistory: { type: "string" },
                relationshipHistory: { type: "string" },
                professionalHistory: { type: "string" },
                substanceUse: { type: "string" },
                sleepAndEating: { type: "string" },
                sexualAffectiveLife: { type: "string" },
                riskFactors: { type: "string" },
                protectiveFactors: { type: "string" },
                additionalNotes: { type: "string" },
              },
              required: [],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "IA não retornou resposta" });

      let filled: Record<string, unknown> = {};
      try {
        if (typeof rawContent === "string") {
          let jsonStr = rawContent.trim();
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          filled = JSON.parse(jsonStr);
        }
      } catch (parseErr) {
        console.error("[autoFill Anamnese] Parse error:", parseErr);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao processar resposta da IA" });
      }

      return filled;
    }),
});

// ─── Recordings Router ──────────────────────────────────────────────────────
export const recordingsRouter = router({
  list: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(sessionRecordings)
        .where(
          and(eq(sessionRecordings.patientId, input.patientId), eq(sessionRecordings.userId, ctx.user.id))
        )
        .orderBy(desc(sessionRecordings.createdAt));
    }),

  upload: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        fileName: z.string(),
        mimeType: z.string(),
        audioUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const transcription = await transcribeAudio({
        audioUrl: input.audioUrl,
      });

      const transcriptionText = 'text' in transcription ? transcription.text : "";

      const recording = await db
        .insert(sessionRecordings)
        .values({
          patientId: input.patientId,
          sessionId: input.sessionId || null,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: `recordings/${ctx.user.id}/${Date.now()}`,
          fileUrl: input.audioUrl,
          mimeType: input.mimeType,
          transcription: transcriptionText,
          transcriptionStatus: "done",
          createdAt: new Date(),
        });

      return { id: 0, patientId: input.patientId, fileName: input.fileName };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(sessionRecordings)
        .where(and(eq(sessionRecordings.id, input.id), eq(sessionRecordings.userId, ctx.user.id)));

      return { success: true };
    }),
});

// ─── Timeline Router ────────────────────────────────────────────────────────
export const timelineRouter = router({
  list: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(timelineAnalyses)
        .where(
          and(eq(timelineAnalyses.patientId, input.patientId), eq(timelineAnalyses.userId, ctx.user.id))
        )
        .orderBy(desc(timelineAnalyses.createdAt));
    }),
});
