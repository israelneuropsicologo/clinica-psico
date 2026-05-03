import { PDFDocument } from "pdf-lib";
import { ProfessionalPDFLayout } from "./pdfLayoutHelper";

export interface RelatorioData {
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
  period: string;
  evolution: string;
  recommendations: string[];
  observations: string;
  city: string;
  date: string;
}

export async function generateRelatorio(data: RelatorioData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const layout = new ProfessionalPDFLayout(page);

  layout.drawHeader({
    title: "RELATÓRIO PSICOLÓGICO",
    subtitle: "Descritivo Informativo",
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

  layout.drawTitle("RELATÓRIO PSICOLÓGICO", "Descritivo Informativo");

  layout.drawSectionHeader(1, "PERÍODO");
  layout.drawText(data.period);

  layout.drawSectionHeader(2, "EVOLUÇÃO");
  layout.drawText(data.evolution);

  layout.drawSectionHeader(3, "RECOMENDAÇÕES");
  layout.drawBulletList(data.recommendations);

  if (data.observations) {
    layout.drawSectionHeader(4, "OBSERVAÇÕES");
    layout.drawText(data.observations);
  }

  layout.drawDateLocation(data.city, data.date);
  layout.drawFooter(data.professionalName, data.professionalCRP);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
