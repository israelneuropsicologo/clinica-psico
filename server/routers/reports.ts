import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSessions,
  getSessionById,
  getClinicalNotesBySession,
  getPatientById,
  getTransactions,
  getDocumentsByPatient,
  getDb,
} from "../db";
import { TRPCError } from "@trpc/server";
import { generatePatientReport, generateFinancialReport } from "../_core/reportGenerator";
import { generateReferralLetter, ReferralLetterData } from "../_core/referralLetterGenerator";
import { generateDeclaracao, DeclaracaoData } from "../_core/documentGenerators/declaracaoGenerator";
import { generateAtestado, AtestadoData } from "../_core/documentGenerators/atestadoGenerator";
import { generateLaudo, LaudoData } from "../_core/documentGenerators/laudoGenerator";
import { generateParecer, ParecerData } from "../_core/documentGenerators/parecerGenerator";
import { generateRelatorio, RelatorioData } from "../_core/documentGenerators/relatorioGenerator";
import { generateRelatorioMultiprofissional, RelatorioMultiprofissionalData } from "../_core/documentGenerators/relatorioMultiprofissionalGenerator";
import { settings as settingsTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
// timeline_analyses imported if needed in future

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

  // Gerar PDF de prontuário de uma sessão
  generateSessionPDF: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const session = await getSessionById(input.sessionId, ctx.user.id);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Sessão não encontrada" });

        const patient = await getPatientById(session.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const notes = await getClinicalNotesBySession(input.sessionId, ctx.user.id);
        const note = notes[0] || null;

        // Buscar configurações do profissional
        const db = await getDb();
        let profSettings: { ownerName?: string | null; ownerCRPNumber?: string | null; clinicName?: string | null } = {};
        if (db) {
          const [s] = await db.select().from(settingsTable).where(eq(settingsTable.userId, ctx.user.id)).limit(1);
          if (s) profSettings = s;
        }

        const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
        const pdfDoc = await PDFDocument.create();
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const PAGE_W = 595;
        const PAGE_H = 842;
        const MARGIN = 50;
        const CONTENT_W = PAGE_W - MARGIN * 2;
        const LINE_H = 16;
        const SECTION_GAP = 20;

        let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
        let y = PAGE_H - MARGIN;

        // Helper: ensure space, add new page if needed
        const ensureSpace = (needed: number) => {
          if (y - needed < 60) {
            page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            y = PAGE_H - MARGIN;
            // Repeat small header on new pages
            page.drawText(`Prontuário — ${patient.name} (continuação)`, { x: MARGIN, y, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
            y -= 20;
          }
        };

        // Helper: draw wrapped text
        const drawWrapped = (text: string, x: number, maxWidth: number, size: number, font: typeof fontRegular, color: ReturnType<typeof rgb>) => {
          if (!text) return;
          const words = text.split(" ");
          let line = "";
          for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            const w = font.widthOfTextAtSize(test, size);
            if (w > maxWidth && line) {
              ensureSpace(LINE_H);
              page.drawText(line, { x, y, size, font, color });
              y -= LINE_H;
              line = word;
            } else {
              line = test;
            }
          }
          if (line) {
            ensureSpace(LINE_H);
            page.drawText(line, { x, y, size, font, color });
            y -= LINE_H;
          }
        };

        // Helper: draw section title
        const drawSection = (title: string) => {
          ensureSpace(SECTION_GAP + LINE_H + 4);
          y -= SECTION_GAP / 2;
          // Background bar
          page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: LINE_H + 6, color: rgb(0.12, 0.47, 0.71) });
          page.drawText(title, { x: MARGIN + 6, y: y, size: 11, font: fontBold, color: rgb(1, 1, 1) });
          y -= LINE_H + 10;
        };

        // Helper: draw field label + value
        const drawField = (label: string, value: string | null | undefined, indent = MARGIN) => {
          if (!value && value !== "0") return;
          ensureSpace(LINE_H * 2);
          page.drawText(`${label}:`, { x: indent, y, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
          y -= LINE_H - 2;
          drawWrapped(value, indent + 10, CONTENT_W - 10, 9, fontRegular, rgb(0, 0, 0));
          y -= 4;
        };

        // Helper: translate enums
        const riskLabel: Record<string, string> = { absent: "Ausente", low: "Baixo", moderate: "Moderado", high: "Alto", extreme: "Extremo" };
        const sessionTypeLabel: Record<string, string> = { individual: "Individual", couple: "Casal", group: "Grupo", evaluation: "Avaliação" };
        const modalityLabel: Record<string, string> = { in_person: "Presencial", online: "Online" };
        const statusLabel: Record<string, string> = { scheduled: "Agendada", confirmed: "Confirmada", completed: "Realizada", cancelled: "Cancelada", no_show: "Falta" };

        // ─── CABEÇALHO ──────────────────────────────────────────────────────
        // Barra superior azul escuro
        page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: rgb(0.05, 0.25, 0.45) });
        page.drawText("PRONTUÁRIO PSICOLÓGICO", { x: MARGIN, y: PAGE_H - 30, size: 16, font: fontBold, color: rgb(1, 1, 1) });
        page.drawText(`Paciente: ${patient.name}`, { x: MARGIN, y: PAGE_H - 50, size: 11, font: fontRegular, color: rgb(0.8, 0.9, 1) });
        const sessionDate = new Date(session.scheduledAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        page.drawText(`Data: ${sessionDate}`, { x: MARGIN, y: PAGE_H - 65, size: 10, font: fontRegular, color: rgb(0.7, 0.85, 1) });

        // Profissional (direita)
        const profName = profSettings.ownerName || ctx.user.name || "Profissional";
        const crp = profSettings.ownerCRPNumber ? `CRP: ${profSettings.ownerCRPNumber}` : "";
        const clinicName = profSettings.clinicName || "";
        const profX = PAGE_W - MARGIN - 180;
        page.drawText(profName, { x: profX, y: PAGE_H - 30, size: 10, font: fontBold, color: rgb(1, 1, 1) });
        if (crp) page.drawText(crp, { x: profX, y: PAGE_H - 45, size: 9, font: fontRegular, color: rgb(0.8, 0.9, 1) });
        if (clinicName) page.drawText(clinicName, { x: profX, y: PAGE_H - 58, size: 9, font: fontRegular, color: rgb(0.7, 0.85, 1) });

        y = PAGE_H - 95;

        // ─── SEÇÃO 1: DADOS DA SESSÃO ────────────────────────────────────────
        drawSection("1. DADOS DA SESSÃO");
        drawField("Nº da Sessão", note?.sessionNumber?.toString());
        drawField("Tipo", sessionTypeLabel[note?.sessionType2 || session.sessionType] || note?.sessionType2 || session.sessionType);
        drawField("Modalidade", modalityLabel[note?.modality2 || session.modality] || note?.modality2 || session.modality);
        drawField("Local", note?.sessionLocation);
        drawField("Data", sessionDate);
        drawField("Status", statusLabel[session.status] || session.status);
        drawField("Duração", `${session.durationMinutes} minutos`);
        if (session.sessionValue) drawField("Valor", `R$ ${Number(session.sessionValue).toFixed(2)}`);
        drawField("Pagamento", session.isPaid === "paid" ? "Pago" : session.isPaid === "waived" ? "Isento" : "Pendente");

        // ─── SEÇÃO 2: AVALIAÇÃO CLÍNICA ──────────────────────────────────────
        if (note && (note.emotionalState || note.predominantMood || note.sufferingLevel !== null || note.mainDemand || note.relevantNarrative || note.clinicalAssessment || note.technicalAnalysis || note.content)) {
          drawSection("2. AVALIAÇÃO CLÍNICA");
          drawField("Estado Emocional", note.emotionalState);
          drawField("Humor Predominante", note.predominantMood);
          if (note.sufferingLevel !== null && note.sufferingLevel !== undefined) {
            drawField("Nível de Sofrimento", `${note.sufferingLevel}/10`);
          }
          drawField("Medicações em Uso", note.currentMedications);
          drawField("Apresentação Geral", note.generalPresentation);
          drawField("Demanda Principal", note.mainDemand);
          drawField("Temas Abordados", note.topicsAddressed);
          drawField("Narrativa Relevante", note.relevantNarrative);
          drawField("Avaliação Clínica", note.clinicalAssessment);
          drawField("Análise Técnica", note.technicalAnalysis);
          // Legacy content
          if (note.content && note.content.trim()) {
            const cleanContent = note.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
            if (cleanContent) drawField("Anotações Clínicas", cleanContent);
          }
        }

        // ─── SEÇÃO 3: INTERVENÇÕES ───────────────────────────────────────────
        if (note && (note.techniquesUsed || note.plannedInterventions || note.homework || note.therapeuticPlan || note.interventions)) {
          drawSection("3. INTERVENÇÕES");
          drawField("Técnicas Utilizadas", note.techniquesUsed);
          drawField("Intervenções Planejadas", note.plannedInterventions);
          drawField("Tarefa de Casa", note.homework);
          drawField("Plano Terapêutico", note.therapeuticPlan);
          if (note.interventions) drawField("Intervenções (legado)", note.interventions);
        }

        // ─── SEÇÃO 4: EVOLUÇÃO ───────────────────────────────────────────────
        if (note && (note.treatmentResponse || note.goalsProgress || note.observedInsights || note.observedResistances)) {
          drawSection("4. EVOLUÇÃO");
          drawField("Resposta ao Tratamento", note.treatmentResponse);
          drawField("Progresso dos Objetivos", note.goalsProgress);
          drawField("Insights Observados", note.observedInsights);
          drawField("Resistências Observadas", note.observedResistances);
        }

        // ─── SEÇÃO 5: PRÓXIMA SESSÃO ─────────────────────────────────────────
        if (note && (note.nextSessionDate || note.nextSessionGoals || note.treatmentPlanAdjustments)) {
          drawSection("5. PRÓXIMA SESSÃO");
          drawField("Data Prevista", note.nextSessionDate);
          drawField("Objetivos", note.nextSessionGoals);
          drawField("Ajustes no Plano", note.treatmentPlanAdjustments);
        }

        // ─── SEÇÃO 6: AVALIAÇÃO DE RISCOS ────────────────────────────────────
        if (note) {
          drawSection("6. AVALIAÇÃO DE RISCOS");
          drawField("Risco de Autolesão", riskLabel[note.selfHarmRisk || "absent"]);
          drawField("Risco a Terceiros", riskLabel[note.thirdPartyRisk || "absent"]);
          drawField("Risco de Suicídio", riskLabel[note.suicideRisk || "absent"]);
        }

        // ─── SEÇÃO 7: ANOTAÇÕES PRIVADAS ─────────────────────────────────────
        if (note && (note.countertransference || note.clinicalHypotheses || note.supervisionNotes || note.referrals || note.privateObservations)) {
          drawSection("7. ANOTAÇÕES PRIVADAS (Uso Exclusivo do Profissional)");
          drawField("Contratransferência", note.countertransference);
          drawField("Hipóteses Clínicas", note.clinicalHypotheses);
          drawField("Notas para Supervisão", note.supervisionNotes);
          drawField("Encaminhamentos", note.referrals);
          drawField("Observações Adicionais", note.privateObservations);
        }

        // ─── SEÇÃO 8: ANÁLISE IA ─────────────────────────────────────────────
        if (note?.aiTechnicalFeedback) {
          drawSection("8. ANÁLISE DE I.A. (Ferramenta de Apoio Técnico)");
          ensureSpace(LINE_H * 2);
          page.drawText("AVISO: Esta análise é gerada por Inteligência Artificial e serve como ferramenta de apoio.", { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0.6, 0.4, 0) });
          y -= LINE_H;
          page.drawText("Não substitui o julgamento clínico do profissional.", { x: MARGIN, y, size: 8, font: fontRegular, color: rgb(0.6, 0.4, 0) });
          y -= LINE_H + 4;
          const cleanAI = note.aiTechnicalFeedback.replace(/[#*_`]/g, "").replace(/\n{3,}/g, "\n\n");
          drawWrapped(cleanAI, MARGIN, CONTENT_W, 9, fontRegular, rgb(0, 0, 0));
        }

        // ─── RODAPÉ ──────────────────────────────────────────────────────────
        const totalPages = pdfDoc.getPageCount();
        for (let i = 0; i < totalPages; i++) {
          const pg = pdfDoc.getPage(i);
          pg.drawLine({ start: { x: MARGIN, y: 45 }, end: { x: PAGE_W - MARGIN, y: 45 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
          pg.drawText("DOCUMENTO CONFIDENCIAL — Uso exclusivo do profissional de saúde. Protegido pelo sigilo profissional e LGPD.", { x: MARGIN, y: 32, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
          pg.drawText(`Gerado em: ${new Date().toLocaleString("pt-BR")} | Página ${i + 1} de ${totalPages}`, { x: MARGIN, y: 20, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });
        }

        const pdfBuffer = await pdfDoc.save();
        return {
          success: true,
          filename: `prontuario_${patient.name?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
          data: Buffer.from(pdfBuffer).toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar PDF de relatório de pacientes
  generatePatientPDF: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "inactive", "all"]).optional(),
        leadSource: z.enum(["manual", "chatbot", "website", "all"]).optional(),
        leadStatus: z.enum(["lead", "prospect", "customer", "all"]).optional(),
        patientIds: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const pdfBuffer = await generatePatientReport({
          userId: ctx.user.id,
          status: input.status || "all",
          leadSource: input.leadSource || "all",
          leadStatus: input.leadStatus || "all",
          patientIds: input.patientIds,
        });

        return {
          success: true,
          filename: `relatorio_pacientes_${new Date().toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar PDF de Carta de Encaminhamento
  generateReferralLetterPDF: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        recipientTitle: z.string().min(1),
        recipientName: z.string().optional(),
        referralReason: z.string().min(1),
        treatmentDuration: z.string().min(1),
        sessionFrequency: z.string().min(1),
        observedSymptoms: z.string().min(1),
        diagnosticHypothesis: z.string().optional(),
        recentEvolution: z.string().min(1),
        currentMedications: z.string().optional(),
        riskFactors: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();

        const patient = await getPatientById(input.patientId, ctx.user.id);

        const settingsResult = await db.select().from(settingsTable).where(eq(settingsTable.userId, ctx.user.id)).limit(1);
        const s = settingsResult[0] as any;

        let patientAge: number | undefined;
        if (patient.birthDate) {
          const birth = new Date(patient.birthDate);
          const today = new Date();
          patientAge = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) patientAge--;
        }

        const now = new Date();
        const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
        const dateStr = `${now.getDate().toString().padStart(2, "0")} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

        const letterData: ReferralLetterData = {
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRPNumber || "",
          professionalSpecialty: s?.ownerSpecialty || "Psicólogo(a)",
          professionalEmail: s?.ownerEmail || ctx.user.email || "",
          professionalPhone: s?.ownerPhone || s?.ownerWhatsapp || "",
          clinicName: s?.clinicName || "Consultório",
          clinicAddress: s?.clinicAddress || undefined,
          clinicCity: s?.clinicCity || undefined,
          clinicState: s?.clinicState || undefined,
          patientName: patient.name,
          patientBirthDate: patient.birthDate
            ? new Date(patient.birthDate + "T00:00:00").toLocaleDateString("pt-BR")
            : undefined,
          patientAge,
          recipientTitle: input.recipientTitle,
          recipientName: input.recipientName,
          referralReason: input.referralReason,
          treatmentDuration: input.treatmentDuration,
          sessionFrequency: input.sessionFrequency,
          observedSymptoms: input.observedSymptoms,
          diagnosticHypothesis: input.diagnosticHypothesis,
          recentEvolution: input.recentEvolution,
          currentMedications: input.currentMedications,
          riskFactors: input.riskFactors,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateReferralLetter(letterData);
        return {
          success: true,
          filename: `carta_encaminhamento_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar carta de encaminhamento: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar PDF de relatório financeiro
  generateFinancialPDF: protectedProcedure
    .input(
      z.object({
        from: z.number().optional(),
        to: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const pdfBuffer = await generateFinancialReport({
          userId: ctx.user.id,
          startDate: input.from ? new Date(input.from) : undefined,
          endDate: input.to ? new Date(input.to) : undefined,
        });

        return {
          success: true,
          filename: `relatorio_financeiro_${new Date().toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Declaração Psicológica
  generateDeclaracao: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        attendanceType: z.string(),
        attendanceDate: z.string(),
        attendanceDuration: z.string(),
        observations: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const declaracaoData: DeclaracaoData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          attendanceType: input.attendanceType,
          attendanceDate: input.attendanceDate,
          attendanceDuration: input.attendanceDuration,
          observations: input.observations,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateDeclaracao(declaracaoData);
        return {
          success: true,
          filename: `declaracao_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar declaração: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Atestado Psicológico
  generateAtestado: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        diagnosis: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        restrictions: z.string(),
        clinicalJustification: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const atestadoData: AtestadoData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          diagnosis: input.diagnosis,
          startDate: input.startDate,
          endDate: input.endDate,
          restrictions: input.restrictions,
          clinicalJustification: input.clinicalJustification,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateAtestado(atestadoData);
        return {
          success: true,
          filename: `atestado_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar atestado: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Laudo Psicológico
  generateLaudo: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        referralReason: z.string(),
        mainComplaint: z.string(),
        presentingProblem: z.string(),
        clinicalAssessment: z.string(),
        diagnosis: z.string(),
        recommendations: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const laudoData: LaudoData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          referralReason: input.referralReason,
          mainComplaint: input.mainComplaint,
          presentingProblem: input.presentingProblem,
          clinicalAssessment: input.clinicalAssessment,
          diagnosis: input.diagnosis,
          recommendations: input.recommendations,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateLaudo(laudoData);
        return {
          success: true,
          filename: `laudo_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar laudo: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Parecer Psicológico
  generateParecer: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        clinicalQuestion: z.string(),
        clinicalAnalysis: z.string(),
        technicalOpinion: z.string(),
        conclusion: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const parecerData: ParecerData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          clinicalQuestion: input.clinicalQuestion,
          clinicalAnalysis: input.clinicalAnalysis,
          technicalOpinion: input.technicalOpinion,
          conclusion: input.conclusion,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateParecer(parecerData);
        return {
          success: true,
          filename: `parecer_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar parecer: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Relatório Psicológico
  generateRelatorio: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        treatmentPeriod: z.string(),
        mainComplaint: z.string(),
        clinicalEvolution: z.string(),
        currentStatus: z.string(),
        recommendations: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const relatorioData: RelatorioData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          treatmentPeriod: input.treatmentPeriod,
          mainComplaint: input.mainComplaint,
          clinicalEvolution: input.clinicalEvolution,
          currentStatus: input.currentStatus,
          recommendations: input.recommendations,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateRelatorio(relatorioData);
        return {
          success: true,
          filename: `relatorio_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar relatório: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),

  // Gerar Relatório Multiprofissional
  generateRelatorioMultiprofissional: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        involvedProfessionals: z.string(),
        treatmentPeriod: z.string(),
        mainComplaint: z.string(),
        multidisciplinaryApproach: z.string(),
        interventionsPerformed: z.string(),
        clinicalEvolution: z.string(),
        recommendations: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

        const s = await getDb()
          .select()
          .from(settingsTable)
          .where(eq(settingsTable.userId, ctx.user.id))
          .limit(1)
          .then((r) => r[0]);

        const now = new Date();
        const dateStr = now.toLocaleDateString("pt-BR");

        const relatorioMultiData: RelatorioMultiprofissionalData = {
          clinicName: s?.clinicName || "Clínica",
          clinicAddress: s?.clinicAddress || "Endereço não configurado",
          clinicCity: s?.clinicCity || "Rio de Janeiro",
          clinicState: s?.clinicState || "RJ",
          professionalName: s?.ownerName || ctx.user.name || "Profissional",
          professionalCRP: s?.ownerCRP || "CRP não configurado",
          professionalSpecialty: s?.ownerSpecialty || "Psicologia",
          professionalEmail: s?.ownerEmail || "",
          professionalPhone: s?.ownerPhone || "",
          patientName: patient.name,
          patientBirthDate: new Date(patient.birthDate).toLocaleDateString("pt-BR"),
          patientAge: new Date().getFullYear() - new Date(patient.birthDate).getFullYear(),
          involvedProfessionals: input.involvedProfessionals,
          treatmentPeriod: input.treatmentPeriod,
          mainComplaint: input.mainComplaint,
          multidisciplinaryApproach: input.multidisciplinaryApproach,
          interventionsPerformed: input.interventionsPerformed,
          clinicalEvolution: input.clinicalEvolution,
          recommendations: input.recommendations,
          city: s?.clinicCity || "Rio de Janeiro",
          date: dateStr,
        };

        const pdfBuffer = await generateRelatorioMultiprofissional(relatorioMultiData);
        return {
          success: true,
          filename: `relatorio_multiprofissional_${patient.name.replace(/\s+/g, "_").toLowerCase()}_${now.toISOString().split("T")[0]}.pdf`,
          data: pdfBuffer.toString("base64"),
          mimeType: "application/pdf",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Erro ao gerar relatório multiprofissional: ${error instanceof Error ? error.message : "Desconhecido"}`,
        });
      }
    }),
});
