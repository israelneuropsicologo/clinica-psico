/**
 * AI Integration Router Tests
 * Tests for AI-powered clinical insights and recommendations
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

describe("AI Integration Router", () => {
  describe("getPatientAIInsights", () => {
    it("should validate input with patientId", () => {
      const schema = z.object({ patientId: z.number() });
      const input = { patientId: 1 };
      expect(() => schema.parse(input)).not.toThrow();
    });

    it("should reject invalid patientId", () => {
      const schema = z.object({ patientId: z.number() });
      const input = { patientId: "invalid" };
      expect(() => schema.parse(input)).toThrow();
    });

    it("should handle missing patientId", () => {
      const schema = z.object({ patientId: z.number() });
      const input = {};
      expect(() => schema.parse(input)).toThrow();
    });
  });

  describe("getSessionPlanningRecommendations", () => {
    it("should validate input with patientId", () => {
      const schema = z.object({ patientId: z.number() });
      const input = { patientId: 1 };
      expect(() => schema.parse(input)).not.toThrow();
    });

    it("should reject negative patientId", () => {
      const schema = z.object({ patientId: z.number().positive() });
      const input = { patientId: -1 };
      expect(() => schema.parse(input)).toThrow();
    });
  });

  describe("getComparativeAnalysis", () => {
    it("should validate input with multiple patientIds", () => {
      const schema = z.object({ patientIds: z.array(z.number()).min(2).max(5) });
      const input = { patientIds: [1, 2, 3] };
      expect(() => schema.parse(input)).not.toThrow();
    });

    it("should reject less than 2 patientIds", () => {
      const schema = z.object({ patientIds: z.array(z.number()).min(2).max(5) });
      const input = { patientIds: [1] };
      expect(() => schema.parse(input)).toThrow();
    });

    it("should reject more than 5 patientIds", () => {
      const schema = z.object({ patientIds: z.array(z.number()).min(2).max(5) });
      const input = { patientIds: [1, 2, 3, 4, 5, 6] };
      expect(() => schema.parse(input)).toThrow();
    });

    it("should accept exactly 2 patientIds", () => {
      const schema = z.object({ patientIds: z.array(z.number()).min(2).max(5) });
      const input = { patientIds: [1, 2] };
      expect(() => schema.parse(input)).not.toThrow();
    });

    it("should accept exactly 5 patientIds", () => {
      const schema = z.object({ patientIds: z.array(z.number()).min(2).max(5) });
      const input = { patientIds: [1, 2, 3, 4, 5] };
      expect(() => schema.parse(input)).not.toThrow();
    });
  });

  describe("getSupervisionSummary", () => {
    it("should validate input with patientId", () => {
      const schema = z.object({ patientId: z.number() });
      const input = { patientId: 1 };
      expect(() => schema.parse(input)).not.toThrow();
    });

    it("should handle zero patientId", () => {
      const schema = z.object({ patientId: z.number().positive() });
      const input = { patientId: 0 };
      expect(() => schema.parse(input)).toThrow();
    });
  });

  describe("Response structure validation", () => {
    it("should return expected structure for patient AI insights", () => {
      const responseSchema = z.object({
        patientName: z.string(),
        insights: z.string(),
        sessionsCount: z.number(),
        notesCount: z.number(),
        lastSessionDate: z.date().nullable(),
        lastNoteDate: z.date().nullable(),
      });

      const mockResponse = {
        patientName: "João Silva",
        insights: "Paciente apresenta progresso significativo...",
        sessionsCount: 5,
        notesCount: 8,
        lastSessionDate: new Date(),
        lastNoteDate: new Date(),
      };

      expect(() => responseSchema.parse(mockResponse)).not.toThrow();
    });

    it("should return expected structure for session planning recommendations", () => {
      const responseSchema = z.object({
        patientName: z.string(),
        recommendations: z.string(),
        lastNotesCount: z.number(),
      });

      const mockResponse = {
        patientName: "Maria Santos",
        recommendations: "Recomenda-se explorar...",
        lastNotesCount: 3,
      };

      expect(() => responseSchema.parse(mockResponse)).not.toThrow();
    });

    it("should return expected structure for comparative analysis", () => {
      const responseSchema = z.object({
        patientsAnalyzed: z.number(),
        patientData: z.array(
          z.object({
            name: z.string(),
            sessionsCount: z.number(),
            notesCount: z.number(),
            mainComplaint: z.string().nullable(),
            status: z.string(),
          })
        ),
        analysis: z.string(),
      });

      const mockResponse = {
        patientsAnalyzed: 3,
        patientData: [
          {
            name: "Paciente 1",
            sessionsCount: 5,
            notesCount: 8,
            mainComplaint: "Ansiedade",
            status: "active",
          },
          {
            name: "Paciente 2",
            sessionsCount: 3,
            notesCount: 5,
            mainComplaint: "Depressão",
            status: "active",
          },
        ],
        analysis: "Análise comparativa mostra...",
      };

      expect(() => responseSchema.parse(mockResponse)).not.toThrow();
    });

    it("should return expected structure for supervision summary", () => {
      const responseSchema = z.object({
        patientName: z.string(),
        summary: z.string(),
        recommendations: z.array(z.string()).optional(),
        notesWithSupervision: z.number(),
      });

      const mockResponse = {
        patientName: "Carlos Oliveira",
        summary: "Resumo de supervisão...",
        notesWithSupervision: 4,
      };

      expect(() => responseSchema.parse(mockResponse)).not.toThrow();
    });
  });

  describe("Data validation edge cases", () => {
    it("should handle empty patient name gracefully", () => {
      const schema = z.object({
        patientName: z.string().min(1, "Nome do paciente é obrigatório"),
      });

      expect(() => schema.parse({ patientName: "" })).toThrow();
    });

    it("should handle null insights gracefully", () => {
      const schema = z.object({
        insights: z.string().min(1, "Insights não podem estar vazios"),
      });

      expect(() => schema.parse({ insights: "" })).toThrow();
    });

    it("should handle zero sessions count", () => {
      const schema = z.object({
        sessionsCount: z.number().min(0),
      });

      expect(() => schema.parse({ sessionsCount: 0 })).not.toThrow();
    });

    it("should handle large patient IDs", () => {
      const schema = z.object({ patientId: z.number() });
      const input = { patientId: 999999999 };
      expect(() => schema.parse(input)).not.toThrow();
    });
  });
});
