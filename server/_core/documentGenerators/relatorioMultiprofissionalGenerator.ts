import { PDFDocument, rgb } from "pdf-lib";

export interface RelatorioMultiprofissionalData {
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
  involvedProfessionals: string; // List of professionals and specialties
  treatmentPeriod: string;
  mainComplaint: string;
  multidisciplinaryApproach: string;
  interventionsPerformed: string;
  clinicalEvolution: string;
  recommendations: string;
  city: string;
  date: string;
}

export async function generateRelatorioMultiprofissional(
  data: RelatorioMultiprofissionalData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Header with clinic info (blue background)
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
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
    size: 9,
    color: rgb(1, 1, 1),
  });

  // Title
  page.drawText("RELATÓRIO MULTIPROFISSIONAL", {
    x: 40,
    y: height - 140,
    size: 18,
    color: rgb(0.1, 0.4, 0.7),
  });

  page.drawText("Trabalho Conjunto com Outros Profissionais", {
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
  page.drawText(`Profissional Responsável: ${data.professionalName}`, {
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

  // Section 2: Involved Professionals
  yPosition -= 30;
  page.drawText("2. PROFISSIONAIS ENVOLVIDOS", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const profLines = wrapText(data.involvedProfessionals, 100);
  for (const line of profLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 3: Treatment Period
  yPosition -= 20;
  page.drawText("3. PERÍODO DE ACOMPANHAMENTO", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  page.drawText(data.treatmentPeriod, {
    x: 40,
    y: yPosition,
    size: 11,
    color: rgb(0, 0, 0),
  });

  // Section 4: Main Complaint
  yPosition -= 30;
  page.drawText("4. QUEIXA PRINCIPAL", {
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

  // Section 5: Multidisciplinary Approach
  yPosition -= 20;
  page.drawText("5. ABORDAGEM MULTIDISCIPLINAR", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const approachLines = wrapText(data.multidisciplinaryApproach, 100);
  for (const line of approachLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 6: Interventions Performed
  yPosition -= 20;
  page.drawText("6. INTERVENÇÕES REALIZADAS", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const interventionLines = wrapText(data.interventionsPerformed, 100);
  for (const line of interventionLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 7: Clinical Evolution
  yPosition -= 20;
  page.drawText("7. EVOLUÇÃO CLÍNICA", {
    x: 40,
    y: yPosition,
    size: 12,
    color: rgb(0.1, 0.4, 0.7),
  });

  yPosition -= 20;
  const evolutionLines = wrapText(data.clinicalEvolution, 100);
  for (const line of evolutionLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 11,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  }

  // Section 8: Recommendations
  yPosition -= 20;
  page.drawText("8. RECOMENDAÇÕES", {
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

  // Section 9: Closing
  yPosition -= 30;
  const closingText = "Este relatório reflete o trabalho conjunto da equipe multiprofissional e preserva a autonomia técnica de cada profissional envolvido.";
  const closingLines = wrapText(closingText, 100);
  for (const line of closingLines) {
    page.drawText(line, {
      x: 40,
      y: yPosition,
      size: 10,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPosition -= 15;
  }

  // Date and location
  yPosition -= 20;
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
