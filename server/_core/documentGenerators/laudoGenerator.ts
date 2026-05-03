import { PDFDocument, rgb } from "pdf-lib";

export interface LaudoData {
  clinicName: string;
  clinicAddress: string;
  clinicCity: string;
  clinicState: string;
  professionalName: string;
  professionalCRP: string;
  professionalSpecialty: string;
  professionalEmail: string;
  professionalPhone: string;
  patientName: string;
  patientBirthDate: string;
  patientAge: number;
  referralReason: string;
  mainComplaint: string;
  presentingProblem: string;
  clinicalAssessment: string;
  diagnosis: string; // CID code and description
  recommendations: string;
  city: string;
  date: string;
}

export async function generateLaudo(data: LaudoData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Header with clinic info (blue background)
  page.drawRectangle({
    x: 0,
    y: height - 130,
    width: width,
    height: 130,
    color: rgb(0.1, 0.4, 0.7),
  });

  page.drawText(data.clinicName, {
    x: 40,
    y: height - 40,
    size: 20,
    color: rgb(1, 1, 1),
    maxWidth: width - 80,
  });

  page.drawText(`${data.clinicAddress}, ${data.clinicCity}, ${data.clinicState}`, {
    x: 40,
    y: height - 60,
    size: 10,
    color: rgb(1, 1, 1),
  });

  page.drawText(`${data.professionalName} | CRP: ${data.professionalCRP}`, {
    x: 40,
    y: height - 75,
    size: 10,
    color: rgb(1, 1, 1),
  });

  page.drawText(`${data.professionalEmail} | ${data.professionalPhone}`, {
    x: 40,
    y: height - 90,
  });

  // Patient info in header (NEW)
  page.drawText(`Paciente: ${data.patientName} | ${data.patientAge} anos | Nascimento: ${data.patientBirthDate}`, {
    x: 40,
    y: height - 110,
    size: 9,
    color: rgb(1, 1, 1),
    size: 9,
    color: rgb(1, 1, 1),
  });

  // Title
  page.drawText("LAUDO PSICOLÓGICO", {
    x: 40,
    y: height - 140,
    size: 18,
    color: rgb(0.1, 0.4, 0.7),
  });

  page.drawText("Avaliação Técnica Completa", {
    x: 40,
    y: height - 160,
    size: 12,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Divider line
  page.drawLine({
    start: { x: 40, y: height - 170 },
    end: { x: width - 40, y: height - 170 },
    color: rgb(0.1, 0.4, 0.7),
    thickness: 2,
  });

  let yPosition = height - 200;

  // Section 1: Identification
  page.drawText("1. IDENTIFICAÇÃO", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  page.drawText(`Paciente: ${data.patientName}`, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;
  page.drawText(`Data de Nascimento: ${data.patientBirthDate} (${data.patientAge} anos)`, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;
  page.drawText(`Profissional: ${data.professionalName}`, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;
  page.drawText(`CRP: ${data.professionalCRP} | Especialidade: ${data.professionalSpecialty}`, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  // Section 2: Referral Reason
  yPosition -= 30;
  page.drawText("2. MOTIVO DO ENCAMINHAMENTO", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const refLines = wrapText(data.referralReason, 100);
  for (const line of refLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 3: Main Complaint
  yPosition -= 20;
  page.drawText("3. QUEIXA PRINCIPAL", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const complaintLines = wrapText(data.mainComplaint, 100);
  for (const line of complaintLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 4: Presenting Problem
  yPosition -= 20;
  page.drawText("4. PROBLEMA APRESENTADO", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const problemLines = wrapText(data.presentingProblem, 100);
  for (const line of problemLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 5: Clinical Assessment
  yPosition -= 20;
  page.drawText("5. AVALIAÇÃO CLÍNICA", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const assessmentLines = wrapText(data.clinicalAssessment, 100);
  for (const line of assessmentLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 6: Diagnosis
  yPosition -= 20;
  page.drawText("6. DIAGNÓSTICO", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const diagLines = wrapText(data.diagnosis, 100);
  for (const line of diagLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 7: Recommendations
  yPosition -= 20;
  page.drawText("7. RECOMENDAÇÕES", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const recLines = wrapText(data.recommendations, 100);
  for (const line of recLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Date and location
  yPosition -= 30;
  page.drawText(`${data.city}, ${data.date}`, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  // Signature line
  yPosition -= 60;
  page.drawLine({
    start: { x: 40, y: yPosition },
    end: { x: 200, y: yPosition },
    color: rgb(0, 0, 0),
    thickness: 1,
  });

  yPosition -= 15;
  page.drawText(data.professionalName, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  yPosition -= 15;
  page.drawText(`CRP: ${data.professionalCRP}`, {
    x: 40,
    y: yPosition,
    size: 10,
    color: rgb(0, 0, 0),
  });

  // Footer
  page.drawText("Documento gerado pelo E-Saúde | Gestão Clínica — Uso exclusivo do profissional", {
    x: 40,
    y: 20,
    size: 8,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }

  if (currentLine) lines.push(currentLine.trim());
  return lines;
}
