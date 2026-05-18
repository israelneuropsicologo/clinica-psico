// @ts-nocheck
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getDb } from "../db";
import { patients, sessions, transactions, settingsTable } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface ReportFilters {
  userId: number;
  startDate?: Date;
  endDate?: Date;
  status?: "active" | "inactive" | "all";
  leadSource?: "manual" | "chatbot" | "website" | "all";
  leadStatus?: "lead" | "prospect" | "customer" | "all";
  patientIds?: number[]; // Filter by specific patient IDs
}

// pdf-lib rgb() expects values in 0-1 range (not 0-255)
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const MEDIUM_GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.6, 0.6, 0.6);
const VERY_LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const PRIMARY_BLUE = rgb(0.1, 0.35, 0.7);
const LIGHT_BLUE_BG = rgb(0.93, 0.96, 1.0);

async function getClinicSettings(userId: number) {
  const db = await getDb();
  if (!db) return {};
  
  try {
    const settings = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId))
      .limit(1);
    
    return settings[0] || {};
  } catch (error) {
    console.error("Error fetching clinic settings:", error);
    return {};
  }
}

function formatClinicFooter(settings: any): string {
  const parts = [];
  
  if (settings.clinicAddress) {
    const address = [settings.clinicAddress, settings.clinicCity, settings.clinicState, settings.clinicZipCode]
      .filter(Boolean)
      .join(", ");
    if (address) parts.push(`Endereço: ${address}`);
  }
  
  if (settings.clinicPhone || settings.clinicEmail) {
    const contact = [settings.clinicPhone, settings.clinicEmail].filter(Boolean).join(" | ");
    if (contact) parts.push(`Contato: ${contact}`);
  }
  
  if (settings.ownerName || settings.ownerCRPNumber) {
    const prof = [settings.ownerName, settings.ownerCRPNumber ? `CRP: ${settings.ownerCRPNumber}` : null]
      .filter(Boolean)
      .join(" - ");
    if (prof) parts.push(prof);
  }
  
  return parts.join(" | ");
}

