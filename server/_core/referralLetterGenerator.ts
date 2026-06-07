import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Colors
const BLACK = rgb(0, 0, 0);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const MEDIUM_GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.65, 0.65, 0.65);
const PRIMARY_BLUE = rgb(0.1, 0.35, 0.7);
const LIGHT_BLUE_BG = rgb(0.93, 0.96, 1.0);
const SECTION_BG = rgb(0.96, 0.97, 0.99);
const WHITE = rgb(1, 1, 1);
const TEAL = rgb(0.05, 0.55, 0.55);

export interface ReferralLetterData {
  // Profissional Solicitante
  professionalName: string;
  professionalCRP: string;
  professionalSpecialty: string;
  professionalEmail: string;
  professionalPhone: string;
  clinicName: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;

  // Paciente
  patientName: string;
  patientBirthDate?: string;
  patientAge?: number;

  // Destinatário
  recipientTitle: string; // ex: "Ao Médico Psiquiatra", "À Equipe de Neuropediatria"
  recipientName?: string; // nome do profissional destinatário (opcional)

  // Contextualização
  referralReason: string; // motivo do encaminhamento
  treatmentDuration: string; // ex: "6 meses", "1 ano e 3 meses"
  sessionFrequency: string; // ex: "Semanal", "Quinzenal"

  // Aspectos Clínicos
  observedSymptoms: string;
  diagnosticHypothesis?: string; // ex: "F41.1 (CID-11) – Transtorno de Ansiedade Generalizada"
  recentEvolution: string;

  // Observações Éticas
  currentMedications?: string;
  riskFactors?: string; // riscos urgentes (ideação suicida, etc.)

  // Fechamento
  city: string;
  date: string; // ex: "03 de maio de 2026"
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: any,
  fontSize: number,
  color: any,
  lineHeight: number
): number {
  if (!text || text.trim() === "") return y;
  const lines = wrapText(text, maxWidth, font, fontSize);
  for (const line of lines) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    y -= lineHeight;
  }
  return y;
}

