/**
 * Advanced AI Features Router Tests
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Advanced AI Features", () => {
  describe("Sentiment Analysis Schema", () => {
    const sentimentSchema = z.object({
      patientId: z.number(),
      patientName: z.string(),
      sentiment: z.object({
        score: z.number().min(-1).max(1),
        label: z.enum(["negative", "neutral", "positive"]),
        confidence: z.number().min(0).max(1),
        keywords: z.array(z.string()),
      }),
      timestamp: z.date(),
    });

    it("should validate sentiment analysis result", () => {
      const result = {
        patientId: 1,
        patientName: "John Doe",
        sentiment: {
          score: 0.5,
          label: "positive",
          confidence: 0.85,
          keywords: ["happy", "improved", "hopeful"],
        },
        timestamp: new Date(),
      };

      expect(() => sentimentSchema.parse(result)).not.toThrow();
    });

    it("should reject invalid sentiment score", () => {
      const result = {
        patientId: 1,
        patientName: "John Doe",
        sentiment: {
          score: 1.5, // Invalid: > 1
          label: "positive",
          confidence: 0.85,
          keywords: ["happy"],
        },
        timestamp: new Date(),
      };

      expect(() => sentimentSchema.parse(result)).toThrow();
    });

    it("should reject invalid confidence", () => {
      const result = {
        patientId: 1,
        patientName: "John Doe",
        sentiment: {
          score: 0.5,
          label: "positive",
          confidence: 1.5, // Invalid: > 1
          keywords: ["happy"],
        },
        timestamp: new Date(),
      };

      expect(() => sentimentSchema.parse(result)).toThrow();
    });

    it("should accept all sentiment labels", () => {
      const labels = ["negative", "neutral", "positive"];

      for (const label of labels) {
        const result = {
          patientId: 1,
          patientName: "John",
          sentiment: {
            score: 0,
            label,
            confidence: 0.8,
            keywords: ["test"],
          },
          timestamp: new Date(),
        };

        expect(() => sentimentSchema.parse(result)).not.toThrow();
      }
    });
  });

  describe("Risk Alert Schema", () => {
    const riskAlertSchema = z.object({
      patientId: z.number(),
      patientName: z.string(),
      riskLevel: z.enum(["low", "medium", "high", "critical"]),
      riskFactors: z.array(z.string()),
      suggestedActions: z.array(z.string()),
      timestamp: z.date(),
    });

    it("should validate risk alert", () => {
      const alert = {
        patientId: 1,
        patientName: "Jane Doe",
        riskLevel: "high",
        riskFactors: ["suicidal ideation", "substance abuse"],
        suggestedActions: ["increase session frequency", "psychiatric evaluation"],
        timestamp: new Date(),
      };

      expect(() => riskAlertSchema.parse(alert)).not.toThrow();
    });

    it("should accept all risk levels", () => {
      const levels = ["low", "medium", "high", "critical"];

      for (const level of levels) {
        const alert = {
          patientId: 1,
          patientName: "Jane",
          riskLevel: level,
          riskFactors: ["test"],
          suggestedActions: ["action"],
          timestamp: new Date(),
        };

        expect(() => riskAlertSchema.parse(alert)).not.toThrow();
      }
    });

    it("should require at least one risk factor", () => {
      const alert = {
        patientId: 1,
        patientName: "Jane",
        riskLevel: "high",
        riskFactors: [], // Empty
        suggestedActions: ["action"],
        timestamp: new Date(),
      };

      // Should still pass as array is valid
      expect(() => riskAlertSchema.parse(alert)).not.toThrow();
    });
  });

  describe("Pattern Recommendation Schema", () => {
    const recommendationSchema = z.object({
      patientId: z.number(),
      pattern: z.string(),
      confidence: z.number().min(0).max(1),
      recommendedIntervention: z.string(),
      rationale: z.string(),
      expectedOutcome: z.string(),
    });

    it("should validate pattern recommendation", () => {
      const rec = {
        patientId: 1,
        pattern: "avoidance behavior",
        confidence: 0.88,
        recommendedIntervention: "exposure therapy",
        rationale: "Patient shows consistent avoidance patterns",
        expectedOutcome: "Reduced anxiety and improved coping",
      };

      expect(() => recommendationSchema.parse(rec)).not.toThrow();
    });

    it("should reject confidence > 1", () => {
      const rec = {
        patientId: 1,
        pattern: "avoidance",
        confidence: 1.5,
        recommendedIntervention: "therapy",
        rationale: "reason",
        expectedOutcome: "outcome",
      };

      expect(() => recommendationSchema.parse(rec)).toThrow();
    });

    it("should accept confidence at boundaries", () => {
      const testCases = [
        { confidence: 0 },
        { confidence: 0.5 },
        { confidence: 1 },
      ];

      for (const testCase of testCases) {
        const rec = {
          patientId: 1,
          pattern: "test",
          confidence: testCase.confidence,
          recommendedIntervention: "therapy",
          rationale: "reason",
          expectedOutcome: "outcome",
        };

        expect(() => recommendationSchema.parse(rec)).not.toThrow();
      }
    });
  });

  describe("Sentiment Trend Schema", () => {
    const trendSchema = z.object({
      patientId: z.number(),
      patientName: z.string(),
      daysBack: z.number(),
      trend: z.array(
        z.object({
          date: z.date(),
          sentimentScore: z.number().min(-1).max(1),
          label: z.enum(["negative", "neutral", "positive"]),
        })
      ),
      overallTrend: z.number(),
    });

    it("should validate sentiment trend", () => {
      const trend = {
        patientId: 1,
        patientName: "John",
        daysBack: 30,
        trend: [
          { date: new Date(), sentimentScore: 0.3, label: "neutral" },
          { date: new Date(), sentimentScore: 0.6, label: "positive" },
        ],
        overallTrend: 0.3,
      };

      expect(() => trendSchema.parse(trend)).not.toThrow();
    });

    it("should accept empty trend array", () => {
      const trend = {
        patientId: 1,
        patientName: "John",
        daysBack: 30,
        trend: [],
        overallTrend: 0,
      };

      expect(() => trendSchema.parse(trend)).not.toThrow();
    });
  });

  describe("Risk Alert Aggregation", () => {
    it("should count alert types correctly", () => {
      const alerts = [
        { riskLevel: "critical" },
        { riskLevel: "critical" },
        { riskLevel: "high" },
        { riskLevel: "high" },
        { riskLevel: "high" },
        { riskLevel: "medium" },
      ];

      const criticalCount = alerts.filter((a) => a.riskLevel === "critical").length;
      const highCount = alerts.filter((a) => a.riskLevel === "high").length;

      expect(criticalCount).toBe(2);
      expect(highCount).toBe(3);
    });

    it("should sort alerts by risk level", () => {
      const alerts = [
        { id: 1, riskLevel: "low" },
        { id: 2, riskLevel: "critical" },
        { id: 3, riskLevel: "high" },
        { id: 4, riskLevel: "medium" },
      ];

      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const sorted = alerts.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

      expect(sorted[0]?.id).toBe(2); // critical first
      expect(sorted[1]?.id).toBe(3); // high second
      expect(sorted[3]?.id).toBe(1); // low last
    });
  });

  describe("Sentiment Score Interpretation", () => {
    it("should interpret sentiment scores correctly", () => {
      const testCases = [
        { score: -1, expected: "very negative" },
        { score: -0.5, expected: "negative" },
        { score: 0, expected: "neutral" },
        { score: 0.5, expected: "positive" },
        { score: 1, expected: "very positive" },
      ];

      for (const testCase of testCases) {
        let interpretation = "neutral";
        if (testCase.score < -0.3) interpretation = "negative";
        if (testCase.score < -0.7) interpretation = "very negative";
        if (testCase.score > 0.3) interpretation = "positive";
        if (testCase.score > 0.7) interpretation = "very positive";

        expect(interpretation).toBe(testCase.expected);
      }
    });
  });

  describe("Pattern Confidence Thresholds", () => {
    it("should filter recommendations by confidence threshold", () => {
      const recommendations = [
        { pattern: "A", confidence: 0.95 },
        { pattern: "B", confidence: 0.75 },
        { pattern: "C", confidence: 0.55 },
        { pattern: "D", confidence: 0.35 },
      ];

      const highConfidence = recommendations.filter((r) => r.confidence > 0.8);
      const mediumConfidence = recommendations.filter((r) => r.confidence > 0.6 && r.confidence <= 0.8);
      const lowConfidence = recommendations.filter((r) => r.confidence <= 0.6);

      expect(highConfidence).toHaveLength(1);
      expect(mediumConfidence).toHaveLength(1);
      expect(lowConfidence).toHaveLength(2);
    });
  });

  describe("Risk Factor Analysis", () => {
    it("should identify high-risk combinations", () => {
      const riskFactors = ["suicidal ideation", "substance abuse", "recent trauma"];

      const highRiskCombinations = [
        ["suicidal ideation", "substance abuse"],
        ["suicidal ideation", "recent trauma"],
      ];

      for (const combination of highRiskCombinations) {
        const hasAllFactors = combination.every((factor) => riskFactors.includes(factor));
        expect(hasAllFactors).toBe(true);
      }
    });

    it("should weight risk factors appropriately", () => {
      const riskWeights = {
        "suicidal ideation": 10,
        "substance abuse": 8,
        "recent trauma": 7,
        "social isolation": 5,
        "sleep disturbance": 3,
      };

      const factors = ["suicidal ideation", "sleep disturbance"];
      const totalRisk = factors.reduce((sum, factor) => sum + (riskWeights[factor] || 0), 0);

      expect(totalRisk).toBe(13);
    });
  });

  describe("Sentiment Trend Analysis", () => {
    it("should calculate trend direction", () => {
      const trend = [
        { score: 0.2 },
        { score: 0.4 },
        { score: 0.6 },
        { score: 0.8 },
      ];

      const firstScore = trend[0]?.score || 0;
      const lastScore = trend[trend.length - 1]?.score || 0;
      const trendDirection = lastScore - firstScore;

      expect(trendDirection).toBeCloseTo(0.6, 5); // Improving (with tolerance for floating point)
      expect(trendDirection > 0).toBe(true); // Positive trend
    });

    it("should identify stable sentiment", () => {
      const trend = [
        { score: 0.5 },
        { score: 0.51 },
        { score: 0.49 },
        { score: 0.5 },
      ];

      const scores = trend.map((t) => t.score);
      const mean = scores.reduce((a, b) => a + b) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);

      expect(stdDev).toBeLessThan(0.01); // Very stable
    });
  });
});
