import React, { useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Heart,
  AlertTriangle,
  Lightbulb,
  Zap,
  TrendingUp,
  BarChart3,
  Activity,
  Shield,
  Smile,
  MessageSquare,
  BookOpen,
  Target,
  CheckCircle2,
  Download,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { toast } from "sonner";

interface AIAnalysisResultProps {
  content: string;
  patientHistory?: {
    previousMood?: string;
    previousSufferingLevel?: number;
    sessionCount?: number;
  };
  patientName?: string;
}

// Extrair seções do conteúdo
const extractSections = (content: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  const lines = content.split("\n");
  let currentSection = "Geral";
  let currentContent = "";

  for (const line of lines) {
    if (line.match(/^(Seção|SEÇÃO|\*\*.*?\*\*)/)) {
      if (currentContent) {
        sections[currentSection] = currentContent.trim();
      }
      currentSection = line.replace(/^\*\*|\*\*$/g, "").trim() || "Geral";
      currentContent = "";
    } else {
      currentContent += line + "\n";
    }
  }

  if (currentContent) {
    sections[currentSection] = currentContent.trim();
  }

  return sections;
};

// Extrair dados para gráficos
const extractGraphData = (
  content: string,
  patientHistory?: { previousMood?: string; previousSufferingLevel?: number; sessionCount?: number }
) => {
  const moodMatch = content.match(/Humor[:\s]*([0-9]+)/i);
  const sufferingMatch = content.match(/Sofrimento[:\s]*([0-9]+)/i);

  return {
    mood: [
      { name: "Anterior", value: patientHistory?.previousMood ? parseInt(patientHistory.previousMood) : 3 },
      { name: "Atual", value: moodMatch ? parseInt(moodMatch[1]) : 4 },
    ],
    risks: [
      { name: "Suicídio", value: sufferingMatch ? parseInt(sufferingMatch[1]) : 2 },
      { name: "Autoagressão", value: 1 },
      { name: "Risco Social", value: 1 },
    ],
  };
};

const generatePDF = async (content: string, patientName?: string) => {
  try {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    // Criar elemento HTML para capturar
    const element = document.createElement("div");
    element.style.padding = "25px 20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.fontSize = "11px";
    element.style.lineHeight = "1.6";
    element.style.color = "#000";
    element.style.backgroundColor = "#fff";
    element.style.width = "210mm";
    element.style.boxSizing = "border-box";

    // Título
    const title = document.createElement("h1");
    title.textContent = "Análise Técnica do Prontuário";
    title.style.fontSize = "18px";
    title.style.marginBottom = "15px";
    title.style.marginTop = "0";
    title.style.paddingBottom = "10px";
    title.style.borderBottom = "2px solid #ccc";
    element.appendChild(title);

    // Informações do paciente
    if (patientName) {
      const info = document.createElement("p");
      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR");
      const timeStr = now.toLocaleTimeString("pt-BR");
      info.innerHTML = `<strong>Paciente:</strong> ${patientName}<br/><strong>Data:</strong> ${dateStr} às ${timeStr}`;
      info.style.marginBottom = "20px";
      info.style.marginTop = "0";
      info.style.padding = "10px";
      info.style.backgroundColor = "#f5f5f5";
      info.style.borderRadius = "4px";
      element.appendChild(info);
    }

    // Conteúdo formatado
    const contentDiv = document.createElement("div");
    contentDiv.style.whiteSpace = "pre-wrap";
    contentDiv.style.wordWrap = "break-word";
    contentDiv.style.overflow = "visible";
    contentDiv.style.marginTop = "15px";

    // Formatar conteúdo com negrito
    const formattedContent = content
      .split(/(\*\*.*?\*\*)/g)
      .map((part) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return `<strong>${part.slice(2, -2)}</strong>`;
        }
        return part;
      })
      .join("");

    contentDiv.innerHTML = formattedContent.replace(/\n/g, "<br/>");
    element.appendChild(contentDiv);

    // Adicionar ao DOM temporariamente para renderizar
    element.style.position = "fixed";
    element.style.left = "-9999px";
    element.style.top = "-9999px";
    element.style.zIndex = "-1";
    document.body.appendChild(element);

    // Aguardar renderização
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Capturar como canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#fff",
      allowTaint: true,
    });

    // Remover do DOM
    document.body.removeChild(element);

    // Criar PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Adicionar imagem com paginação automática
    let yPosition = margin;
    let pageNum = 1;
    let remainingHeight = imgHeight;
    let sourceY = 0;

    while (remainingHeight > 0) {
      const availableHeight = pageHeight - margin * 2;
      const heightToDraw = Math.min(remainingHeight, availableHeight);

      // Calcular proporção da imagem a desenhar
      const sourceHeight = (heightToDraw * canvas.height) / imgHeight;

      // Criar canvas temporário para o recorte
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = sourceHeight;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
      }

      const pageImgData = tempCanvas.toDataURL("image/png");

      if (pageNum > 1) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(pageImgData, "PNG", margin, yPosition, imgWidth, heightToDraw);

      remainingHeight -= heightToDraw;
      sourceY += sourceHeight;
      pageNum++;
    }

    pdf.save(`analise-ia-${patientName || "paciente"}.pdf`);
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Erro ao gerar PDF: " + (error instanceof Error ? error.message : "Desconhecido"));
  }
};

