import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  convertInchesToTwip,
  convertMillimetersToTwip,
} from "docx";
import { storagePut } from "../storage";

interface ClinicalAnalysisDocxOptions {
  patientName: string;
  patientId: string;
  clinicName: string;
  psychologistName: string;
  psychologistCRP: string;
  analysisDate: string;
  feedback: string;
}

export async function generateClinicalAnalysisDocx(
  options: ClinicalAnalysisDocxOptions
): Promise<{ url: string; key: string; filename: string }> {
  const {
    patientName,
    patientId,
    clinicName,
    psychologistName,
    psychologistCRP,
    analysisDate,
    feedback,
  } = options;

  // Create document sections
  const docSections: (Paragraph | Table)[] = [];

  // ABNT Colors
  const abntBlue = "003d7a"; // Azul marinho para títulos

  // Header - Clinic Name
  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: clinicName,
          bold: true,
          size: 24, // 12pt
          color: abntBlue,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  // Title
  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ANÁLISE TÉCNICA DO PRONTUÁRIO",
          bold: true,
          size: 24, // 12pt
          color: abntBlue,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Professional Information
  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Profissional: ${psychologistName}`,
          size: 22, // 11pt
          color: "000000",
        }),
      ],
      spacing: { after: 50 },
    })
  );

  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Especialidade: Neuropsicologia`,
          size: 22, // 11pt
          color: "000000",
        }),
      ],
      spacing: { after: 50 },
    })
  );

  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${psychologistCRP}`,
          size: 22, // 11pt
          color: "000000",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Patient Information Table
  docSections.push(
    new Table({
      width: { size: 100, type: "pct" },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Paciente:",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 25, type: "pct" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: patientName,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 25, type: "pct" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "ID:",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 25, type: "pct" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: patientId,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 25, type: "pct" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Data da Análise:",
                      bold: true,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 25, type: "pct" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: analysisDate,
                      size: 22,
                    }),
                  ],
                }),
              ],
              width: { size: 75, type: "pct" },
              columnSpan: 3,
            }),
          ],
        }),
      ],
    })
  );

  docSections.push(
    new Paragraph({
      text: "",
      spacing: { after: 200 },
    })
  );

  // Parse and format the feedback content
  const feedbackLines = feedback.split("\n");

  for (const line of feedbackLines) {
    if (line.startsWith("##")) {
      // Section heading
      const sectionTitle = line.replace(/^##\s*/, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sectionTitle,
              bold: true,
              size: 24, // 12pt
              color: abntBlue,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      // Bold text (subsection)
      const text = line.replace(/\*\*/g, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              size: 22, // 11pt
            }),
          ],
          spacing: { before: 80, after: 50 },
        })
      );
    } else if (line.startsWith("-")) {
      // Bullet point
      const text = line.replace(/^-\s*/, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 40 },
          bullet: {
            level: 0,
          },
        })
      );
    } else if (line.trim().length > 0) {
      // Regular paragraph
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 80 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  }

  // Add footer
  docSections.push(
    new Paragraph({
      text: "",
      spacing: { before: 200 },
    })
  );

  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Documento gerado automaticamente pelo sistema E-Saúde",
          italics: true,
          size: 20, // 10pt
          color: "666666",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
    })
  );

  // Create the document with ABNT formatting
  const doc = new Document({
    sections: [
      {
        children: docSections as any,
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(25), // 2.5cm superior
              right: convertMillimetersToTwip(20), // 2cm direita
              bottom: convertMillimetersToTwip(25), // 2.5cm inferior
              left: convertMillimetersToTwip(20), // 2cm esquerda
            },
          },
        },
      },
    ],
  });

  // Generate the document as bytes
  const buffer = await Packer.toBuffer(doc);

  // Upload to storage
  const filename = `analise_clinica_${patientId}_${Date.now()}.docx`;
  const { url, key } = await storagePut(
    `clinical-analysis/${filename}`,
    buffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  return {
    url,
    key,
    filename,
  };
}
