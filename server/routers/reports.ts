import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSessions,
  getSessionById,
  getClinicalNotesBySession,
  getPatientById,
  getTransactions,
  getDocumentsByPatient,
} from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Reports Router - Exportação de relatórios em PDF e Excel
 * Suporta: sessões, prontuários, financeiro, documentação de pacientes
 */
export const reportsRouter = router({
  // Exportar todas as sessões em JSON (para processamento no cliente)
  exportSessions: protectedProcedure
    .input(
      z.object({
        from: z.number().optional(),
        to: z.number().optional(),
        status: z.string().optional(),
        format: z.enum(["json", "csv"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const sessions = await getSessions(ctx.user.id, {
        from: input.from,
        to: input.to,
        status: input.status,
      });

      if (input.format === "csv") {
        // Converter para CSV
        const headers = [
          "ID",
          "Paciente",
          "Data",
          "Status",
          "Pago",
          "Notas",
        ];
        const rows = sessions.map((s) => [
          s.id,
          s.patientId,
          new Date(s.scheduledAt).toLocaleDateString("pt-BR"),
          s.status,
          s.isPaid,
          s.notes || "",
        ]);

        const csv =
          [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n") + "\n";

        return {
          content: csv,
          filename: `sessoes_${new Date().toISOString().split("T")[0]}.csv`,
          mimeType: "text/csv",
        };
      }

      return {
        content: JSON.stringify(sessions, null, 2),
        filename: `sessoes_${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
      };
    }),

  // Exportar prontuário completo de um paciente
  exportProntuario: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const patient = await getPatientById(input.patientId, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const sessions = await getSessions(ctx.user.id, {
        patientId: input.patientId,
      });

      const clinicalNotes = await Promise.all(
        sessions.map((s) => getClinicalNotesBySession(s.id, ctx.user.id))
      );

      const prontuario = {
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          birthDate: patient.birthDate,
          status: patient.status,
          createdAt: patient.createdAt,
        },
        sessions: sessions.map((s, idx) => ({
          id: s.id,
          date: new Date(s.scheduledAt).toLocaleDateString("pt-BR"),
          status: s.status,
          isPaid: s.isPaid,
          notes: s.notes,
          clinicalNotes: clinicalNotes[idx] || [],
        })),
        totalSessions: sessions.length,
        exportedAt: new Date().toISOString(),
      };

      return {
        content: JSON.stringify(prontuario, null, 2),
        filename: `prontuario_${patient.name?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
      };
    }),

  // Exportar relatório financeiro
  exportFinancial: protectedProcedure
    .input(
      z.object({
        from: z.number().optional(),
        to: z.number().optional(),
        format: z.enum(["json", "csv"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await getTransactions(ctx.user.id, {
        from: input.from,
        to: input.to,
      });

      const summary = {
        totalReceita: transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0),
        totalDespesa: transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0),
        saldo: transactions.reduce(
          (sum, t) => {
            const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
            return sum + (t.type === "income" ? amt : -amt);
          },
          0
        ),
        transacoes: transactions.length,
      };

      if (input.format === "csv") {
        const headers = [
          "Data",
          "Tipo",
          "Categoria",
          "Valor",
          "Descrição",
          "Status",
        ];
        const rows = transactions.map((t) => {
          const amt = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          return [
            new Date(t.transactionDate || t.createdAt.getTime()).toLocaleDateString(
              "pt-BR"
            ),
            t.type,
            t.category || "-",
            `R$ ${amt.toFixed(2)}`,
            t.description || "-",
            t.status || "-",
          ];
        });

        const csv =
          [headers, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n") + "\n";

        return {
          content: csv,
          filename: `financeiro_${new Date().toISOString().split("T")[0]}.csv`,
          mimeType: "text/csv",
          summary,
        };
      }

      return {
        content: JSON.stringify(
          {
            summary,
            transactions,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        filename: `financeiro_${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
        summary,
      };
    }),

  // Exportar documentação completa do paciente
  exportPatientDocumentation: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const patient = await getPatientById(input.patientId, ctx.user.id);
      if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

      const sessions = await getSessions(ctx.user.id, {
        patientId: input.patientId,
      });

      const documents = await getDocumentsByPatient(input.patientId, ctx.user.id);

      const documentation = {
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          birthDate: patient.birthDate,
          status: patient.status,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
        },
        sessions: sessions.map((s) => ({
          id: s.id,
          date: new Date(s.scheduledAt).toLocaleDateString("pt-BR"),
          status: s.status,
          isPaid: s.isPaid,
          notes: s.notes,
        })),
        documents: documents.map((d: any) => ({
          id: d.id,
          filename: d.filename,
          fileKey: d.fileKey,
          uploadedAt: d.uploadedAt,
        })),
        stats: {
          totalSessions: sessions.length,
          totalDocuments: documents.length,
          status: patient.status,
        },
        exportedAt: new Date().toISOString(),
      };

      return {
        content: JSON.stringify(documentation, null, 2),
        filename: `documentacao_${patient.name?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`,
        mimeType: "application/json",
      };
    }),

  // Gerar resumo para download (retorna dados estruturados para o cliente gerar PDF/Excel)
  generateReportSummary: protectedProcedure
    .input(
      z.object({
        type: z.enum(["sessions", "financial", "prontuario", "documentation"]),
        patientId: z.number().optional(),
        from: z.number().optional(),
        to: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.type === "sessions") {
        const sessions = await getSessions(ctx.user.id, {
          from: input.from,
          to: input.to,
        });
        return {
          type: "sessions",
          data: sessions,
          count: sessions.length,
          generatedAt: new Date().toISOString(),
        };
      }

      if (input.type === "financial") {
        const transactions = await getTransactions(ctx.user.id, {
          from: input.from,
          to: input.to,
        });
        return {
          type: "financial",
          data: transactions,
          count: transactions.length,
          generatedAt: new Date().toISOString(),
        };
      }

      if (input.type === "prontuario" && input.patientId) {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        const sessions = await getSessions(ctx.user.id, {
          patientId: input.patientId,
        });

        return {
          type: "prontuario",
          patient,
          sessions,
          generatedAt: new Date().toISOString(),
        };
      }

      if (input.type === "documentation" && input.patientId) {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND" });

        const sessions = await getSessions(ctx.user.id, {
          patientId: input.patientId,
        });

        const documents = await getDocumentsByPatient(
          input.patientId,
          ctx.user.id
        );

        return {
          type: "documentation",
          patient,
          sessions,
          documents,
          generatedAt: new Date().toISOString(),
        };
      }

      throw new TRPCError({ code: "BAD_REQUEST" });
    }),
});
