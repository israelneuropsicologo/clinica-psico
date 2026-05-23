// @ts-nocheck
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

      const existing = await db
        .select({ id: anamnese.id })
        .from(anamnese)
        .where(and(eq(anamnese.patientId, patientId), eq(anamnese.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(anamnese)
          .set(data)
          .where(and(eq(anamnese.patientId, patientId), eq(anamnese.userId, ctx.user.id)));
      } else {
        await db.insert(anamnese).values({ ...data, patientId, userId: ctx.user.id });
      }
      return { success: true };
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
          and(
            eq(sessionRecordings.patientId, input.patientId),
            eq(sessionRecordings.userId, ctx.user.id)
          )
        )
        .orderBy(desc(sessionRecordings.createdAt));
    }),

  upload: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        sessionId: z.number().optional(),
        fileName: z.string(),
        fileBase64: z.string(),
        mimeType: z.string(),
        fileSize: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const buffer = Buffer.from(input.fileBase64, "base64");
      // Sanitizar nome do arquivo para conter apenas ASCII (S3 presigner requer ASCII)
      const sanitizedFileName = input.fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
      const fileKey = `recordings/${ctx.user.id}/${input.patientId}/${Date.now()}-${sanitizedFileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      const result = await db.insert(sessionRecordings).values({
        userId: ctx.user.id,
        patientId: input.patientId,
        sessionId: input.sessionId,
        fileName: sanitizedFileName,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        transcriptionStatus: "pending",
      });

      const insertId = (result[0] as { insertId: number }).insertId;
      
      // Iniciar transcricao automatica em background
      (async () => {
        try {
          await db
            .update(sessionRecordings)
            .set({ transcriptionStatus: 'processing' })
            .where(eq(sessionRecordings.id, insertId));

          const signedUrl = await storageGetSignedUrl(fileKey);
          const transcriptionResult = await transcribeAudio({
            audioUrl: signedUrl,
            language: 'pt',
            prompt: 'Transcricao de sessao de psicoterapia',
          });

          if ('error' in transcriptionResult) {
            await db
              .update(sessionRecordings)
              .set({ transcriptionStatus: 'error' })
              .where(eq(sessionRecordings.id, insertId));
          } else {
            await db
              .update(sessionRecordings)
              .set({ transcription: transcriptionResult.text, transcriptionStatus: 'done' })
              .where(eq(sessionRecordings.id, insertId));
          }
        } catch (error) {
          console.error('Erro na transcricao automatica:', error);
          await db
            .update(sessionRecordings)
            .set({ transcriptionStatus: 'error' })
            .where(eq(sessionRecordings.id, insertId))
            .catch(() => {});
        }
      })();

      return { id: insertId, fileUrl: url };
    }),

  transcribe: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [recording] = await db
        .select()
        .from(sessionRecordings)
        .where(
          and(
            eq(sessionRecordings.id, input.recordingId),
            eq(sessionRecordings.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!recording) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(sessionRecordings)
        .set({ transcriptionStatus: "processing" })
        .where(eq(sessionRecordings.id, input.recordingId));

      try {
        // Obter URL pública assinada para o Whisper (fileUrl é relativo /manus-storage/...)
        const fileKey = recording.fileKey ?? recording.fileUrl.replace(/^\/manus-storage\//, "");
        const signedUrl = await storageGetSignedUrl(fileKey);

        const result = await transcribeAudio({
          audioUrl: signedUrl,
          language: "pt",
          prompt: "Transcrição de sessão de psicoterapia",
        });

        await db
          .update(sessionRecordings)
          .set({ transcription: result.text, transcriptionStatus: "done" })
          .where(eq(sessionRecordings.id, input.recordingId));

        return { transcription: result.text };
      } catch {
        await db
          .update(sessionRecordings)
          .set({ transcriptionStatus: "error" })
          .where(eq(sessionRecordings.id, input.recordingId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha na transcrição" });
      }
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [recording] = await db
        .select()
        .from(sessionRecordings)
        .where(
          and(
            eq(sessionRecordings.id, input.recordingId),
            eq(sessionRecordings.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!recording) throw new TRPCError({ code: "NOT_FOUND" });
      
      const signedUrl = await storageGetSignedUrl(recording.fileKey, 3600); // 1 hora de validade
      return { url: signedUrl, fileName: recording.fileName };
    }),

  delete: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .delete(sessionRecordings)
        .where(
          and(
            eq(sessionRecordings.id, input.recordingId),
            eq(sessionRecordings.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  generateSupervision: protectedProcedure
    .input(z.object({ recordingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [recording] = await db
        .select()
        .from(sessionRecordings)
        .where(
          and(
            eq(sessionRecordings.id, input.recordingId),
            eq(sessionRecordings.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!recording) throw new TRPCError({ code: "NOT_FOUND" });
      if (!recording.transcription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "É necessário transcrever o áudio antes de gerar a supervisão.",
        });
      }

      // Buscar dados do paciente para contexto
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, recording.patientId))
        .limit(1);

      const prompt = `Você é um psicólogo supervisor clínico sênior com vasta experiência em supervisão de casos. 
Analise a transcrição da sessão abaixo e forneça uma supervisão clínica detalhada e estruturada.

PACIENTE: ${patient?.name ?? "Não identificado"}
QUEIXA PRINCIPAL: ${patient?.mainComplaint ?? "Não informada"}

TRANSCRIÇÃO DA SESSÃO:
${recording.transcription}

Forneça uma supervisão clínica completa com:

## 1. ANÁLISE DA SESSÃO
Descreva o que observou na dinâmica da sessão, o estado emocional do paciente, os temas centrais abordados e a qualidade do vínculo terapêutico.

