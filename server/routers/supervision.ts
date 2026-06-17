import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const supervisionRouter = router({
  analyzeRecordingSupervision: protectedProcedure
    .input(
      z.object({
        recordingId: z.number(),
        transcription: z.string().min(10),
        patientName: z.string().optional(),
        sessionDate: z.date().optional(),
        chiefComplaint: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const supervisionPrompt = `Você é um supervisor clínico experiente analisando uma sessão de psicoterapia.

TRANSCRIÇÃO DA SESSÃO:
${input.transcription}

CONTEXTO:
- Paciente: ${input.patientName || "Não informado"}
- Data: ${input.sessionDate?.toLocaleDateString("pt-BR") || "Não informada"}
- Queixa Principal: ${input.chiefComplaint || "Não informada"}

ANALISE COMPLETA DA PERFORMANCE DO PSICÓLOGO:

1. **QUALIDADE DAS PERGUNTAS E INTERVENÇÕES**
   - Avalie a clareza e relevância das perguntas
   - Identifique se as perguntas são abertas ou fechadas
   - Analise se as intervenções foram oportunas

2. **TÉCNICAS CLÍNICAS IDENTIFICADAS**
   - Quais técnicas foram utilizadas?
   - Foram aplicadas corretamente?
   - Houve integração de múltiplas abordagens?

3. **RAPPORT E EMPATIA**
   - Qualidade do vínculo terapêutico
   - Demonstração de empatia
   - Validação das emoções do paciente

4. **MANEJO DO CONTEÚDO CLÍNICO**
   - Identificação de fatores de risco
   - Reconhecimento de padrões comportamentais
   - Exploração adequada de temas importantes

5. **ESTRUTURA E FLUXO DA SESSÃO**
   - Início, desenvolvimento e encerramento
   - Transições entre temas
   - Foco mantido nos objetivos

6. **PONTOS FORTES IDENTIFICADOS**
   - O que o psicólogo fez muito bem?
   - Momentos de excelência clínica

7. **ÁREAS DE MELHORIA**
   - Onde houve oportunidades perdidas?
   - Técnicas que poderiam ter sido melhor aplicadas

8. **RECOMENDAÇÕES PRÁTICAS**
   - Sugestões específicas para próximas sessões
   - Técnicas alternativas a considerar

Forneça uma análise estruturada, profissional e construtiva.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Você é um supervisor clínico experiente em psicoterapia. Sua análise é profissional, construtiva e focada no desenvolvimento técnico do terapeuta.",
            },
            {
              role: "user",
              content: supervisionPrompt,
            },
          ],
        });

        const analysisContent = response.choices[0]?.message?.content;

        if (!analysisContent) {
          throw new Error("Falha ao gerar análise de supervisão");
        }

        return {
          success: true,
          analysis: analysisContent,
          recordingId: input.recordingId,
          analyzedAt: new Date(),
        };
      } catch (error) {
        console.error("[Supervision] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao analisar supervisão: " + (error instanceof Error ? error.message : "Desconhecido"),
        });
      }
    }),
});
