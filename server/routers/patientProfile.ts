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
        .where(eq(anamnese.patientId, input.patientId))
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
      // Retornar TODAS as gravacoes do paciente
      return db
        .select()
        .from(sessionRecordings)
        .where(eq(sessionRecordings.patientId, input.patientId))
        .orderBy(desc(sessionRecordings.createdAt));
    }),

  upload: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        fileName: z.string(),
        mimeType: z.string(),
        fileBase64: z.string(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Converter base64 para Buffer
      const buffer = Buffer.from(input.fileBase64, 'base64');
      
      // Sanitizar nome do arquivo (remover caracteres não-ASCII)
      const sanitizedFileName = input.fileName
        .replace(/[^\x00-\x7F]/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 255);
      
      // Upload para S3
      const { storagePut } = await import('../storage.js');
      const fileKey = `recordings/${ctx.user.id}/${Date.now()}-${sanitizedFileName}`;
      const { url: audioUrl } = await storagePut(fileKey, buffer, input.mimeType);

      // Transcrever áudio
      // Converter URL relativa para absoluta se necessário
      const absoluteAudioUrl = audioUrl.startsWith('http') 
        ? audioUrl 
        : `https://sistemaclinicaapp.manus.space${audioUrl}`;
      
      console.log('[Recording Upload] Audio URL:', absoluteAudioUrl);
      const transcription = await transcribeAudio({
        audioUrl: absoluteAudioUrl,
      });
      console.log('[Recording Upload] Transcription result:', transcription);

      // Verificar se houve erro na transcrição
      let transcriptionText = "";
      let transcriptionStatus: "done" | "error" | "pending" | "processing" = "done";
      
      if ('error' in transcription) {
        // Houve erro na transcrição
        transcriptionStatus = "error";
        console.error(`[Transcription Error] ${transcription.error}:`, transcription.details);
      } else {
        // Sucesso na transcrição
        transcriptionText = transcription.text || "";
      }

      const result = await db
        .insert(sessionRecordings)
        .values({
          patientId: input.patientId,
          sessionId: input.sessionId || null,
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: fileKey,
          fileUrl: audioUrl,
          mimeType: input.mimeType,
          transcription: transcriptionText,
          transcriptionStatus: transcriptionStatus,
          createdAt: new Date(),
        });

      // Buscar o registro criado para obter o ID
      const recording = await db
        .select()
        .from(sessionRecordings)
        .where(eq(sessionRecordings.fileKey, fileKey))
        .limit(1);

      return { id: recording[0]?.id || 0, patientId: input.patientId, fileName: input.fileName, fileUrl: audioUrl };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .delete(sessionRecordings)
        .where(eq(sessionRecordings.id, input.id));

      return { success: true };
    }),
  transcribe: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const recording = await db
        .select()
        .from(sessionRecordings)
        .where(eq(sessionRecordings.id, input.recordingId))
        .limit(1);

      if (!recording || recording.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recording not found" });
      }

      const rec = recording[0];
      if (!rec.fileUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Recording has no file URL" });
      }

      // Converter URL relativa para absoluta se necessário
      const absoluteAudioUrl = rec.fileUrl.startsWith('http')
        ? rec.fileUrl
        : `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://sistemaclinicaapp.manus.space'}${rec.fileUrl}`;

      const { transcribeAudio } = await import('../_core/voiceTranscription');
      const transcription = await transcribeAudio({
        audioUrl: absoluteAudioUrl,
      });

      let transcriptionText = "";
      let transcriptionStatus: "done" | "error" | "pending" | "processing" = "done";

      if ('error' in transcription) {
        transcriptionStatus = "error";
        console.error(`[Transcription Error] ${transcription.error}:`, transcription.details);
      } else {
        transcriptionText = transcription.text || "";
      }

      // Atualizar o registro com a transcrição
      await db
        .update(sessionRecordings)
        .set({
          transcription: transcriptionText,
          transcriptionStatus: transcriptionStatus,
        })
        .where(eq(sessionRecordings.id, input.recordingId));

      return {
        success: true,
        transcription: transcriptionText,
        status: transcriptionStatus,
      };
    }),

  generateTranscriptionPdf: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const recording = await db.select().from(sessionRecordings).where(eq(sessionRecordings.id, input.recordingId)).limit(1);
      if (!recording || recording.length === 0) throw new Error('Recording not found');
      
      const rec = recording[0];
      if (!rec.transcription) throw new Error('No transcription available');
      
      const PDFKit = require('pdfkit');
      
      const doc = new PDFKit();
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      doc.fontSize(16).text('Transcrição da Gravação', { align: 'center' });
      doc.fontSize(11).text(`Arquivo: ${rec.fileName}`, { align: 'left' });
      doc.text(`Data: ${new Date(rec.createdAt).toLocaleDateString('pt-BR')}`, { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(11).text(rec.transcription, { align: 'justify' });
      
      doc.end();
      
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('finish', () => resolve(Buffer.concat(chunks)));
      });
      
      const { storagePut } = await import('../storage');
      const { url } = await storagePut(
        `transcriptions/${rec.id}_${Date.now()}.pdf`,
        pdfBuffer,
        'application/pdf'
      );
      
      return { pdfUrl: url };
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
        .where(eq(timelineAnalyses.patientId, input.patientId))
        .orderBy(desc(timelineAnalyses.createdAt));
    }),
});
