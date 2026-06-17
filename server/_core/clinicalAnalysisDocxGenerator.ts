import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  convertMillimetersToTwip,
} from "docx";
import { storagePut } from "../storage";

interface ClinicalAnalysisDocxOptions {
  patientName: string;
  patientId: string;
  patientEmail?: string;
  patientPhone?: string;
  patientBirthDate?: string;
  patientCPF?: string;
  patientAddress?: string;
  clinicName: string;
  psychologistName: string;
  psychologistCRP: string;
  psychologistSpecialization: string;
  analysisDate: string;
  feedback: string;
}

export async function generateClinicalAnalysisDocx(
  options: ClinicalAnalysisDocxOptions
): Promise<{ url: string; key: string; filename: string }> {
  const {
    patientName,
    patientId,
    patientEmail,
    patientPhone,
    patientBirthDate,
    patientCPF,
    patientAddress,
    clinicName,
    psychologistName,
    psychologistCRP,
    psychologistSpecialization,
    analysisDate,
    feedback,
  } = options;

  const docSections: (Paragraph | Table)[] = [];
  const abntBlue = "003d7a";

  // Header - Clinic Name
  docSections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: clinicName,
          bold: true,
          size: 24,
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
          size: 24,
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
          size: 22,
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
          text: `Especialidade: ${psychologistSpecialization}`,
          size: 22,
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
          text: `CRP-RJ: ${psychologistCRP}`,
          size: 22,
          color: "000000",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Patient Information Table - Build rows dynamically
  const patientRows: TableRow[] = [];

  // First row: Patient name and ID
  patientRows.push(
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
                  text: patientName || "",
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
                  text: patientId || "",
                  size: 22,
                }),
              ],
            }),
          ],
          width: { size: 25, type: "pct" },
        }),
      ],
    })
  );

  // Second row: Date of analysis
  patientRows.push(
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
                  text: analysisDate || "",
                  size: 22,
                }),
              ],
            }),
          ],
          width: { size: 75, type: "pct" },
          columnSpan: 3,
        }),
      ],
    })
  );

  // Third row: Birth date and CPF (if available)
  if (patientBirthDate || patientCPF) {
    patientRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Data de Nascimento:",
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
                    text: patientBirthDate || "",
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
                    text: "CPF:",
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
                    text: patientCPF || "",
                    size: 22,
                  }),
                ],
              }),
            ],
            width: { size: 25, type: "pct" },
          }),
        ],
      })
    );
  }

  // Fourth row: Phone and Email (if available)
  if (patientPhone || patientEmail) {
    patientRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Telefone:",
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
                    text: patientPhone || "",
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
                    text: "Email:",
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
                    text: patientEmail || "",
                    size: 22,
                  }),
                ],
              }),
            ],
            width: { size: 25, type: "pct" },
          }),
        ],
      })
    );
  }

  // Fifth row: Address (if available)
  if (patientAddress) {
    patientRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Endereço:",
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
                    text: patientAddress || "",
                    size: 22,
                  }),
                ],
              }),
            ],
            width: { size: 75, type: "pct" },
            columnSpan: 3,
          }),
        ],
      })
    );
  }

  docSections.push(
    new Table({
      width: { size: 100, type: "pct" },
      rows: patientRows,
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
      const sectionTitle = line.replace(/^##\s*/, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: sectionTitle,
              bold: true,
              size: 24,
              color: abntBlue,
            }),
          ],
          spacing: { before: 150, after: 100 },
        })
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      const text = line.replace(/\*\*/g, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              bold: true,
              size: 22,
            }),
          ],
          spacing: { before: 80, after: 50 },
        })
      );
    } else if (line.startsWith("-")) {
      const text = line.replace(/^-\s*/, "").trim();
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text,
              size: 22,
            }),
          ],
          spacing: { after: 40 },
          bullet: {
            level: 0,
          },
        })
      );
    } else if (line.trim().length > 0) {
      docSections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.trim(),
              size: 22,
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
          size: 20,
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
              top: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(20),
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