## 2. PONTOS POSITIVOS DO TERAPEUTA
Destaque o que o terapeuta fez bem nesta sessão — intervenções eficazes, empatia demonstrada, técnicas bem aplicadas.

## 3. PONTOS DE ATENÇÃO E OPORTUNIDADES PERDIDAS
Identifique momentos em que o terapeuta poderia ter intervindo de forma diferente, perguntas que poderiam ter sido feitas, temas que não foram explorados adequadamente.

## 4. HIPÓTESES CLÍNICAS
Apresente hipóteses diagnósticas e dinâmicas baseadas no conteúdo da sessão.

## 5. PLANO DE AÇÃO — PRÓXIMA SESSÃO
Oriente o terapeuta com um passo a passo detalhado do que fazer na próxima sessão:
- Objetivos prioritários
- Abordagem recomendada
- Técnicas específicas a utilizar
- Perguntas-chave para explorar
- O que evitar

## 6. RECOMENDAÇÕES DE DESENVOLVIMENTO PROFISSIONAL
Sugestões de leitura, técnicas para aprimorar, aspectos da formação a desenvolver.

Seja específico, didático e construtivo. Use linguagem técnica mas acessível.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um psicólogo supervisor clínico sênior. Forneça supervisão clínica detalhada, construtiva e baseada em evidências. Responda em português do Brasil.",
          },
          { role: "user", content: prompt },
        ],
      });

      const supervision = response.choices[0]?.message?.content ?? "";

      // Salvar supervisão na gravação
      await db
        .update(sessionRecordings)
        .set({ supervision } as Record<string, unknown>)
        .where(eq(sessionRecordings.id, input.recordingId));

      return { supervision };
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
          and(
            eq(timelineAnalyses.patientId, input.patientId),
            eq(timelineAnalyses.userId, ctx.user.id)
          )
        )
        .orderBy(desc(timelineAnalyses.createdAt))
        .limit(10);
    }),

  generate: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Buscar dados do paciente
      const [patient] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, input.patientId))
        .limit(1);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      // Buscar sessões e prontuários
      const allSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, input.patientId))
        .orderBy(desc(sessions.scheduledAt))
        .limit(20);

      const allNotes = await db
        .select()
        .from(clinicalNotes)
        .where(eq(clinicalNotes.patientId, input.patientId))
        .orderBy(desc(clinicalNotes.createdAt))
        .limit(20);

      const sessionCount = allSessions.length;

      // Montar contexto clínico
      const sessionsSummary = allSessions
        .map((s, i) => {
          const note = allNotes.find((n) => n.sessionId === s.id);
          const date = new Date(s.scheduledAt).toLocaleDateString("pt-BR");
          return `Sessão ${i + 1} (${date}): ${note?.content ?? "Sem prontuário registrado"}. Objetivos: ${note?.goals ?? "—"}. Intervenções: ${note?.interventions ?? "—"}. Progresso: ${note?.progressRating ?? "—"}/10.`;
        })
        .join("\n");

      const prompt = `Você é um supervisor clínico especializado em psicologia. Analise o histórico clínico completo do paciente e gere uma análise estruturada em JSON.

DADOS DO PACIENTE:
Nome: ${patient.name}
Queixa principal: ${patient.mainComplaint ?? "Não informada"}
Medicamentos: ${patient.medications ?? "Não informado"}
Total de sessões: ${sessionCount}

HISTÓRICO DE SESSÕES:
${sessionsSummary || "Nenhuma sessão registrada"}

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "globalAnalysis": {
    "summary": "Texto do resumo global (2-3 parágrafos)",
    "identifiedPatterns": ["padrão 1", "padrão 2", "padrão 3"],
    "concreteProgress": ["progresso 1", "progresso 2"],
    "attentionPoints": ["ponto 1", "ponto 2", "ponto 3"],
    "synthesis": "Texto de síntese (1 parágrafo)"
  },
  "lastSessionAnalysis": {
    "summary": "Análise da última sessão (1-2 parágrafos)",
    "clinicalObservations": ["obs 1", "obs 2"],
    "emotionalState": "Descrição do estado emocional",
    "riskAnalysis": "Análise de risco",
    "comparativeEvolution": "Evolução comparativa"
  },
  "nextSessionGuidance": {
    "suggestedFocus": "Foco sugerido para próxima sessão",
    "themesToReturn": ["tema 1", "tema 2", "tema 3"],
    "suggestedQuestions": ["pergunta 1?", "pergunta 2?", "pergunta 3?"],
    "recommendedTechniques": ["técnica 1", "técnica 2"],
    "clinicalAlerts": ["alerta 1", "alerta 2"],
    "immediateRecommendation": "Recomendação imediata"
  },
  "sufferingEvolution": [
    ${allSessions.slice(0, 10).map((s, i) => {
      const note = allNotes.find((n) => n.sessionId === s.id);
      const date = new Date(s.scheduledAt).toLocaleDateString("pt-BR");
      return `{"session": ${i + 1}, "date": "${date}", "level": ${note?.progressRating ?? 5}}`;
    }).join(",\n    ")}
  ]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "Você é um supervisor clínico especializado. Responda APENAS com JSON válido, sem markdown, sem texto adicional." },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response.choices[0]?.message?.content ?? "{}";
      let analysisData: Record<string, unknown>;
      try {
        analysisData = JSON.parse(rawContent);
      } catch {
        // Tentar extrair JSON do texto
        const match = rawContent.match(/\{[\s\S]*\}/);
        analysisData = match ? JSON.parse(match[0]) : {};
      }

      // Salvar análise global
      await db.insert(timelineAnalyses).values({
        userId: ctx.user.id,
        patientId: input.patientId,
        analysisType: "global",
        content: JSON.stringify(analysisData),
        sessionCount,
      });

      return analysisData;
    }),
});