export const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({ content, patientHistory, patientName }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => extractSections(content), [content]);
  const graphData = useMemo(() => extractGraphData(content, patientHistory), [content, patientHistory]);

  // Mapear seções para categorias
  const categorizedSections = useMemo(() => {
    const categorized: Record<string, string> = {};

    Object.entries(sections).forEach(([title, body]) => {
      const upperTitle = title.toUpperCase();

      if (upperTitle.includes("FEEDBACK") || upperTitle.includes("TÉCNICO")) {
        categorized["Feedback Técnico"] = body;
      } else if (upperTitle.includes("ESTADO") || upperTitle.includes("ATUAL")) {
        categorized["Estado Atual"] = body;
      } else if (upperTitle.includes("INTERVENÇÃO")) {
        categorized["Intervenções"] = body;
      } else if (upperTitle.includes("EVOLUÇÃO")) {
        categorized["Evolução"] = body;
      } else if (upperTitle.includes("RECOMENDAÇÃO")) {
        categorized["Recomendações"] = body;
      } else {
        categorized[title] = body;
      }
    });

    return categorized;
  }, [sections]);

  // Cores e ícones por categoria
  const categoryConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; borderColor: string }> = {
    "Feedback Técnico": {
      color: "#7c3aed",
      bgColor: "#f3e8ff",
      icon: <Brain className="w-5 h-5" />,
      borderColor: "#c084fc",
    },
    "Estado Atual": {
      color: "#0ea5e9",
      bgColor: "#e0f2fe",
      icon: <Activity className="w-5 h-5" />,
      borderColor: "#38bdf8",
    },
    Intervenções: {
      color: "#10b981",
      bgColor: "#ecfdf5",
      icon: <Zap className="w-5 h-5" />,
      borderColor: "#6ee7b7",
    },
    Evolução: {
      color: "#f59e0b",
      bgColor: "#fffbeb",
      icon: <TrendingUp className="w-5 h-5" />,
      borderColor: "#fcd34d",
    },
    Recomendações: {
      color: "#ef4444",
      bgColor: "#fef2f2",
      icon: <Target className="w-5 h-5" />,
      borderColor: "#fca5a5",
    },
  };

  return (
    <div ref={contentRef} className="space-y-6">
      {/* Botões de Ação */}
      <div className="flex gap-3 print:hidden">
        <Button
          onClick={() => generatePDF(content, patientName)}
          variant="outline"
          className="gap-2"
          title="Gerar PDF para download"
        >
          <Download className="w-4 h-4" />
          Pré-visualizar PDF
        </Button>
        <Button onClick={() => window.print()} variant="outline" className="gap-2" title="Imprimir análise">
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução do Humor */}
        <Card className="border-l-4" style={{ borderLeftColor: "#0ea5e9" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span style={{ color: "#0ea5e9" }}>●</span>
              Evolução do Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={graphData.mood}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9", r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avaliação de Riscos */}
        <Card className="border-l-4" style={{ borderLeftColor: "#ef4444" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span style={{ color: "#ef4444" }}>⚠</span>
              Avaliação de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={graphData.risks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Riscos */}
        <Card className="border-l-4" style={{ borderLeftColor: "#f59e0b" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span style={{ color: "#f59e0b" }}>📊</span>
              Distribuição de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={graphData.risks} dataKey="value" cx="50%" cy="50%" outerRadius={60} label>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Perfil de Bem-estar */}
        <Card className="border-l-4" style={{ borderLeftColor: "#a855f7" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span style={{ color: "#a855f7" }}>✨</span>
              Perfil de Bem-estar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[{ name: "Humor", value: 4 }, { name: "Estabilidade", value: 3 }, { name: "Segurança", value: 2 }]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Bem-estar" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seções Categorizadas */}
      {Object.entries(categorizedSections).map(([category, body]) => {
        const config = categoryConfig[category] || {
          color: "#6b7280",
          bgColor: "#f3f4f6",
          icon: <BookOpen className="w-5 h-5" />,
          borderColor: "#d1d5db",
        };

        return (
          <Card key={category} className="border-l-4 overflow-hidden" style={{ borderLeftColor: config.color }}>
            <CardHeader style={{ backgroundColor: config.bgColor }} className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={{ color: config.color }}>
                {config.icon}
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: body
                    .split(/(\*\*.*?\*\*)/g)
                    .map((part) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return `<strong style="color: ${config.color}; font-weight: 600;">${part.slice(2, -2)}</strong>`;
                      }
                      return part;
                    })
                    .join(""),
                }}
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
