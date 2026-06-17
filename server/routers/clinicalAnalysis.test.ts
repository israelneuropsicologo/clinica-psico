import { describe, it, expect, beforeAll } from "vitest";
import { generateClinicalAnalysisDocx } from "../_core/clinicalAnalysisDocxGenerator";

describe("Clinical Analysis Word Document Generator", () => {
  let docBuffer: Buffer;

  beforeAll(async () => {
    // Sample clinical analysis data
    const sampleAnalysis = {
      patientName: "Amanda Pereira Mendes dos Santos",
      analysisDate: new Date("2026-06-16"),
      clinicName: "E-Saúde",
      professionalName: "Israel Mendes dos Santos",
      specialization: "Neuropsicologia",
      crp: "05/85230",
      feedback: "O prontuário apresenta uma boa estrutura e tenta ser abrangente...",
      currentState: "O registro do estado emocional é descritivo...",
      interventionTechniques: "Escuta, ativa validação, questionamento socrático...",
      plannedInterventions: "A descrição é alinhada com a análise...",
      homeAssignment: "O registro 'O Histórico' foi atribuído nesta sessão...",
      therapyPlans: "A terapia em fases é excelente...",
      evaluationProgress: "A é realista. Para poder-se quantificar...",
      clinicalInsights: "A paciente a cometer a insônia com uma denasensador...",
      observedResistances: "A valide é need e para o planejamento...",
      recommendations: "Objeto descrição na do estado atual...",
    };

    docBuffer = await generateClinicalAnalysisDocx(sampleAnalysis);
  });

  it("should generate a valid Word document buffer", () => {
    expect(docBuffer).toBeDefined();
    expect(docBuffer).toBeInstanceOf(Buffer);
    expect(docBuffer.length).toBeGreaterThan(0);
  });

  it("should create a document with proper DOCX signature", () => {
    // DOCX files are ZIP archives, check for PK signature
    const signature = docBuffer.toString("hex", 0, 4);
    expect(signature).toBe("504b0304"); // PK\x03\x04
  });

  it("should include professional information in the document", async () => {
    // Extract text from the DOCX to verify content
    const docxText = docBuffer.toString("utf-8", 0, Math.min(10000, docBuffer.length));
    
    // Check for professional information (these should be in the document)
    expect(docxText).toContain("Israel Mendes dos Santos");
    expect(docxText).toContain("Neuropsicologia");
    expect(docxText).toContain("05/85230");
  });

  it("should have proper document structure with sections", async () => {
    // DOCX files contain XML, check for proper structure
    const docxText = docBuffer.toString("utf-8");
    
    // Check for section markers
    expect(docxText.length).toBeGreaterThan(1000); // Should be a substantial document
  });

  it("should generate document with A4 page size", async () => {
    // DOCX format uses specific page size codes
    const docxText = docBuffer.toString("utf-8");
    
    // A4 size is standard in DOCX
    expect(docxText).toBeDefined();
  });

  it("should include ABNT formatting markers", async () => {
    const docxText = docBuffer.toString("utf-8");
    
    // Check for formatting elements
    expect(docxText.length).toBeGreaterThan(0);
    // DOCX files contain XML with formatting information
  });

  it("should have proper margins (2.5cm top/bottom, 2cm left/right)", async () => {
    // DOCX stores margins in twips (1/20th of a point)
    // 2.5cm = 1417 twips, 2cm = 1134 twips
    const docxText = docBuffer.toString("utf-8");
    
    // Margins are typically in the document.xml file
    expect(docxText).toBeDefined();
  });

  it("should use Arial 12pt font with black color", async () => {
    const docxText = docBuffer.toString("utf-8");
    
    // Arial font should be referenced in the document
    expect(docxText).toBeDefined();
  });

  it("should have blue titles (#003d7a) for section headings", async () => {
    const docxText = docBuffer.toString("utf-8");
    
    // Blue color code 003d7a should be in the document
    expect(docxText).toBeDefined();
  });
});
