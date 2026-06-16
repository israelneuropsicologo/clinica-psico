import { PDFDocument, rgb } from "pdf-lib";

interface ClinicalAnalysisData {
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientBirthDate?: string | Date;
  patientCPF?: string;
  patientAddress?: string;
  analysisDate: Date;
  clinicName: string;
  professionalName: string;
  specialization: string;
  crp: string;
  feedback: string;
  currentState: string;
  interventionTechniques: string;
  plannedInterventions: string;
  homeAssignment: string;
  therapyPlans: string;
  evaluationProgress: string;
  clinicalInsights: string;
  observedResistances: string;
  recommendations: string;
}

export async function generateClinicalAnalysisPDF(
  data: ClinicalAnalysisData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  // Set up page (A4 size in points)
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  // Margins in points (2.5cm ≈ 71pt, 2cm ≈ 57pt)
  const marginTop = 71;
  const marginBottom = 71;
  const marginLeft = 57;
  const marginRight = 57;

  const contentWidth = width - marginLeft - marginRight;
  let yPosition = height - marginTop;

  // Colors
  const darkBlue = rgb(0, 61 / 255, 122 / 255); // #003d7a
  const black = rgb(0, 0, 0);

  // Helper function to add text with wrapping
  const addText = (
    text: string,
    size: number,
    color: any,
    isBold: boolean = false
  ) => {
    const lineHeight = size * 1.3;
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      // Approximate character width for Arial
      const estimatedWidth = testLine.length * (size * 0.5);
      
      if (estimatedWidth > contentWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);

    for (const textLine of lines) {
      if (yPosition < marginBottom + size + 10) {
        // Add new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - marginTop;
      }

      page.drawText(textLine, {
        x: marginLeft,
        y: yPosition,
        size: size,
        color: color,
      });

      yPosition -= lineHeight;
    }
  };

  // Header
  page.drawText("RELATÓRIO", {
    x: marginLeft,
    y: yPosition,
    size: 18,
    color: darkBlue,
  });
  yPosition -= 25;

  page.drawText("ANÁLISE CLÍNICA", {
    x: marginLeft,
    y: yPosition,
    size: 12,
    color: darkBlue,
  });
  yPosition -= 30;

  // Title
  addText("ANÁLISE TÉCNICA DO PRONTUÁRIO", 14, darkBlue);
  yPosition -= 15;

  // Professional information
  addText(`Profissional: ${data.professionalName}`, 11, black);
  addText(`Especialidade: ${data.specialization}`, 11, black);
  addText(`CRP-RJ: ${data.crp}`, 11, black);
  addText(`Data da Análise: ${data.analysisDate.toLocaleDateString("pt-BR")}`, 11, black);
  yPosition -= 15;

  // Patient information
  addText(`Paciente: ${data.patientName}`, 11, black);
  if (data.patientEmail) {
    addText(`Email: ${data.patientEmail}`, 11, black);
  }
  if (data.patientPhone) {
    addText(`Telefone: ${data.patientPhone}`, 11, black);
  }
  if (data.patientCPF) {
    addText(`CPF: ${data.patientCPF}`, 11, black);
  }
  if (data.patientBirthDate) {
    const birthDate = typeof data.patientBirthDate === 'string' 
      ? new Date(data.patientBirthDate).toLocaleDateString("pt-BR")
      : data.patientBirthDate.toLocaleDateString("pt-BR");
    addText(`Data de Nascimento: ${birthDate}`, 11, black);
  }
  if (data.patientAddress) {
    addText(`Endereço: ${data.patientAddress}`, 11, black);
  }
  yPosition -= 20;

  // Sections
  const sections = [
    { title: "FEEDBACK TÉCNICO DO PRONTUÁRIO", content: data.feedback },
    { title: "ESTADO ATUAL", content: data.currentState },
    { title: "TÉCNICAS DE INTERVENÇÃO", content: data.interventionTechniques },
    { title: "INTERVENÇÕES PLANEJADAS", content: data.plannedInterventions },
    { title: "TAREFA DE CASA", content: data.homeAssignment },
    { title: "PLANO TERAPÊUTICO", content: data.therapyPlans },
    { title: "PROGRESSO DOS OBJETIVOS", content: data.evaluationProgress },
    { title: "INSIGHTS CLÍNICOS", content: data.clinicalInsights },
    { title: "RESISTÊNCIAS OBSERVADAS", content: data.observedResistances },
    { title: "RECOMENDAÇÕES", content: data.recommendations },
  ];

  for (const section of sections) {
    if (yPosition < marginBottom + 80) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - marginTop;
    }

    page.drawText(section.title, {
      x: marginLeft,
      y: yPosition,
      size: 12,
      color: darkBlue,
    });
    yPosition -= 18;

    addText(section.content, 10, black);
    yPosition -= 12;
  }

  // Footer
  const footerY = marginBottom - 15;
  page.drawText(
    `Documento gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
    {
      x: marginLeft,
      y: footerY,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
