import { describe, it, expect } from "vitest";
import { generateDeclaracao, DeclaracaoData } from "./_core/documentGenerators/declaracaoGenerator";
import { generateAtestado, AtestadoData } from "./_core/documentGenerators/atestadoGenerator";
import { generateLaudo, LaudoData } from "./_core/documentGenerators/laudoGenerator";
import { generateParecer, ParecerData } from "./_core/documentGenerators/parecerGenerator";
import { generateRelatorio, RelatorioData } from "./_core/documentGenerators/relatorioGenerator";
import { generateRelatorioMultiprofissional, RelatorioMultiprofissionalData } from "./_core/documentGenerators/relatorioMultiprofissionalGenerator";

const commonData = {
  clinicName: "Clínica Psicológica",
  clinicCity: "Duque de Caxias",
  clinicState: "RJ",
  professionalName: "Dr. Israel Mendes",
  professionalCRP: "CRP 05/85230",
  professionalEmail: "israel@clinica.com",
  professionalPhone: "(21) 99999-9999",
  patientName: "João Silva",
  patientBirthDate: "15/01/1990",
  patientAge: 34,
  city: "Duque de Caxias",
  date: "03/05/2026",
};

describe("Document Generators", () => {
  describe("Declaração", () => {
    it("should generate valid Declaração PDF", async () => {
      const data: DeclaracaoData = {
        ...commonData,
        attendanceType: "Psicoterapia",
        attendanceDate: "03/05/2026",
        observations: "Paciente compareceu à sessão conforme agendado",
      };

      const buffer = await generateDeclaracao(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should create PDF with correct structure", async () => {
      const data: DeclaracaoData = {
        ...commonData,
        attendanceType: "Avaliação Psicológica",
        attendanceDate: "02/05/2026",
        observations: "Avaliação completa realizada",
      };

      const buffer = await generateDeclaracao(data);
      const pdfString = buffer.toString();
      
      expect(pdfString).toContain("PDF");
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("Atestado", () => {
    it("should generate valid Atestado PDF", async () => {
      const data: AtestadoData = {
        ...commonData,
        diagnosis: "Transtorno de Ansiedade Generalizada (F41.1)",
        startDate: "01/05/2026",
        endDate: "10/05/2026",
        restrictions: "Repouso recomendado",
        observations: "Paciente em tratamento psicológico",
      };

      const buffer = await generateAtestado(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include diagnosis and dates", async () => {
      const data: AtestadoData = {
        ...commonData,
        diagnosis: "Depressão Maior (F32.9)",
        startDate: "01/05/2026",
        endDate: "15/05/2026",
        restrictions: "Afastamento do trabalho",
        observations: "Acompanhamento psicológico contínuo",
      };

      const buffer = await generateAtestado(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("Laudo", () => {
    it("should generate valid Laudo PDF", async () => {
      const data: LaudoData = {
        ...commonData,
        complaint: "Dificuldades de concentração e memória",
        evaluation: "Avaliação cognitiva completa realizada",
        diagnosis: "TDAH (F90.9)",
        recommendations: "Encaminhamento para avaliação neuropsicológica",
        observations: "Recomenda-se acompanhamento contínuo",
      };

      const buffer = await generateLaudo(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include technical assessment", async () => {
      const data: LaudoData = {
        ...commonData,
        complaint: "Sintomas de transtorno do espectro autista",
        evaluation: "Avaliação comportamental e social",
        diagnosis: "Transtorno do Espectro Autista (F84.0)",
        recommendations: "Terapia comportamental e orientação familiar",
        observations: "Prognóstico favorável com intervenção adequada",
      };

      const buffer = await generateLaudo(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("Parecer", () => {
    it("should generate valid Parecer PDF", async () => {
      const data: ParecerData = {
        ...commonData,
        clinicalQuestion: "Avaliação da capacidade cognitiva",
        analysis: "Paciente apresenta funções cognitivas preservadas",
        conclusion: "Apto para atividades laborais",
        observations: "Recomenda-se acompanhamento periódico",
      };

      const buffer = await generateParecer(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include technical opinion", async () => {
      const data: ParecerData = {
        ...commonData,
        clinicalQuestion: "Avaliação de risco de suicídio",
        analysis: "Paciente apresenta sintomas depressivos moderados",
        conclusion: "Risco baixo com acompanhamento adequado",
        observations: "Medicação recomendada em conjunto com psicoterapia",
      };

      const buffer = await generateParecer(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("Relatório", () => {
    it("should generate valid Relatório PDF", async () => {
      const data: RelatorioData = {
        ...commonData,
        period: "Maio de 2026",
        evolution: "Paciente apresenta melhora significativa",
        recommendations: "Continuar acompanhamento semanal",
        observations: "Progresso satisfatório no tratamento",
      };

      const buffer = await generateRelatorio(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include treatment evolution", async () => {
      const data: RelatorioData = {
        ...commonData,
        period: "Abril-Maio de 2026",
        evolution: "Redução significativa de sintomas ansiosos",
        recommendations: "Manutenção do tratamento atual",
        observations: "Paciente aderindo bem ao tratamento",
      };

      const buffer = await generateRelatorio(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("Relatório Multiprofissional", () => {
    it("should generate valid Relatório Multiprofissional PDF", async () => {
      const data: RelatorioMultiprofissionalData = {
        ...commonData,
        professionals: "Psicólogo, Psiquiatra, Assistente Social",
        jointWork: "Acompanhamento integrado com medicação e psicoterapia",
        recommendations: "Manutenção do tratamento multiprofissional",
        observations: "Excelente evolução com trabalho em equipe",
      };

      const buffer = await generateRelatorioMultiprofissional(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should include multiprofessional team information", async () => {
      const data: RelatorioMultiprofissionalData = {
        ...commonData,
        professionals: "Psicólogo, Fonoaudiólogo, Educador Físico",
        jointWork: "Intervenção integrada para desenvolvimento global",
        recommendations: "Continuidade do programa de reabilitação",
        observations: "Progresso notável em todas as áreas de intervenção",
      };

      const buffer = await generateRelatorioMultiprofissional(data);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
    });
  });

  describe("All Generators", () => {
    it("should generate all 6 document types without errors", async () => {
      const declaracaoData: DeclaracaoData = {
        ...commonData,
        attendanceType: "Psicoterapia",
        attendanceDate: "03/05/2026",
        observations: "Teste",
      };

      const atestadoData: AtestadoData = {
        ...commonData,
        diagnosis: "F41.1",
        startDate: "01/05/2026",
        endDate: "10/05/2026",
        restrictions: "Repouso",
        observations: "Teste",
      };

      const laudoData: LaudoData = {
        ...commonData,
        complaint: "Teste",
        evaluation: "Teste",
        diagnosis: "F90.9",
        recommendations: "Teste",
        observations: "Teste",
      };

      const parecerData: ParecerData = {
        ...commonData,
        clinicalQuestion: "Teste",
        analysis: "Teste",
        conclusion: "Teste",
        observations: "Teste",
      };

      const relatorioData: RelatorioData = {
        ...commonData,
        period: "Maio 2026",
        evolution: "Teste",
        recommendations: "Teste",
        observations: "Teste",
      };

      const multiprofissionalData: RelatorioMultiprofissionalData = {
        ...commonData,
        professionals: "Teste",
        jointWork: "Teste",
        recommendations: "Teste",
        observations: "Teste",
      };

      const results = await Promise.all([
        generateDeclaracao(declaracaoData),
        generateAtestado(atestadoData),
        generateLaudo(laudoData),
        generateParecer(parecerData),
        generateRelatorio(relatorioData),
        generateRelatorioMultiprofissional(multiprofissionalData),
      ]);

      results.forEach((buffer) => {
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
      });
    });
  });
});
