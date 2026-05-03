import { PDFDocument } from "pdf-lib";
import { ProfessionalPDFLayout } from "./pdfLayoutHelper";

export interface RelatorioMultiprofissionalData {
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
  professionalsInvolved: string;
  workDone: string;
  multidisciplinaryApproach: string;
  clinicalEvolution: string;
  recommendations: string[];
  observations: string;
  city: string;
  date: string;
}

export async function generateRelatorioMultiprofissional(data: RelatorioMultiprofissionalData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);

  const layout = new ProfessionalPDFLayout(page);

  layout.drawHeader({
    title: "RELATÓRIO MULTIPROFISSIONAL",
    subtitle: "Trabalho Conjunto",
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

  layout.drawTitle("RELATÓRIO MULTIPROFISSIONAL", "Trabalho Conjunto com Outros Profissionais");

  layout.drawSectionHeader(1, "PROFISSIONAIS ENVOLVIDOS");
  layout.drawText(data.professionalsInvolved);

  layout.drawSectionHeader(2, "TRABALHO REALIZADO");
  layout.drawText(data.workDone);

  layout.drawSectionHeader(3, "ABORDAGEM MULTIDISCIPLINAR");
  layout.drawText(data.multidisciplinaryApproach);

  layout.drawSectionHeader(4, "EVOLUÇÃO CLÍNICA");
  layout.drawText(data.clinicalEvolution);

  layout.drawSectionHeader(5, "RECOMENDAÇÕES");
  layout.drawBulletList(data.recommendations);

  if (data.observations) {
    layout.drawSectionHeader(6, "OBSERVAÇÕES");
    layout.drawText(data.observations);
  }

  layout.drawDateLocation(data.city, data.date);
  layout.drawFooter(data.professionalName, data.professionalCRP);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
