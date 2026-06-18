import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { transactions } from "../../drizzle/schema";
import { sum, eq, and, between } from "drizzle-orm";

// ─── Admin guard ────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  }
  return next({ ctx });
});

export const managementReportsRouter = router({
  generateReportPDF: adminProcedure
    .input(
      z.object({
        startDate: z.string(),
        endDate: z.string(),
        category: z.enum(["financial", "patients", "clinical", "system", "all"]).default("all"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Buscar dados do relatório
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
        
        const startMs = new Date(input.startDate).getTime();
        const endMs = new Date(input.endDate).getTime() + 86400000;

        let totalIncome = 0;
        let totalExpenses = 0;

        try {
          const paidIncome = await db
            .select({ total: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, ctx.user.id),
                eq(transactions.type, "income"),
                between(transactions.createdAt, new Date(startMs), new Date(endMs))
              )
            );
          totalIncome = paidIncome[0]?.total ? parseFloat(String(paidIncome[0].total)) : 0;
        } catch (e) {
          console.error('Error fetching income:', e);
          totalIncome = 0;
        }

        try {
          const expenses = await db
            .select({ total: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, ctx.user.id),
                eq(transactions.type, "expense"),
                between(transactions.createdAt, new Date(startMs), new Date(endMs))
              )
            );
          totalExpenses = expenses[0]?.total ? parseFloat(String(expenses[0].total)) : 0;
        } catch (e) {
          console.error('Error fetching expenses:', e);
          totalExpenses = 0;
        }

        // Criar documento PDF usando pdfkit
        let PDFDocument: any;
        try {
          // @ts-ignore
          PDFDocument = require("pdfkit");
        } catch (e) {
          console.error("[PDF] Erro ao carregar pdfkit via require:", e);
          throw new Error("pdfkit não está disponível");
        }

        console.log('[PDF] PDFDocument type:', typeof PDFDocument);
        
        // Garantir que temos um construtor válido
        let DocCtor = PDFDocument;
        if (typeof DocCtor !== 'function' && DocCtor?.default && typeof DocCtor.default === 'function') {
          DocCtor = DocCtor.default;
        }
        
        if (typeof DocCtor !== 'function') {
          throw new Error(`PDFDocument is not a constructor: ${typeof DocCtor}`);
        }

        const doc = new DocCtor();
        const chunks: Buffer[] = [];

        doc.on("data", (chunk: Buffer) => chunks.push(chunk));

        // Header com timbrado
        doc.fontSize(20).font("Helvetica-Bold").text("E-Saúde | Gestão Clínica", { align: "center" });
        doc.fontSize(10).text("Relatório Gerencial", { align: "center" });
        doc.fontSize(9).text(`Período: ${input.startDate} a ${input.endDate}`, { align: "center" });
        doc.moveTo(50, 100).lineTo(550, 100).stroke();
        doc.moveDown();

        // Resumo Financeiro
        if (input.category === "all" || input.category === "financial") {
          doc.fontSize(14).font("Helvetica-Bold").text("Resumo Financeiro");
          doc.fontSize(10).font("Helvetica");
          doc.text(`Receita Bruta: R$ ${totalIncome.toFixed(2)}`);
          doc.text(`Despesas Operacionais: R$ ${totalExpenses.toFixed(2)}`);
          doc.moveDown();
        }

        // Footer
        doc.fontSize(8).text(`Gerado em: ${new Date().toISOString()}`, { align: "center" });

        doc.end();

        // Converter stream para buffer
        return new Promise((resolve, reject) => {
          doc.on("end", () => {
            try {
              const pdfBuffer = Buffer.concat(chunks);
              const base64 = pdfBuffer.toString("base64");
              console.log('[PDF] PDF gerado com sucesso, tamanho:', pdfBuffer.length);
              resolve({ pdf: base64, filename: `relatorio_${input.startDate}_${input.endDate}.pdf` });
            } catch (e) {
              console.error('[PDF] Erro ao converter buffer:', e);
              reject(e);
            }
          });
          doc.on("error", (err: any) => {
            console.error('[PDF] Erro no documento PDF:', err);
            reject(err);
          });
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      }
    }),
});
