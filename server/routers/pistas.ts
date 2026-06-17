/**
 * Pistas Router - AI Treatment Suggestions
 * 
 * Handles AI-powered treatment suggestions based on patient history,
 * clinical notes, and session data.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const pistasRouter = router({
  generateTreatmentSuggestions: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { getPatientByIdShared, getClinicalNotesByPatient, getSessionsShared } = await import("../db");
      const { invokeLLM } = await import("../_core/llm");

      // Get patient data
      const patient = await getPatientByIdShared(input.patientId, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

      // Get clinical history
      const clinicalNotes = await getClinicalNotesByPatient(input.patientId, ctx.user.id);
      const sessions = await getSessionsShared(ctx.user.id, input.patientId);

      // Prepare context for LLM
      const patientContext = `
        Paciente: ${patient.name}
        Queixa Principal: ${patient.mainComplaint || "Não informada"}
        Histórico Médico: ${patient.medicalHistory || "Não informado"}
        Medicações: ${patient.medications || "Não informadas"}
        
        Últimas Notas Clínicas:
        ${clinicalNotes.slice(-5).map(n => `- ${new Date(n.createdAt).toLocaleDateString()}: ${n.content}`).join("\n")}
        
        Total de Sessões: ${sessions.length}
        Última Sessão: ${sessions[sessions.length - 1]?.scheduledAt ? new Date(sessions[sessions.length - 1].scheduledAt).toLocaleDateString() : "Não agendada"}
      `;

      // Call LLM for suggestions
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente de IA especializado em psicologia clínica. Analise o histórico do paciente e sugira os próximos passos recomendados para o tratamento. Seja específico, prático e baseado em boas práticas clínicas.",
          },
          {
            role: "user",
            content: `Com base no seguinte histórico do paciente, sugira os próximos passos recomendados para o tratamento:\n\n${patientContext}`,
          },
        ],
      });

      const suggestions = response.choices[0]?.message?.content || "Não foi possível gerar sugestões";

      return { suggestions };
    }),
});
