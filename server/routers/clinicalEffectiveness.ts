/**
 * Clinical Effectiveness Router
 * 
 * Gerencia métricas de efetividade clínica:
 * - Efetividade de técnicas por paciente
 * - Taxa de conversão lead → paciente
 * - Retenção de pacientes
 * - Análise estratégica mensal
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createOrUpdateTechniqueEffectiveness,
  getTechniqueEffectiveness,
  createOrUpdateConversionMetrics,
  getConversionMetrics,
  createOrUpdateRetentionMetrics,
  getRetentionMetrics,
  createOrUpdateClinicalStrategyAnalytics,
  getClinicalStrategyAnalytics,
} from "../db";

export const clinicalEffectivenessRouter = router({
  /**
   * Registrar efetividade de uma técnica para um paciente
   */
  recordTechniqueEffectiveness: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        techniqueId: z.number(),
        sessionId: z.number().optional(),
        initialScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
        applicationsCount: z.number().min(1).default(1),
        averageSessionDuration: z.number().optional(),
        patientEngagement: z.enum(["low", "medium", "high"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createOrUpdateTechniqueEffectiveness(
          ctx.user.id,
          input.patientId,
          input.techniqueId,
          {
            sessionId: input.sessionId,
            initialScore: input.initialScore,
            finalScore: input.finalScore,
            applicationsCount: input.applicationsCount,
            averageSessionDuration: input.averageSessionDuration,
            patientEngagement: input.patientEngagement,
            notes: input.notes,
          }
        );

        return {
          success: true,
          message: "Efetividade registrada com sucesso",
        };
      } catch (error) {
        console.error("[Clinical Effectiveness] Error recording technique effectiveness:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar efetividade",
        });
      }
    }),

  /**
   * Obter efetividade de técnicas para um paciente
   */
  getTechniqueEffectiveness: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const data = await getTechniqueEffectiveness(ctx.user.id, input.patientId);
        return data;
      } catch (error) {
        console.error("[Clinical Effectiveness] Error fetching technique effectiveness:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar efetividade",
        });
      }
    }),

  /**
   * Registrar ou atualizar métricas de conversão
   */
  recordConversionMetrics: protectedProcedure
    .input(
      z.object({
        leadSource: z.enum(["chatbot", "direct_booking", "manual", "import", "website", "referral", "other"]),
        month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
        totalLeads: z.number().min(0),
        convertedLeads: z.number().min(0),
        averageDaysToConversion: z.number().optional(),
        retentionRate: z.number().min(0).max(100).optional(),
        averageSessionsPerPatient: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createOrUpdateConversionMetrics(
          ctx.user.id,
          input.leadSource,
          input.month,
          {
            totalLeads: input.totalLeads,
            convertedLeads: input.convertedLeads,
            averageDaysToConversion: input.averageDaysToConversion,
            retentionRate: input.retentionRate,
            averageSessionsPerPatient: input.averageSessionsPerPatient,
          }
        );

        return {
          success: true,
          message: "Métricas de conversão registradas",
        };
      } catch (error) {
        console.error("[Clinical Effectiveness] Error recording conversion metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar métricas de conversão",
        });
      }
    }),

  /**
   * Obter métricas de conversão do usuário
   */
  getConversionMetrics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const data = await getConversionMetrics(ctx.user.id);
      return data;
    } catch (error) {
      console.error("[Clinical Effectiveness] Error fetching conversion metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar métricas de conversão",
      });
    }
  }),

  /**
   * Registrar ou atualizar métricas de retenção
   */
  recordRetentionMetrics: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        startDate: z.date(),
        lastSessionDate: z.date().optional(),
        totalSessions: z.number().min(0),
        completedSessions: z.number().min(0),
        missedSessions: z.number().min(0),
        status: z.enum(["active", "paused", "completed", "abandoned"]),
        abandonmentReason: z.string().optional(),
        riskScore: z.number().min(0).max(100).optional(),
        predictedChurnDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createOrUpdateRetentionMetrics(
          ctx.user.id,
          input.patientId,
          {
            startDate: input.startDate,
            lastSessionDate: input.lastSessionDate,
            totalSessions: input.totalSessions,
            completedSessions: input.completedSessions,
            missedSessions: input.missedSessions,
            status: input.status,
            abandonmentReason: input.abandonmentReason,
            riskScore: input.riskScore,
            predictedChurnDate: input.predictedChurnDate,
          }
        );

        return {
          success: true,
          message: "Métricas de retenção registradas",
        };
      } catch (error) {
        console.error("[Clinical Effectiveness] Error recording retention metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar métricas de retenção",
        });
      }
    }),

  /**
   * Obter métricas de retenção de um paciente
   */
  getRetentionMetrics: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const data = await getRetentionMetrics(ctx.user.id, input.patientId);
        return data;
      } catch (error) {
        console.error("[Clinical Effectiveness] Error fetching retention metrics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao buscar métricas de retenção",
        });
      }
    }),

  /**
   * Registrar ou atualizar análise estratégica clínica
   */
  recordStrategyAnalytics: protectedProcedure
    .input(
      z.object({
        period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
        totalPatients: z.number().min(0),
        activePatients: z.number().min(0),
        newPatients: z.number().min(0),
        averageEffectiveness: z.number().min(0).max(100).optional(),
        improvementRate: z.number().min(0).max(100).optional(),
        conversionRate: z.number().min(0).max(100).optional(),
        retentionRate: z.number().min(0).max(100).optional(),
        topTechnique: z.string().optional(),
        topTechniqueEffectiveness: z.number().min(0).max(100).optional(),
        topLeadSource: z.string().optional(),
        topLeadSourceConversion: z.number().min(0).max(100).optional(),
        recommendations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createOrUpdateClinicalStrategyAnalytics(
          ctx.user.id,
          input.period,
          {
            totalPatients: input.totalPatients,
            activePatients: input.activePatients,
            newPatients: input.newPatients,
            averageEffectiveness: input.averageEffectiveness,
            improvementRate: input.improvementRate,
            conversionRate: input.conversionRate,
            retentionRate: input.retentionRate,
            topTechnique: input.topTechnique,
            topTechniqueEffectiveness: input.topTechniqueEffectiveness,
            topLeadSource: input.topLeadSource,
            topLeadSourceConversion: input.topLeadSourceConversion,
            recommendations: input.recommendations,
          }
        );

        return {
          success: true,
          message: "Análise estratégica registrada",
        };
      } catch (error) {
        console.error("[Clinical Effectiveness] Error recording strategy analytics:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao registrar análise estratégica",
        });
      }
    }),

  /**
   * Obter análise estratégica clínica do usuário
   */
  getStrategyAnalytics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const data = await getClinicalStrategyAnalytics(ctx.user.id);
      return data;
    } catch (error) {
      console.error("[Clinical Effectiveness] Error fetching strategy analytics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao buscar análise estratégica",
      });
    }
  }),

  /**
   * Calcular resumo de efetividade clínica
   * Agrega dados de todas as métricas para gerar insights
   */
  getEffectivenessSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const conversionMetrics = await getConversionMetrics(ctx.user.id);
      const strategyAnalytics = await getClinicalStrategyAnalytics(ctx.user.id);

      // Calcular médias
      const avgConversionRate =
        conversionMetrics.length > 0
          ? conversionMetrics.reduce((sum: number, m: any) => sum + (Number(m.conversionRate) || 0), 0) / conversionMetrics.length
          : 0;

      const avgRetentionRate =
        conversionMetrics.length > 0
          ? conversionMetrics.reduce((sum: number, m: any) => sum + (Number(m.retentionRate) || 0), 0) / conversionMetrics.length
          : 0;

      const latestAnalytics = strategyAnalytics[0];

      return {
        summary: {
          averageConversionRate: Math.round(avgConversionRate * 100) / 100,
          averageRetentionRate: Math.round(avgRetentionRate * 100) / 100,
          totalMetricsRecorded: conversionMetrics.length,
          lastAnalysisDate: latestAnalytics?.createdAt || null,
        },
        latestAnalytics,
        conversionBySource: conversionMetrics.map((m: any) => ({
          source: m.leadSource,
          conversionRate: m.conversionRate,
          totalLeads: m.totalLeads,
          convertedLeads: m.convertedLeads,
        })),
      };
    } catch (error) {
      console.error("[Clinical Effectiveness] Error calculating summary:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao calcular resumo",
      });
    }
  }),
});
