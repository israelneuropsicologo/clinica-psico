import { PDFDocument } from "pdf-lib";
import { ProfessionalPDFLayout } from "./pdfLayoutHelper";

export interface ParecerData {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  professionalName: string;
  professionalCRP: string;
  professionalEmail: string;
  professionalPhone: string;
  patientName: string;
  patientBirthDate: string;
  patientAge: number;
  clinicalQuestion: string;
  analysis: string;
  conclusion: string;
  observations: string;
  city: string;
  date: string;
}

export async function generateParecer(data: ParecerData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const layout = new ProfessionalPDFLayout(page);

  layout.drawHeader({
    title: "PARECER PSICOLÓGICO",
    subtitle: "Opinião Técnica",
    headerInfo: {
      clinicName: data.clinicName,
      clinicCity: data.clinicCity,
      clinicState: data.clinicState,
      professionalName: data.professionalName,
      professionalCRP: data.professionalCRP,
      professionalEmail: data.professionalEmail,
      professionalPhone: data.professionalPhone,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientBirthDate: data.patientBirthDate,
    },
    city: data.clinicCity,
    date: data.date,
  });

  layout.drawTitle("PARECER PSICOLÓGICO", "Opinião Técnica");

  layout.drawSectionHeader(1, "QUESTÃO CLÍNICA");
  layout.drawText(data.clinicalQuestion);

  layout.drawSectionHeader(2, "ANÁLISE");
  layout.drawText(data.analysis);

  layout.drawSectionHeader(3, "CONCLUSÃO");
  layout.drawText(data.conclusion);

  if (data.observations) {
    layout.drawSectionHeader(4, "OBSERVAÇÕES");
    layout.drawText(data.observations);
  }

  layout.drawDateLocation(data.city, data.date);
  layout.drawFooter(data.professionalName, data.professionalCRP);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
