import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { clinicalNotes, sessions, patients } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateClinicalAnalysisDocx } from "../_core/clinicalAnalysisDocxGenerator";
import { generateClinicalAnalysisPDF } from "../_core/clinicalAnalysisPDFGenerator";
import { storagePut } from "../storage";

interface MoodEvolutionData {
  session: string;
  value: number;
}

interface RiskAssessmentData {
  risk: string;
  value: number;
}

interface RiskDistributionData {
  name: string;
  value: number;
}

interface WellbeingProfileData {
  category: string;
  value: number;
}

interface ClinicalAnalysisData {
  moodEvolution: MoodEvolutionData[];
  riskAssessment: RiskAssessmentData[];
  riskDistribution: RiskDistributionData[];
  wellbeingProfile: WellbeingProfileData[];
  patterns: string[];
  alerts: string[];
  recommendations: string[];
}

/**
 * Parse clinical notes to extract structured data for charts
 */
function parseAnalysisContent(content: string): Partial<ClinicalAnalysisData> {
  const result: Partial<ClinicalAnalysisData> = {
    patterns: [],
    alerts: [],
    recommendations: [],
  };

  // Extract patterns
  const patternsMatch = content.match(/Padrões Identificados[\s\S]*?(?=Pontos de Atenção|$)/i);
  if (patternsMatch) {
    const patterns = patternsMatch[0]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter((line) => line.length > 0);
    result.patterns = patterns.slice(0, 3);
  }

  // Extract alerts/attention points
  const alertsMatch = content.match(/Pontos de Atenção[\s\S]*?(?=Análise de Risco|Orientação|$)/i);
  if (alertsMatch) {
    const alerts = alertsMatch[0]
      .split("\n")
      .filter((line) => line.trim().startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim())
      .filter((line) => line.length > 0);
    result.alerts = alerts.slice(0, 3);
  }

  // Extract recommendations
  const recsMatch = content.match(/Recomendação Imediata[\s\S]*?(?=Análise|$)/i);
  if (recsMatch) {
    const recs = recsMatch[0]
      .split("\n")
      .filter((line) => line.trim().length > 0 && !line.match(/Recomendação Imediata|^-/i))
      .map((line) => line.trim())
      .filter((line) => line.length > 20);
    result.recommendations = recs.slice(0, 3);
  }

  return result;
}

/**
 * Generate mock chart data based on patient sessions
 */
function generateChartData(sessionCount: number): ClinicalAnalysisData {
  // Mood evolution - simulate improvement over sessions
  const moodEvolution: MoodEvolutionData[] = [];
  for (let i = 1; i <= Math.min(sessionCount, 5); i++) {
    moodEvolution.push({
      session: `Sessão ${i}`,
      value: Math.min(10, 3 + i * 1.2 + Math.random() * 2),
    });
  }

  // Risk assessment
  const riskAssessment: RiskAssessmentData[] = [
    { risk: "Suicídio", value: 2 },
    { risk: "Auto-agressão", value: 1 },
    { risk: "Abuso", value: 1 },
  ];

  // Risk distribution
  const riskDistribution: RiskDistributionData[] = [
    { name: "Risco Baixo", value: 60 },
    { name: "Risco Moderado", value: 35 },
    { name: "Risco Alto", value: 5 },
  ];

  // Wellbeing profile
  const wellbeingProfile: WellbeingProfileData[] = [
    { category: "Humor", value: 5 },
    { category: "Sono", value: 4 },
    { category: "Energia", value: 5 },
    { category: "Estabilidade", value: 6 },
    { category: "Relacionamentos", value: 5 },
  ];

  return {
    moodEvolution,
    riskAssessment,
    riskDistribution,
    wellbeingProfile,
    patterns: [
      "Padrão de ansiedade relacionado a situações sociais",
      "Dificuldade em manter sono contínuo",
      "Melhora progressiva no humor após intervenções",
    ],
    alerts: [
      "Histórico de polifarmácia - investigar eficácia medicamentosa",
      "Possível refratariedade ao tratamento anterior",
      "Necessidade de aprofundamento na anamnese",
    ],
    recommendations: [
      "Aprofundamento da anamnese, focando no histórico medicamentoso e na relação entre sintomas físicos e emocionais",
      "Iniciar psicoeducação sobre ansiedade e técnicas de manejo de sintomas",
      "Avaliar necessidade de ajuste medicamentoso com psiquiatra",
    ],
  };
}

