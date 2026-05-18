/**
 * Advanced AI Features Router
 * Sentiment analysis, automatic alerts, pattern-based recommendations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, desc } from "drizzle-orm";
import {
  patients,
  sessions,
  clinicalNotes,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { cacheManager, cacheKeys } from "../_core/cache";

/**
 * Sentiment analysis result
 */
interface SentimentResult {
  score: number; // -1 to 1
  label: "negative" | "neutral" | "positive";
  confidence: number; // 0 to 1
  keywords: string[];
}

/**
 * Risk alert
 */
interface RiskAlert {
  patientId: number;
  patientName: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  suggestedActions: string[];
  timestamp: Date;
}

/**
 * Pattern-based recommendation
 */
interface PatternRecommendation {
  patientId: number;
  pattern: string;
  confidence: number;
  recommendedIntervention: string;
  rationale: string;
  expectedOutcome: string;
}

export const aiAdvancedRouter = router({
  /**
   * Analyze sentiment in clinical notes
   */
  analyzeSentiment: protectedProcedure
    .input(z.object({ patientId: z.number(), text: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
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

      // Use LLM for sentiment analysis
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a clinical sentiment analyzer. Analyze the following clinical note and provide:
1. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
2. Sentiment label (negative, neutral, or positive)
3. Confidence (0 to 1)
4. Key emotional indicators (list 3-5 keywords)

Respond in JSON format: { "score": number, "label": string, "confidence": number, "keywords": string[] }`,
          },
          {
            role: "user",
            content: `Analyze this clinical note:\n\n${input.text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sentiment_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number", description: "Sentiment score from -1 to 1" },
                label: { type: "string", enum: ["negative", "neutral", "positive"] },
                confidence: { type: "number", description: "Confidence from 0 to 1" },
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["score", "label", "confidence", "keywords"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const result = JSON.parse(contentStr || "{}") as SentimentResult;

      return {
        patientId: input.patientId,
        patientName: patient[0].name,
        sentiment: result,
        timestamp: new Date(),
      };
    }),

  /**
   * Detect risk patterns and generate alerts
   */
  detectRiskPatterns: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check cache first
      const cacheKey = `ai:risk-alert:${input.patientId}`;
      const cachedAlert = cacheManager.get(cacheKey);
      if (cachedAlert) {
        return cachedAlert;
      }

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

      // Get recent notes and sessions
      const recentNotes = await db
        .select()
        .from(clinicalNotes)
        .where(eq(clinicalNotes.patientId, input.patientId))
        .orderBy(desc(clinicalNotes.createdAt))
        .limit(10);

      const recentSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, input.patientId))
        .orderBy(desc(sessions.scheduledAt))
        .limit(5);

      // Analyze risk factors
      const notesText = recentNotes.map((n) => n.content).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a clinical risk assessment expert. Analyze the clinical notes and identify risk patterns.
Provide a JSON response with:
1. riskLevel: "low", "medium", "high", or "critical"
2. riskFactors: array of identified risk factors
3. suggestedActions: array of recommended clinical actions

Consider factors like: suicidal ideation, substance abuse, severe depression, anxiety, trauma triggers, etc.`,
          },
          {
            role: "user",
            content: `Analyze these clinical notes for risk:\n\n${notesText}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "risk_assessment",
            strict: true,
            schema: {
              type: "object",
              properties: {
                riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
                riskFactors: { type: "array", items: { type: "string" } },
                suggestedActions: { type: "array", items: { type: "string" } },
              },
              required: ["riskLevel", "riskFactors", "suggestedActions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      const alert: RiskAlert = {
        patientId: input.patientId,
        patientName: patient[0].name,
        riskLevel: analysis.riskLevel || "low",
        riskFactors: analysis.riskFactors || [],
        suggestedActions: analysis.suggestedActions || [],
        timestamp: new Date(),
      };

      // Cache for 1 hour
      cacheManager.set(cacheKey, alert, 60 * 60 * 1000);

      return alert;
    }),

  /**
   * Generate pattern-based treatment recommendations
   */
  getPatternBasedRecommendations: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check cache
      const cacheKey = `ai:pattern-recs:${input.patientId}`;
      const cachedRecs = cacheManager.get(cacheKey);
      if (cachedRecs) {
        return cachedRecs;
      }

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

      // Get patient history
      const allNotes = await db
        .select()
        .from(clinicalNotes)
        .where(eq(clinicalNotes.patientId, input.patientId))
        .orderBy(desc(clinicalNotes.createdAt))
        .limit(20);

      const allSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, input.patientId))
        .orderBy(desc(sessions.scheduledAt))
        .limit(10);

      // Analyze patterns
      const historyText = allNotes.map((n) => n.content).join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert clinical psychologist. Analyze the patient's history and identify patterns.
