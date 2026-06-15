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
import { useState } from "react";

interface AIAnalysisResultProps {
  content: string;
  patientHistory?: {
    previousMood?: string;
    previousSufferingLevel?: number;
    sessionCount?: number;
  };
  patientName?: string;
}

// Cores para cada categoria
const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  "Análise Histórica Global": { bg: "#e0f2fe", border: "#0284c7", icon: "📊" },
  "Análise do Último Atendimento": { bg: "#fef3c7", border: "#d97706", icon: "📋" },
  "Análise de Risco": { bg: "#fee2e2", border: "#dc2626", icon: "⚠️" },
  "Análise de Evolução": { bg: "#e0fdf4", border: "#059669", icon: "📈" },
  "Análise Técnica do Prontuário": { bg: "#f3e8ff", border: "#9333ea", icon: "🔬" },
};

// Dados de exemplo para gráficos
const moodData = [
  { name: "Anterior", value: 3 },
  { name: "Atual", value: 4 },
];

const riskData = [
  { name: "Risco Social", value: 2 },
  { name: "Risco Emocional", value: 1 },
  { name: "Risco Físico", value: 1 },
];

const riskDistribution = [
  { name: "Baixo", value: 30, fill: "#10b981" },
  { name: "Moderado", value: 50, fill: "#f59e0b" },
  { name: "Alto", value: 20, fill: "#ef4444" },
];

const wellbeingData = [
  { subject: "Humor", A: 4 },
  { subject: "Energia", A: 3 },
  { subject: "Sono", A: 2 },
  { subject: "Apetite", A: 3 },
  { subject: "Motivação", A: 4 },
];

const generatePDF = async (content: string, patientName?: string) => {
  try {
    const { jsPDF } = await import("jspdf");

    // Criar PDF com texto puro (sem html2canvas)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 25;
    const textWidth = pageWidth - margin * 2;
    const lineHeight = 5;
    let yPosition = margin;

    // Adicionar título
    pdf.setFontSize(16);
    pdf.setFont("", "bold");
    pdf.text("Análise Técnica do Prontuário", margin, yPosition);
    yPosition += 10;

    // Adicionar informações do paciente
    pdf.setFontSize(10);
    pdf.setFont("", "normal");
    if (patientName) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR");
      const timeStr = now.toLocaleTimeString("pt-BR");
      pdf.text(`Paciente: ${patientName}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`Data: ${dateStr} às ${timeStr}`, margin, yPosition);
      yPosition += 15;
    }

    // Adicionar linha separadora
    pdf.setDrawColor(200);
    pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
    yPosition += 5;

    // Adicionar conteúdo formatado
    pdf.setFontSize(9);
    const lines = content.split("\n");

    for (const line of lines) {
      // Verificar se precisa de nova página
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = margin;
      }

      if (!line.trim()) {
        yPosition += lineHeight / 2;
        continue;
      }

      // Processar negrito - quebrar linha inteira e renderizar com formatacao
      const parts = line.split(/(\*\*.*?\*\*)/g).filter(p => p);
      const wrappedLines = pdf.splitTextToSize(line.replace(/\*\*/g, ""), textWidth);
      
      for (const wrappedLine of wrappedLines) {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = margin;
        }

        let xPos = margin;
        let tempLine = wrappedLine;
        
        for (const part of parts) {
          if (!part || !tempLine.includes(part.replace(/\*\*/g, ""))) continue;
          
          const isBold = part.startsWith("**") && part.endsWith("**");
          const cleanText = part.replace(/\*\*/g, "");
          
          if (!tempLine.includes(cleanText)) continue;
          
          const beforeText = tempLine.substring(0, tempLine.indexOf(cleanText));
          
          if (beforeText) {
            pdf.setFont("", "normal");
            pdf.text(beforeText, xPos, yPosition);
            xPos += pdf.getStringUnitWidth(beforeText) * 12 / pdf.internal.scaleFactor;
          }
          
          pdf.setFont("", isBold ? "bold" : "normal");
          pdf.text(cleanText, xPos, yPosition);
          xPos += pdf.getStringUnitWidth(cleanText) * 12 / pdf.internal.scaleFactor;
          
          tempLine = tempLine.substring(tempLine.indexOf(cleanText) + cleanText.length);
        }
        
        if (tempLine) {
          pdf.setFont("", "normal");
          pdf.text(tempLine, xPos, yPosition);
        }
        
        yPosition += lineHeight;
      }
    }

    // Salvar PDF
    pdf.save(`analise-${patientName || "paciente"}-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
};

export function AIAnalysisResult({ content, patientHistory, patientName }: AIAnalysisResultProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handlePrint = () => {
    window.print();
  };

  // Altura responsiva dos gráficos
  const chartHeight = isMobile ? 200 : 250;
  const chartMargin = isMobile ? { top: 5, right: 5, left: -15, bottom: 5 } : { top: 10, right: 10, left: 0, bottom: 10 };
  const pieRadius = isMobile ? 45 : 60;

  return (
    <div className="space-y-6">
      {/* Botões de ação - responsivos */}
      <div className="flex gap-2 justify-end flex-wrap">
        <Button
          onClick={() => generatePDF(content, patientName)}
          variant="outline"
          size="sm"
          className="gap-2 text-xs md:text-sm"
        >
          <Download className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Pré-visualizar PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
        <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2 text-xs md:text-sm">
          <Printer className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Imprimir</span>
          <span className="sm:hidden">Print</span>
        </Button>
      </div>

      {/* Gráficos - responsivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução do Humor */}
        <Card className="border-l-4" style={{ borderLeftColor: "#0284c7" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="truncate">Evolução do Humor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={moodData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} width={isMobile ? 25 : 35} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "6px" }} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0284c7" 
                  strokeWidth={2} 
                  dot={{ fill: "#0284c7", r: isMobile ? 3 : 4 }}
                  activeDot={{ r: isMobile ? 5 : 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avaliação de Riscos */}
        <Card className="border-l-4" style={{ borderLeftColor: "#dc2626" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              <span className="truncate">Avaliação de Riscos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={riskData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={isMobile ? -45 : 0} textAnchor={isMobile ? "end" : "middle"} height={isMobile ? 60 : 40} />
                <YAxis tick={{ fontSize: 11 }} width={isMobile ? 25 : 35} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "6px" }} />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Riscos */}
        <Card className="border-l-4" style={{ borderLeftColor: "#f59e0b" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="truncate">Distribuição de Riscos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart margin={chartMargin}>
                <Pie 
                  data={riskDistribution} 
                  cx="50%" 
                  cy="50%" 
                  labelLine={false} 
                  outerRadius={pieRadius} 
                  fill="#8884d8" 
                  dataKey="value"
                  label={isMobile ? false : { fontSize: 11 }}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "6px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Perfil de Bem-estar */}
        <Card className="border-l-4" style={{ borderLeftColor: "#9333ea" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2">
              <Smile className="h-4 w-4 text-purple-600 shrink-0" />
              <span className="truncate">Perfil de Bem-estar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <RadarChart data={wellbeingData} margin={chartMargin}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} />
                <Radar dataKey="A" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: "6px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo da análise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Brain className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
            <span>Análise Detalhada</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {content.split("\n\n").map((section, idx) => (
              <div key={idx} className="mb-4 p-3 md:p-4 rounded-lg bg-muted/50">
                <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed text-justify">
                  {section.split(/(\*\*.*?\*\*)/g).map((part, i) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