export const clinicalAnalysisRouter = router({
  /**
   * Get structured analysis data for charts
   */
  getAnalysisCharts: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        return generateChartData(0);
      }

      try {
        // Get session count for the patient
        const sessionCount = await db
          .select({ id: sessions.id })
          .from(sessions)
          .where(
            and(
              eq(sessions.patientId, input.patientId),
              eq(sessions.userId, ctx.user.id)
            )
          );

        // Get latest clinical notes for analysis
        const notes = await db
          .select()
          .from(clinicalNotes)
          .where(
            and(
              eq(clinicalNotes.patientId, input.patientId),
              eq(clinicalNotes.userId, ctx.user.id)
            )
          )
          .orderBy(desc(clinicalNotes.createdAt))
          .limit(3);

        // Parse notes to extract data
        let analysisData = generateChartData(sessionCount.length);

        if (notes.length > 0) {
          const parsedData = parseAnalysisContent(
            notes.map((n) => n.aiTechnicalFeedback || "").join("\n")
          );
          analysisData = { ...analysisData, ...parsedData };
        }

        return analysisData;
      } catch (error) {
        console.error("Error getting analysis charts:", error);
        return generateChartData(0);
      }
    }),

  /**
   * Get analysis history with structured data
   */
  getAnalysisHistory: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const notes = await db
          .select()
          .from(clinicalNotes)
          .where(
            and(
              eq(clinicalNotes.patientId, input.patientId),
              eq(clinicalNotes.userId, ctx.user.id)
            )
          )
          .orderBy(desc(clinicalNotes.createdAt))
          .limit(10);

        return notes.map((note) => ({
          id: note.id,
          createdAt: note.createdAt,
          sessionId: note.sessionId,
          aiTechnicalFeedback: note.aiTechnicalFeedback,
          moodScore: 5,
        }));
      } catch (error) {
        console.error("Error getting analysis history:", error);
        return [];
      }
    }),

  /**
   * Generate clinical analysis document (Word or PDF)
   */
  generateAnalysisDocument: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        format: z.enum(["docx", "pdf"]),
        noteId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      try {
        // Get the clinical note
        let note;
        if (input.noteId) {
          const notes = await db
            .select()
            .from(clinicalNotes)
            .where(
              and(
                eq(clinicalNotes.id, input.noteId),
                eq(clinicalNotes.patientId, input.patientId),
                eq(clinicalNotes.userId, ctx.user.id)
              )
            );
          note = notes[0];
        } else {
          const notes = await db
            .select()
            .from(clinicalNotes)
            .where(
              and(
                eq(clinicalNotes.patientId, input.patientId),
                eq(clinicalNotes.userId, ctx.user.id)
              )
            )
            .orderBy(desc(clinicalNotes.createdAt))
            .limit(1);
          note = notes[0];
        }

        if (!note) {
          throw new Error("Clinical note not found");
        }

        // Get patient info from database
        let patientData: any = {};
        const patientsData = await db
          .select()
          .from(patients)
          .where(eq(patients.id, input.patientId))
          .limit(1);
        const patient = patientsData[0];
        if (patient) {
          patientData = {
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            birthDate: patient.birthDate,
            cpf: patient.cpf,
            address: patient.address,
          };
        }

        const analysisDate = new Date(note.createdAt).toLocaleDateString("pt-BR");
        const feedback = note.aiTechnicalFeedback || "";

        let result;

        if (input.format === "docx") {
          result = await generateClinicalAnalysisDocx({
            patientName: patientData.name || "Paciente",
            patientId: input.patientId.toString(),
            patientEmail: patientData.email || undefined,
            patientPhone: patientData.phone || undefined,
            patientBirthDate: patientData.birthDate || undefined,
            patientCPF: patientData.cpf || undefined,
            patientAddress: patientData.address || undefined,
            clinicName: "E-Saúde",
            psychologistName: process.env.OWNER_NAME || "Profissional",
            psychologistCRP: "05/85230",
            psychologistSpecialization: "Neuropsicologia",
            analysisDate,
            feedback,
          });
          const filename = `analise_clinica_${input.patientId}_${Date.now()}.docx`;
          return {
            success: true,
            url: result.url,
            key: result.key,
            filename,
            format: input.format,
          } as const;
        } else {
          const pdfData = {
            patientName: patientData.name || "Paciente",
            patientEmail: patientData.email || undefined,
            patientPhone: patientData.phone || undefined,
            patientBirthDate: patientData.birthDate || undefined,
            patientCPF: patientData.cpf || undefined,
            patientAddress: patientData.address || undefined,
            analysisDate: new Date(note.createdAt),
            clinicName: "E-Saúde",
            professionalName: process.env.OWNER_NAME || "Profissional",
            specialization: "Neuropsicologia",
            crp: "05/85230",
            feedback,
            currentState: note.emotionalState?.substring(0, 500) || "",
            interventionTechniques: note.techniquesUsed?.substring(0, 500) || "",
            plannedInterventions: note.plannedInterventions?.substring(0, 500) || "",
            homeAssignment: note.homework?.substring(0, 500) || "",
            therapyPlans: note.therapeuticPlan?.substring(0, 500) || "",
            evaluationProgress: note.goalsProgress?.substring(0, 500) || "",
            clinicalInsights: note.observedInsights?.substring(0, 500) || "",
            observedResistances: note.observedResistances?.substring(0, 500) || "",
            recommendations: note.aiSuggestions?.substring(0, 500) || "",
          };

          const documentBuffer = await generateClinicalAnalysisPDF(pdfData);
          const filename = `analise_clinica_${input.patientId}_${Date.now()}.pdf`;
          const mimeType = "application/pdf";

          const { url, key } = await storagePut(
            `clinical-analysis/${ctx.user.id}/${filename}`,
            documentBuffer,
            mimeType
          );

          return {
            success: true,
            url,
            key,
            filename,
            format: input.format,
          } as const;
        }
      } catch (error) {
        console.error("Error generating analysis document:", error);
        throw error;
      }
    }),
});
