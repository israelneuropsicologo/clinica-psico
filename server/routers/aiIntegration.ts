/**
 * AI Integration Router
 * Combines existing AI resources (Pistas, Timeline, Supervision) with the Analytics Dashboard
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { patients, sessions, clinicalNotes } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const aiIntegrationRouter = router({
  /**
   * Get integrated AI insights for a patient
   * Combines: treatment suggestions (pistas), clinical timeline, and supervision feedback
   */
  getPatientAIInsights: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify patient belongs to user
      const patient = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, input.patientId), eq(patients.userId, ctx.user.id)))
        .limit(1);

      if (patient.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      }

      // Get recent sessions and clinical notes
      const recentSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, input.patientId))
        .limit(10);

      const recentNotes = await db
        .select()
        .from(clinicalNotes)
        .where(eq(clinicalNotes.patientId, input.patientId))
        .limit(10);

      // Prepare context for LLM
      const patientContext = `
        Paciente: ${patient[0].name}
        Queixa Principal: ${patient[0].mainComplaint || "Não informada"}
        Status: ${patient[0].status}
        
        Últimas Sessões: ${recentSessions.length}
        Últimas Notas Clínicas: ${recentNotes.length}
        
        Histórico Médico: ${patient[0].medicalHistory || "Não informado"}
        Medicações: ${patient[0].medications || "Não informadas"}
      `;

      // Generate integrated AI insights
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente de IA especializado em psicologia clínica. Analise o histórico do paciente e forneça insights integrados sobre tratamento, evolução clínica e recomendações de supervisão.",
          },
          {
            role: "user",
            content: `Com base no seguinte histórico do paciente, forneça insights integrados de IA:\n\n${patientContext}`,
          },
        ],
      });

      const insights = response.choices[0]?.message?.content || "Não foi possível gerar insights";

      return {
        patientName: patient[0].name,
        insights,
        sessionsCount: recentSessions.length,
        notesCount: recentNotes.length,
        lastSessionDate: recentSessions[0]?.scheduledAt || null,
        lastNoteDate: recentNotes[0]?.createdAt || null,
      };
    }),

  /**
   * Get AI recommendations for session planning
   */
  getSessionPlanningRecommendations: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify patient belongs to user
      const patient = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, input.patientId), eq(patients.userId, ctx.user.id)))
        .limit(1);

      if (patient.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      }

      // Get recent clinical notes to understand current state
      const recentNotes = await db
        .select()
        .from(clinicalNotes)
        .where(eq(clinicalNotes.patientId, input.patientId))
        .limit(5);

      // Extract key themes from recent notes
      const notesContent = recentNotes
        .map((n) => n.content || "")
        .join("\n");

      const prompt = `Você é um psicólogo clínico experiente. Com base nas notas clínicas recentes do paciente, forneça recomendações específicas para a próxima sessão:

PACIENTE: ${patient[0].name}
QUEIXA PRINCIPAL: ${patient[0].mainComplaint || "Não informada"}

NOTAS CLÍNICAS RECENTES:
${notesContent || "Nenhuma nota disponível"}

Forneça recomendações em formato estruturado:
1. Foco principal da próxima sessão
2. Técnicas recomendadas
3. Temas a explorar
4. Alertas clínicos
5. Métricas de progresso a monitorar`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um psicólogo clínico especializado em planejamento de sessões. Forneça recomendações práticas e baseadas em evidências.",
          },
          { role: "user", content: prompt },
        ],
      });

      const recommendations = response.choices[0]?.message?.content || "Não foi possível gerar recomendações";

      return {
        patientName: patient[0].name,
        recommendations,
        lastNotesCount: recentNotes.length,
      };
    }),

  /**
   * Get comparative analysis between multiple patients
   * Useful for identifying patterns and best practices
   */
  getComparativeAnalysis: protectedProcedure
    .input(z.object({ patientIds: z.array(z.number()).min(2).max(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify all patients belong to user
      const patientsList = await db
        .select()
        .from(patients)
        .where(and(
          eq(patients.userId, ctx.user.id)
        ));

      const validPatients = patientsList.filter((p) => input.patientIds.includes(p.id));

      if (validPatients.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pelo menos 2 pacientes válidos são necessários" });
      }

      // Get data for each patient
      const patientData = await Promise.all(
        validPatients.map(async (patient) => {
          const patientSessions = await db
            .select()
            .from(sessions)
            .where(eq(sessions.patientId, patient.id));

          const patientNotes = await db
            .select()
            .from(clinicalNotes)
            .where(eq(clinicalNotes.patientId, patient.id));

          return {
            name: patient.name,
            sessionsCount: patientSessions.length,
            notesCount: patientNotes.length,
            mainComplaint: patient.mainComplaint,
            status: patient.status,
          };
        })
      );

      // Generate comparative analysis
      const context = patientData
        .map((p) => `- ${p.name}: ${p.sessionsCount} sessões, ${p.notesCount} notas, Status: ${p.status}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um psicólogo clínico com expertise em análise comparativa de casos. Forneça insights sobre padrões, progressos e recomendações.",
          },
          {
            role: "user",
            content: `Analise comparativamente os seguintes pacientes:\n\n${context}\n\nForneça insights sobre:\n1. Padrões comuns\n2. Diferenças significativas\n3. Boas práticas observadas\n4. Recomendações para otimizar tratamento`,
          },
        ],
      });

      const analysis = response.choices[0]?.message?.content || "Não foi possível gerar análise comparativa";

      return {
        patientsAnalyzed: validPatients.length,
        patientData,
        analysis,
      };
    }),

  /**
   * Get AI-powered clinical supervision summary
   * Aggregates supervision feedback from multiple sessions
   */
  getSupervisionSummary: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify patient belongs to user
      const patient = await db
        .select()
        .from(patients)
        .where(and(eq(patients.id, input.patientId), eq(patients.userId, ctx.user.id)))
        .limit(1);

      if (patient.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });
      }

      // Get clinical notes with supervision feedback
      const notesWithSupervision = await db
        .select()
        .from(clinicalNotes)
        .where(and(
          eq(clinicalNotes.patientId, input.patientId),
          // Filter notes that have supervision feedback
        ))
        .limit(10);

      // Extract supervision themes
      const supervisionThemes = notesWithSupervision
        .filter((n) => n.supervisionNotes)
        .map((n) => n.supervisionNotes)
        .join("\n");

      if (!supervisionThemes) {
        return {
          patientName: patient[0].name,
          summary: "Nenhum feedback de supervisão disponível ainda.",
          recommendations: [],
        };
      }

      // Generate supervision summary
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um supervisor clínico sênior. Resuma os temas principais de supervisão e forneça recomendações de desenvolvimento profissional.",
          },
          {
            role: "user",
            content: `Com base nos seguintes feedbacks de supervisão, resuma os temas principais e forneça recomendações:\n\n${supervisionThemes}`,
          },
        ],
      });

      const summary = response.choices[0]?.message?.content || "Não foi possível gerar resumo de supervisão";

      return {
        patientName: patient[0].name,
        summary,
        notesWithSupervision: notesWithSupervision.length,
      };
    }),
});

export type AIIntegrationRouter = typeof aiIntegrationRouter;