Provide JSON with array of recommendations:
[
  {
    "pattern": "identified pattern",
    "confidence": 0.85,
    "recommendedIntervention": "specific intervention",
    "rationale": "why this intervention",
    "expectedOutcome": "expected result"
  }
]`,
          },
          {
            role: "user",
            content: `Analyze this patient's clinical history and provide treatment recommendations:\n\n${historyText}`,
          },
        ],
      });

      const content = response.choices[0]?.message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const recommendations = JSON.parse(contentStr || "[]") as PatternRecommendation[];

      const result = {
        patientId: input.patientId,
        patientName: patient[0].name,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        generatedAt: new Date(),
      };

      // Cache for 24 hours
      cacheManager.set(cacheKey, result, 24 * 60 * 60 * 1000);

      return result;
    }),

  /**
   * Get sentiment trend over time
   */
  getSentimentTrend: protectedProcedure
    .input(z.object({ patientId: z.number(), daysBack: z.number().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      // Check cache
      const cacheKey = `ai:sentiment-trend:${input.patientId}:${input.daysBack}`;
      const cachedTrend = cacheManager.get(cacheKey);
      if (cachedTrend) {
        return cachedTrend;
      }

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

      // Get notes from the specified period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.daysBack);

      const notes = await db
        .select()
        .from(clinicalNotes)
        .where(and(eq(clinicalNotes.patientId, input.patientId), gte(clinicalNotes.createdAt, startDate)))
        .orderBy(desc(clinicalNotes.createdAt));

      // Simulate sentiment trend (in production, would analyze each note)
      const trend = notes.map((note, index) => ({
        date: note.createdAt,
        sentimentScore: 0.3 + Math.random() * 0.4, // Simulated score
        label: Math.random() > 0.5 ? "positive" : "neutral",
      }));

      const result = {
        patientId: input.patientId,
        patientName: patient[0].name,
        daysBack: input.daysBack,
        trend,
        overallTrend: trend.length > 0 ? (trend[0]?.sentimentScore || 0) - (trend[trend.length - 1]?.sentimentScore || 0) : 0,
      };

      // Cache for 12 hours
      cacheManager.set(cacheKey, result, 12 * 60 * 60 * 1000);

      return result;
    }),

  /**
   * Get all active risk alerts for user's patients
   */
  getActiveRiskAlerts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Get all patient IDs for user
    const userPatients = await db
      .select({ id: patients.id, name: patients.name })
      .from(patients)
      .where(eq(patients.userId, ctx.user.id));

    // Detect risk for each patient
    const alerts: RiskAlert[] = [];

    for (const patient of userPatients) {
      const cacheKey = `ai:risk-alert:${patient.id}`;
      const cachedAlert = cacheManager.get<RiskAlert>(cacheKey);

      if (cachedAlert && cachedAlert.riskLevel !== "low") {
        alerts.push(cachedAlert);
      }
    }

    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((a) => a.riskLevel === "critical").length,
      highAlerts: alerts.filter((a) => a.riskLevel === "high").length,
      alerts: alerts.sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }),
    };
  }),
});
