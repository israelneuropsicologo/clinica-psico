import { PDFDocument, rgb, degrees } from "pdf-lib";
import { getDb } from "../db";
import { patients, sessions, transactions } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface ReportFilters {
  userId: number;
  startDate?: Date;
  endDate?: Date;
  status?: "active" | "inactive" | "all";
  leadSource?: "manual" | "chatbot" | "website" | "all";
  leadStatus?: "lead" | "prospect" | "customer" | "all";
}

export async function generatePatientReport(filters: ReportFilters): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Construir query com filtros
  const conditions: any[] = [eq(patients.userId, filters.userId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(patients.status, filters.status));
  }

  if (filters.leadSource && filters.leadSource !== "all") {
    conditions.push(eq(patients.leadSource, filters.leadSource as any));
  }

  if (filters.leadStatus && filters.leadStatus !== "all") {
    conditions.push(eq(patients.leadStatus, filters.leadStatus as any));
  }

  const patientList = await db
    .select()
    .from(patients)
    .where(and(...conditions))
    .limit(1000);

  // Criar PDF
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Tamanho A4
  let y = 750;

  // Cabeçalho
  page.drawText("Relatório de Pacientes", {
    x: 50,
    y,
    size: 24,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Data do relatório
  page.drawText(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, {
    x: 50,
    y,
    size: 10,
    color: rgb(100, 100, 100),
  });
  y -= 30;

  // Filtros aplicados
  const filterText = `Filtros: Status=${filters.status || "todos"} | Origem=${filters.leadSource || "todas"} | Tipo=${filters.leadStatus || "todos"}`;
  page.drawText(filterText, {
    x: 50,
    y,
    size: 9,
    color: rgb(100, 100, 100),
  });
  y -= 30;

  // Cabeçalho da tabela
  const headers = ["Nome", "Email", "Telefone", "Status", "Origem", "Tipo"];
  const columnWidths = [120, 130, 100, 70, 80, 80];
  let x = 50;

  page.drawText("─".repeat(80), {
    x: 50,
    y,
    size: 10,
    color: rgb(150, 150, 150),
  });
  y -= 15;

  headers.forEach((header, i) => {
    page.drawText(header, {
      x,
      y,
      size: 10,
      color: rgb(0, 0, 0),
    });
    x += columnWidths[i];
  });
  y -= 20;

  page.drawText("─".repeat(80), {
    x: 50,
    y,
    size: 10,
    color: rgb(150, 150, 150),
  });
  y -= 15;

  // Dados dos pacientes
  for (const patient of patientList) {
    if (y < 50) {
      page = pdfDoc.addPage([612, 792]);
      y = 750;
    }

    x = 50;
    const row = [
      patient.name || "-",
      patient.email || "-",
      patient.phone || "-",
      patient.status || "-",
      patient.leadSource || "-",
      patient.leadStatus || "-",
    ];

    row.forEach((cell, i) => {
      const truncated = cell.length > 15 ? cell.substring(0, 12) + "..." : cell;
      page.drawText(truncated, {
        x,
        y,
        size: 9,
        color: rgb(50, 50, 50),
      });
      x += columnWidths[i];
    });

    y -= 15;
  }

  // Rodapé
  y -= 20;
  page.drawText("─".repeat(80), {
    x: 50,
    y,
    size: 10,
    color: rgb(150, 150, 150),
  });
  y -= 15;

  page.drawText(`Total de pacientes: ${patientList.length}`, {
    x: 50,
    y,
    size: 10,
    color: rgb(0, 0, 0),
  });

  // Salvar PDF em buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function generateFinancialReport(filters: ReportFilters): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Construir query de transações
  const conditions: any[] = [eq(transactions.userId, filters.userId)];

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
  const page = pdfDoc.addPage([612, 792]);
  let y = 750;

  // Cabeçalho
  page.drawText("Relatório Financeiro", {
    x: 50,
    y,
    size: 24,
    color: rgb(0, 0, 0),
  });
  y -= 40;

  // Data do relatório
  page.drawText(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, {
    x: 50,
    y,
    size: 10,
    color: rgb(100, 100, 100),
  });
  y -= 30;

  // Resumo
  page.drawText("RESUMO FINANCEIRO", {
    x: 50,
    y,
    size: 14,
    color: rgb(0, 0, 0),
  });
  y -= 25;

  page.drawText(`Total de Transações: ${totalCount}`, {
    x: 50,
    y,
    size: 11,
    color: rgb(50, 50, 50),
  });
  y -= 20;

  page.drawText(`Valor Total: R$ ${totalAmount.toFixed(2)}`, {
    x: 50,
    y,
    size: 11,
    color: rgb(50, 50, 50),
  });
  y -= 20;

  page.drawText(`Valor Médio: R$ ${averageAmount.toFixed(2)}`, {
    x: 50,
    y,
    size: 11,
    color: rgb(50, 50, 50),
  });
  y -= 40;

  // Detalhes das transações
  page.drawText("DETALHES DAS TRANSAÇÕES", {
    x: 50,
    y,
    size: 14,
    color: rgb(0, 0, 0),
  });
  y -= 25;

  const headers = ["Data", "Descrição", "Valor", "Status"];
  const columnWidths = [100, 250, 100, 100];
  let x = 50;

  headers.forEach((header, i) => {
    page.drawText(header, {
      x,
      y,
      size: 10,
      color: rgb(0, 0, 0),
    });
    x += columnWidths[i];
  });
  y -= 20;

  page.drawText("─".repeat(80), {
    x: 50,
    y,
    size: 10,
    color: rgb(150, 150, 150),
  });
  y -= 15;

  // Dados das transações
  for (const transaction of transactionList.slice(0, 15)) {
    x = 50;
    const amount = typeof transaction.amount === 'number' ? transaction.amount : parseFloat(transaction.amount || '0');
    const row = [
      new Date(transaction.createdAt).toLocaleDateString("pt-BR"),
      transaction.description || "-",
      `R$ ${amount.toFixed(2)}`,
      transaction.status || "-",
    ];

    row.forEach((cell, i) => {
      const truncated = cell.length > 20 ? cell.substring(0, 17) + "..." : cell;
      page.drawText(truncated, {
        x,
        y,
        size: 9,
        color: rgb(50, 50, 50),
      });
      x += columnWidths[i];
    });

    y -= 15;
  }

  // Salvar PDF em buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
