import { PDFDocument } from "pdf-lib";
import { ProfessionalPDFLayout } from "./pdfLayoutHelper";

export interface AtestadoData {
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
  diagnosis: string;
  period: string;
  restrictions: string;
  observations: string;
  city: string;
  date: string;
}

export async function generateAtestado(data: AtestadoData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const layout = new ProfessionalPDFLayout(page);

  layout.drawHeader({
    title: "ATESTADO PSICOLÓGICO",
    subtitle: "Certificação Clínica",
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

  layout.drawTitle("ATESTADO PSICOLÓGICO", "Certificação Clínica");

  layout.drawSectionHeader(1, "DIAGNÓSTICO");
  layout.drawText(data.diagnosis);

  layout.drawSectionHeader(2, "PERÍODO");
  layout.drawText(data.period);

  layout.drawSectionHeader(3, "RESTRIÇÕES");
  layout.drawText(data.restrictions);

  if (data.observations) {
    layout.drawSectionHeader(4, "OBSERVAÇÕES");
    layout.drawText(data.observations);
  }

  layout.drawDateLocation(data.city, data.date);
  layout.drawFooter(data.professionalName, data.professionalCRP);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
