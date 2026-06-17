import { PDFDocument } from "pdf-lib";
import { ProfessionalPDFLayout } from "./pdfLayoutHelper";

export interface DeclaracaoData {
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
  attendanceType: string;
  attendanceDate: string;
  attendanceDuration: string;
  observations: string;
  city: string;
  date: string;
}

export async function generateDeclaracao(data: DeclaracaoData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const layout = new ProfessionalPDFLayout(page);

  // Draw professional header
  layout.drawHeader({
    title: "DECLARAÇÃO",
    subtitle: "Registro Objetivo",
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

  // Draw title
  layout.drawTitle("DECLARAÇÃO", "Registro Objetivo de Atendimento");

  // Section 1: Declaration Content
  layout.drawSectionHeader(1, "DECLARAÇÃO");
  const declarationText = `Declaro para os devidos fins que ${data.patientName}, paciente sob minha responsabilidade profissional, compareceu a ${data.attendanceType} em ${data.attendanceDate}, com duração de ${data.attendanceDuration}.`;
  layout.drawText(declarationText);

  // Section 2: Observations
  if (data.observations) {
    layout.drawSectionHeader(2, "OBSERVAÇÕES");
    layout.drawText(data.observations);
  }

  // Section 3: Closing
  layout.drawSectionHeader(3, "FECHAMENTO");
  layout.drawText("Coloco-me à disposição para esclarecimentos adicionais que se façam necessários.");

  // Draw date and location
  layout.drawDateLocation(data.city, data.date);

  // Draw footer with signature
  layout.drawFooter(data.professionalName, data.professionalCRP);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