export async function generatePatientReport(filters: ReportFilters): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar dados de configurações da clínica
  const clinicSettings = await getClinicSettings(filters.userId);

  // Construir query com filtros
  const conditions: ReturnType<typeof eq>[] = [eq(patients.userId, filters.userId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(patients.status, filters.status));
  }

  if (filters.leadSource && filters.leadSource !== "all") {
    conditions.push(eq(patients.leadSource, filters.leadSource as "manual" | "chatbot" | "website"));
  }

  if (filters.leadStatus && filters.leadStatus !== "all") {
    conditions.push(eq(patients.leadStatus, filters.leadStatus as "lead" | "prospect" | "customer"));
  }

  let query = db.select().from(patients).where(and(...conditions));

  const patientList = await query.limit(1000);

  // Filter by specific patient IDs if provided
  const filteredList = filters.patientIds && filters.patientIds.length > 0
    ? patientList.filter(p => filters.patientIds!.includes(p.id))
    : patientList;

  // Criar PDF
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ─── Cabeçalho ───────────────────────────────────────────────────────────────
  // Fundo azul no cabeçalho
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: PRIMARY_BLUE });

  page.drawText(clinicSettings.clinicName || "Relatório de Pacientes", {
    x: MARGIN,
    y: PAGE_H - 45,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, {
    x: MARGIN,
    y: PAGE_H - 65,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  y = PAGE_H - 100;

  // ─── Resumo ───────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: MARGIN, y: y - 30, width: CONTENT_W, height: 40, color: LIGHT_BLUE_BG });
  page.drawText(`Total de pacientes: ${filteredList.length}`, {
    x: MARGIN + 10,
    y: y - 10,
    size: 10,
    font: fontBold,
    color: PRIMARY_BLUE,
  });

  const activeCount = filteredList.filter(p => p.status === "active").length;
  page.drawText(`Ativos: ${activeCount}  |  Inativos: ${filteredList.length - activeCount}`, {
    x: MARGIN + 10,
    y: y - 22,
    size: 9,
    font: fontRegular,
    color: MEDIUM_GRAY,
  });

  y -= 50;

  // ─── Cabeçalho da tabela ─────────────────────────────────────────────────────
  const headers = ["Nome", "E-mail", "Telefone", "Status", "Cadastro"];
  const colWidths = [140, 155, 95, 60, 62];
  let x = MARGIN;

  page.drawRectangle({ x: MARGIN, y: y - 5, width: CONTENT_W, height: 20, color: rgb(0.2, 0.2, 0.2) });

  headers.forEach((header, i) => {
    page.drawText(header, { x: x + 4, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    x += colWidths[i];
  });
  y -= 20;

  // ─── Dados dos pacientes ──────────────────────────────────────────────────────
  let rowIndex = 0;
  for (const patient of filteredList) {
    if (y < 80) {
      // Rodapé da página
      page.drawLine({ start: { x: MARGIN, y: 45 }, end: { x: PAGE_W - MARGIN, y: 45 }, thickness: 0.5, color: VERY_LIGHT_GRAY });
      page.drawText("Documento confidencial — uso exclusivo do profissional de saúde", {
        x: MARGIN, y: 32, size: 7, font: fontRegular, color: LIGHT_GRAY,
      });

      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;

      // Repetir cabeçalho da tabela na nova página
      x = MARGIN;
      page.drawRectangle({ x: MARGIN, y: y - 5, width: CONTENT_W, height: 20, color: DARK_GRAY });
      headers.forEach((header, i) => {
        page.drawText(header, { x: x + 4, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
        x += colWidths[i];
      });
      y -= 20;
      rowIndex = 0;
    }

    // Linha alternada
    if (rowIndex % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 16, color: rgb(0.97, 0.97, 0.97) });
    }

    x = MARGIN;
    const createdAt = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString("pt-BR") : "-";
    const row = [
      patient.name || "-",
      patient.email || "-",
      patient.phone || "-",
      patient.status === "active" ? "Ativo" : patient.status === "inactive" ? "Inativo" : (patient.status || "-"),
      createdAt,
    ];

    row.forEach((cell, i) => {
      const maxLen = i === 1 ? 22 : i === 0 ? 18 : 12;
      const truncated = cell.length > maxLen ? cell.substring(0, maxLen - 2) + ".." : cell;
      page.drawText(truncated, {
        x: x + 4,
        y: y + 2,
        size: 8,
        font: fontRegular,
        color: DARK_GRAY,
      });
      x += colWidths[i];
    });

    y -= 16;
    rowIndex++;
  }

  // ─── Rodapé ───────────────────────────────────────────────────────────────────
  const totalPages = pdfDoc.getPageCount();
  const footerInfo = formatClinicFooter(clinicSettings);
  
  for (let i = 0; i < totalPages; i++) {
    const pg = pdfDoc.getPage(i);
    pg.drawLine({ start: { x: MARGIN, y: 45 }, end: { x: PAGE_W - MARGIN, y: 45 }, thickness: 0.5, color: VERY_LIGHT_GRAY });
    
    pg.drawText("Documento confidencial — uso exclusivo do profissional de saúde. Protegido pelo sigilo profissional e LGPD.", {
      x: MARGIN, y: 32, size: 7, font: fontRegular, color: LIGHT_GRAY,
    });
    
    if (footerInfo) {
      pg.drawText(footerInfo, {
        x: MARGIN, y: 24, size: 6, font: fontRegular, color: LIGHT_GRAY,
      });
    }
    
    pg.drawText(`Gerado em: ${new Date().toLocaleString("pt-BR")} | Página ${i + 1} de ${totalPages}`, {
      x: MARGIN, y: 16, size: 7, font: fontRegular, color: LIGHT_GRAY,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function generateFinancialReport(filters: ReportFilters): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar dados de configurações da clínica
  const clinicSettings = await getClinicSettings(filters.userId);

  // Construir query de transações
  const conditions: ReturnType<typeof eq>[] = [eq(transactions.userId, filters.userId)];

  if (filters.startDate) {
    conditions.push(gte(transactions.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(transactions.createdAt, filters.endDate));
  }

  const transactionList = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .limit(1000);

  // Calcular totais
  const totalAmount = transactionList.reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount || '0')), 0);
  const totalCount = transactionList.length;
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  // Criar PDF
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ─── Cabeçalho ───────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: PRIMARY_BLUE });

  page.drawText(clinicSettings.clinicName || "Relatório Financeiro", {
    x: MARGIN,
    y: PAGE_H - 45,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, {
    x: MARGIN,
    y: PAGE_H - 65,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1),
  });

  y = PAGE_H - 100;

  // ─── Resumo ───────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: MARGIN, y: y - 55, width: CONTENT_W, height: 65, color: LIGHT_BLUE_BG });

  page.drawText("RESUMO FINANCEIRO", { x: MARGIN + 10, y: y - 10, size: 11, font: fontBold, color: PRIMARY_BLUE });

  page.drawText(`Total de Transações: ${totalCount}`, { x: MARGIN + 10, y: y - 25, size: 10, font: fontRegular, color: DARK_GRAY });
  page.drawText(`Valor Total: R$ ${totalAmount.toFixed(2)}`, { x: MARGIN + 10, y: y - 38, size: 10, font: fontRegular, color: DARK_GRAY });
  page.drawText(`Valor Médio: R$ ${averageAmount.toFixed(2)}`, { x: MARGIN + 10, y: y - 51, size: 10, font: fontRegular, color: DARK_GRAY });

  y -= 75;

  // ─── Cabeçalho da tabela ─────────────────────────────────────────────────────
  page.drawText("DETALHES DAS TRANSAÇÕES", { x: MARGIN, y, size: 12, font: fontBold, color: DARK_GRAY });
  y -= 20;

  const headers = ["Data", "Descrição", "Valor", "Status"];
  const colWidths = [80, 250, 100, 82];
  let x = MARGIN;

  page.drawRectangle({ x: MARGIN, y: y - 5, width: CONTENT_W, height: 20, color: DARK_GRAY });
  headers.forEach((header, i) => {
    page.drawText(header, { x: x + 4, y: y + 2, size: 9, font: fontBold, color: rgb(1, 1, 1) });
    x += colWidths[i];
  });
  y -= 20;

  // ─── Dados das transações ─────────────────────────────────────────────────────
  for (let idx = 0; idx < transactionList.length; idx++) {
    const transaction = transactionList[idx];
    if (y < 80) break;

    if (idx % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 16, color: rgb(0.97, 0.97, 0.97) });
    }

    x = MARGIN;
    const amount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount || '0');
    const row = [
      new Date(transaction.createdAt).toLocaleDateString("pt-BR"),
      transaction.description || "-",
      `R$ ${amount.toFixed(2)}`,
      transaction.status || "-",
    ];

    row.forEach((cell, i) => {
      const maxLen = i === 1 ? 35 : 14;
      const truncated = cell.length > maxLen ? cell.substring(0, maxLen - 2) + ".." : cell;
      page.drawText(truncated, { x: x + 4, y: y + 2, size: 8, font: fontRegular, color: DARK_GRAY });
      x += colWidths[i];
    });

    y -= 16;
  }

  // ─── Rodapé ───────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: MARGIN, y: 45 }, end: { x: PAGE_W - MARGIN, y: 45 }, thickness: 0.5, color: VERY_LIGHT_GRAY });
  
  page.drawText("Documento confidencial — uso exclusivo do profissional de saúde. Protegido pelo sigilo profissional e LGPD.", {
    x: MARGIN, y: 32, size: 7, font: fontRegular, color: LIGHT_GRAY,
  });
  
  const footerInfo = formatClinicFooter(clinicSettings);
  if (footerInfo) {
    page.drawText(footerInfo, {
      x: MARGIN, y: 24, size: 6, font: fontRegular, color: LIGHT_GRAY,
    });
  }
  
  page.drawText(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, {
    x: MARGIN, y: 16, size: 7, font: fontRegular, color: LIGHT_GRAY,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