export async function generateReferralLetter(data: ReferralLetterData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_W = 595; // A4 width in points
  const PAGE_H = 842; // A4 height in points
  const MARGIN = 55;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // ─── Cabeçalho com fundo azul ────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 90, width: PAGE_W, height: 90, color: PRIMARY_BLUE });

  // Nome da clínica
  page.drawText(data.clinicName, {
    x: MARGIN,
    y: PAGE_H - 32,
    size: 16,
    font: fontBold,
    color: WHITE,
  });

  // Endereço da clínica
  const clinicAddressLine = [data.clinicAddress, data.clinicCity, data.clinicState].filter(Boolean).join(", ");
  if (clinicAddressLine) {
    page.drawText(clinicAddressLine, {
      x: MARGIN,
      y: PAGE_H - 50,
      size: 8,
      font: fontRegular,
      color: rgb(0.85, 0.9, 1.0),
    });
  }

  // Profissional
  page.drawText(`${data.professionalName} | CRP: ${data.professionalCRP}`, {
    x: MARGIN,
    y: PAGE_H - 65,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.9, 1.0),
  });

  const contactLine = [data.professionalPhone, data.professionalEmail].filter(Boolean).join("  |  ");
  if (contactLine) {
    page.drawText(contactLine, {
      x: MARGIN,
      y: PAGE_H - 78,
      size: 8,
      font: fontRegular,
      color: rgb(0.75, 0.85, 1.0),
    });
  }

  y = PAGE_H - 90 - 20;

  // ─── Título do Documento ─────────────────────────────────────────────────
  page.drawText("CARTA DE ENCAMINHAMENTO", {
    x: MARGIN,
    y,
    size: 14,
    font: fontBold,
    color: PRIMARY_BLUE,
  });
  y -= 6;

  // Linha decorativa
  page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 2, color: PRIMARY_BLUE });
  y -= 16;

  // ─── Destinatário ────────────────────────────────────────────────────────
  page.drawText(data.recipientTitle, {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: DARK_GRAY,
  });
  y -= 14;

  if (data.recipientName) {
    page.drawText(data.recipientName, {
      x: MARGIN,
      y,
      size: 10,
      font: fontRegular,
      color: MEDIUM_GRAY,
    });
    y -= 14;
  }

  y -= 8;

  // ─── Seção 1: Identificação ──────────────────────────────────────────────
  function drawSectionHeader(title: string, yPos: number): number {
    page.drawRectangle({ x: MARGIN, y: yPos - 4, width: CONTENT_W, height: 20, color: LIGHT_BLUE_BG });
    page.drawRectangle({ x: MARGIN, y: yPos - 4, width: 4, height: 20, color: PRIMARY_BLUE });
    page.drawText(title, {
      x: MARGIN + 10,
      y: yPos + 2,
      size: 10,
      font: fontBold,
      color: PRIMARY_BLUE,
    });
    return yPos - 28;
  }

  function drawField(label: string, value: string, yPos: number, indent = 0): number {
    if (!value || value.trim() === "") return yPos;
    page.drawText(`${label}:`, {
      x: MARGIN + indent,
      y: yPos,
      size: 9,
      font: fontBold,
      color: DARK_GRAY,
    });
    const labelWidth = fontBold.widthOfTextAtSize(`${label}: `, 9);
    const valueX = MARGIN + indent + labelWidth;
    const valueMaxW = CONTENT_W - indent - labelWidth;
    const lines = wrapText(value, valueMaxW, fontRegular, 9);
    if (lines.length === 1) {
      page.drawText(lines[0], { x: valueX, y: yPos, size: 9, font: fontRegular, color: DARK_GRAY });
      return yPos - 14;
    } else {
      page.drawText(lines[0], { x: valueX, y: yPos, size: 9, font: fontRegular, color: DARK_GRAY });
      let newY = yPos - 13;
      for (let i = 1; i < lines.length; i++) {
        page.drawText(lines[i], { x: MARGIN + indent + 8, y: newY, size: 9, font: fontRegular, color: DARK_GRAY });
        newY -= 13;
      }
      return newY - 1;
    }
  }

  y = drawSectionHeader("1. IDENTIFICAÇÃO", y);

  // Dados do paciente
  page.drawText("Paciente:", { x: MARGIN + 4, y, size: 9, font: fontBold, color: TEAL });
  y -= 13;
  y = drawField("Nome", data.patientName, y, 8);
  if (data.patientBirthDate) {
    const ageStr = data.patientAge ? ` (${data.patientAge} anos)` : "";
    y = drawField("Data de Nascimento", `${data.patientBirthDate}${ageStr}`, y, 8);
  } else if (data.patientAge) {
    y = drawField("Idade", `${data.patientAge} anos`, y, 8);
  }
  y -= 4;

  // Dados do profissional
  page.drawText("Profissional Solicitante:", { x: MARGIN + 4, y, size: 9, font: fontBold, color: TEAL });
  y -= 13;
  y = drawField("Nome", data.professionalName, y, 8);
  y = drawField("CRP", data.professionalCRP, y, 8);
  if (data.professionalSpecialty) y = drawField("Especialidade", data.professionalSpecialty, y, 8);
  if (data.professionalEmail) y = drawField("E-mail", data.professionalEmail, y, 8);
  if (data.professionalPhone) y = drawField("Telefone", data.professionalPhone, y, 8);
  y -= 10;

  // ─── Seção 2: Contextualização ───────────────────────────────────────────
  y = drawSectionHeader("2. CONTEXTUALIZAÇÃO DA DEMANDA", y);

  y = drawField("Motivo do Encaminhamento", data.referralReason, y, 4);
  y = drawField("Tempo de Acompanhamento", data.treatmentDuration, y, 4);
  y = drawField("Frequência das Sessões", data.sessionFrequency, y, 4);
  y -= 10;

  // ─── Seção 3: Aspectos Clínicos ──────────────────────────────────────────
  y = drawSectionHeader("3. ASPECTOS CLÍNICOS RELEVANTES", y);

  // Sintomatologia
  page.drawText("Sintomatologia Observada:", { x: MARGIN + 4, y, size: 9, font: fontBold, color: DARK_GRAY });
  y -= 13;
  y = drawWrappedText(page, data.observedSymptoms, MARGIN + 8, y, CONTENT_W - 12, fontRegular, 9, DARK_GRAY, 13);
  y -= 6;

  if (data.diagnosticHypothesis) {
    y = drawField("Hipótese Diagnóstica", data.diagnosticHypothesis, y, 4);
    y -= 4;
  }

  // Evolução recente
  page.drawText("Evolução Recente:", { x: MARGIN + 4, y, size: 9, font: fontBold, color: DARK_GRAY });
  y -= 13;
  y = drawWrappedText(page, data.recentEvolution, MARGIN + 8, y, CONTENT_W - 12, fontRegular, 9, DARK_GRAY, 13);
  y -= 10;

  // ─── Seção 4: Observações Éticas ─────────────────────────────────────────
  y = drawSectionHeader("4. OBSERVAÇÕES ÉTICAS E TÉCNICAS", y);

  if (data.currentMedications) {
    y = drawField("Uso de Medicação", data.currentMedications, y, 4);
    y -= 4;
  }

  if (data.riskFactors) {
    y = drawField("Fatores de Risco", data.riskFactors, y, 4);
    y -= 4;
  }

  // Cláusula de sigilo
  const sigiloText =
    "Informações íntimas do processo terapêutico que não interferem diretamente no trabalho do profissional destinatário foram preservadas em conformidade com o Código de Ética Profissional do Psicólogo (CFP).";
  page.drawText("Sigilo:", { x: MARGIN + 4, y, size: 9, font: fontBold, color: DARK_GRAY });
  y -= 13;
  y = drawWrappedText(page, sigiloText, MARGIN + 8, y, CONTENT_W - 12, fontOblique, 8.5, MEDIUM_GRAY, 12);
  y -= 10;

  // ─── Seção 5: Fechamento ─────────────────────────────────────────────────
  y = drawSectionHeader("5. FECHAMENTO", y);

  const disponibilidadeText =
    "Coloco-me à disposição para discutir o caso e fornecer informações complementares que se façam necessárias para o atendimento do paciente.";
  y = drawWrappedText(page, disponibilidadeText, MARGIN + 4, y, CONTENT_W - 8, fontRegular, 9, DARK_GRAY, 13);
  y -= 16;

  // Local e data
  const localData = `${data.city}, ${data.date}`;
  page.drawText(localData, {
    x: MARGIN,
    y,
    size: 9,
    font: fontRegular,
    color: MEDIUM_GRAY,
  });
  y -= 40;

  // Linha de assinatura
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + 200, y },
    thickness: 0.8,
    color: DARK_GRAY,
  });
  y -= 12;

  page.drawText(data.professionalName, {
    x: MARGIN,
    y,
    size: 9,
    font: fontBold,
    color: DARK_GRAY,
  });
  y -= 12;

  page.drawText(`CRP: ${data.professionalCRP}`, {
    x: MARGIN,
    y,
    size: 8,
    font: fontRegular,
    color: MEDIUM_GRAY,
  });
  y -= 11;

  if (data.professionalSpecialty) {
    page.drawText(data.professionalSpecialty, {
      x: MARGIN,
      y,
      size: 8,
      font: fontRegular,
      color: MEDIUM_GRAY,
    });
    y -= 11;
  }

  // ─── Rodapé ──────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 28, color: LIGHT_BLUE_BG });
  page.drawLine({
    start: { x: 0, y: 28 },
    end: { x: PAGE_W, y: 28 },
    thickness: 0.5,
    color: rgb(0.8, 0.85, 0.95),
  });
  page.drawText("Documento gerado pelo E-Saúde | Gestão Clínica — Uso exclusivo do profissional", {
    x: MARGIN,
    y: 10,
    size: 7,
    font: fontRegular,
    color: LIGHT_GRAY,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
