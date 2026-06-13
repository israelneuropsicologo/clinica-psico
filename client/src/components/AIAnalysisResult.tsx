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

// Cores vibrantes por categoria
const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: React.ReactNode; color: string; chartColor: string }> = {
  "ESTADO ATUAL": {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    color: "text-blue-700 dark:text-blue-300",
    chartColor: "#0ea5e9",
    icon: <Heart className="w-5 h-5" />,
  },
  "INTERVENÇÕES": {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    color: "text-purple-700 dark:text-purple-300",
    chartColor: "#a855f7",
    icon: <Zap className="w-5 h-5" />,
  },
  "EVOLUÇÃO": {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    color: "text-green-700 dark:text-green-300",
    chartColor: "#10b981",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  "RISCOS": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    color: "text-red-700 dark:text-red-300",
    chartColor: "#ef4444",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  "ANÁLISE TÉCNICA": {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
    color: "text-indigo-700 dark:text-indigo-300",
    chartColor: "#6366f1",
    icon: <Brain className="w-5 h-5" />,
  },
  "RECOMENDAÇÕES": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    color: "text-amber-700 dark:text-amber-300",
    chartColor: "#f59e0b",
    icon: <Lightbulb className="w-5 h-5" />,
  },
};

// Cores para gráficos
const CHART_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

// Ícones para pontos específicos
const POINT_ICONS: Record<string, React.ReactNode> = {
  "Estado emocional": <Smile className="w-4 h-4" />,
  "Humor": <Smile className="w-4 h-4" />,
  "Nível de sofrimento": <Heart className="w-4 h-4" />,
  "Técnicas utilizadas": <Zap className="w-4 h-4" />,
  "Sugestão de aprimoramento": <Lightbulb className="w-4 h-4" />,
  "Resposta ao tratamento": <CheckCircle2 className="w-4 h-4" />,
  "Risco": <AlertTriangle className="w-4 h-4" />,
  "Ausente": <Shield className="w-4 h-4" />,
  "Baixo": <Activity className="w-4 h-4" />,
  "Moderado": <AlertTriangle className="w-4 h-4" />,
  "Alto": <AlertTriangle className="w-4 h-4" />,
  "Extremo": <AlertTriangle className="w-4 h-4" />,
};

// Extrair dados para gráficos
const extractGraphData = (content: string, history?: AIAnalysisResultProps["patientHistory"]) => {
  const moodMap: Record<string, number> = {
    very_bad: 1,
    bad: 2,
    neutral: 3,
    good: 4,
    very_good: 5,
  };

  const riskMap: Record<string, number> = {
    absent: 0,
    low: 1,
    moderate: 2,
    high: 3,
    extreme: 4,
  };

  // Extrair mood da análise
  const moodMatch = content.match(/mood["\s:]*["\']?(very_bad|bad|neutral|good|very_good)/i);
  const currentMood = moodMatch ? moodMap[moodMatch[1]] : 3;

  // Extrair nível de sofrimento
  const sufferingMatch = content.match(/sofrimento["\s:]*(\d+)/i) || content.match(/suffering["\s:]*(\d+)/i);
  const currentSuffering = sufferingMatch ? parseInt(sufferingMatch[1]) : 5;

  // Extrair riscos
  const selfHarmMatch = content.match(/selfHarmRisk["\s:]*["\']?(absent|low|moderate|high|extreme)/i);
  const thirdPartyMatch = content.match(/thirdPartyRisk["\s:]*["\']?(absent|low|moderate|high|extreme)/i);
  const suicideMatch = content.match(/suicideRisk["\s:]*["\']?(absent|low|moderate|high|extreme)/i);

  const selfHarmRisk = selfHarmMatch ? riskMap[selfHarmMatch[1]] : 0;
  const thirdPartyRisk = thirdPartyMatch ? riskMap[thirdPartyMatch[1]] : 0;
  const suicideRisk = suicideMatch ? riskMap[suicideMatch[1]] : 0;

  return {
    moodEvolution: [
      { session: "Anterior", value: history?.previousMood ? moodMap[history.previousMood] || 3 : 3 },
      { session: "Atual", value: currentMood },
    ],
    sufferingEvolution: [
      { session: "Anterior", value: history?.previousSufferingLevel || 5 },
      { session: "Atual", value: currentSuffering },
    ],
    riskAssessment: [
      { risk: "Auto-agressão", value: selfHarmRisk },
      { risk: "Terceiros", value: thirdPartyRisk },
      { risk: "Suicídio", value: suicideRisk },
    ],
    riskPie: [
      { name: "Baixo/Ausente", value: (4 - selfHarmRisk) + (4 - thirdPartyRisk) + (4 - suicideRisk), fill: "#10b981" },
      { name: "Moderado", value: Math.max(0, selfHarmRisk + thirdPartyRisk + suicideRisk - 6), fill: "#f59e0b" },
      { name: "Alto", value: Math.max(0, selfHarmRisk + thirdPartyRisk + suicideRisk - 3), fill: "#ef4444" },
    ].filter(item => item.value > 0),
    radarData: [
      { category: "Humor", value: currentMood * 20 },
      { category: "Sofrimento", value: (10 - currentSuffering) * 10 },
      { category: "Estabilidade", value: 60 },
      { category: "Engajamento", value: 70 },
    ],
  };
};

// Formatar texto com negrito
const formatBoldText = (text: string) => {
  return text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

// Extrair seções da análise
const extractSections = (content: string) => {
  const sections: Record<string, string> = {};
  const sectionRegex = /^(SEÇÃO \d+[^:]*|[A-Z][A-Z\s]+?)[\s\n]*[-–]?\s*([\s\S]*?)(?=^[A-Z][A-Z\s]*[-–]|$)/gm;

  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const body = match[2].trim();
    if (title && body) {
      sections[title] = body;
    }
  }

  return sections;
};

// Gerar PDF com html2pdf
const generatePDF = async (content: string, patientName?: string) => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    
    // Criar elemento HTML para capturar
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.fontSize = "11px";
    element.style.lineHeight = "1.5";
    element.style.color = "#000";
    
    // Título
    const title = document.createElement("h1");
    title.textContent = "Análise Técnica do Prontuário";
    title.style.fontSize = "18px";
    title.style.marginBottom = "10px";
    title.style.marginTop = "0";
    element.appendChild(title);
    
    // Informações do paciente
    if (patientName) {
      const info = document.createElement("p");
      info.innerHTML = `<strong>Paciente:</strong> ${patientName}<br/><strong>Data:</strong> ${new Date().toLocaleDateString("pt-BR")}`;
      info.style.marginBottom = "15px";
      info.style.marginTop = "0";
      element.appendChild(info);
    }
    
    // Conteúdo formatado
    const contentDiv = document.createElement("div");
    contentDiv.style.whiteSpace = "pre-wrap";
    contentDiv.style.wordWrap = "break-word";
    contentDiv.style.overflow = "visible";
    
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
    
    // Configurar opções do html2pdf
    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `analise-ia-${patientName || "paciente"}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    } as any;
    
    // Gerar PDF
    await html2pdf().set(options).from(element).save();
    toast.success("PDF gerado com sucesso!");
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    toast.error("Erro ao gerar PDF");
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

      if (upperTitle.includes("ESTADO") || upperTitle.includes("EMOCIONAL") || upperTitle.includes("APRESENTAÇÃO")) {
        categorized["ESTADO ATUAL"] = (categorized["ESTADO ATUAL"] || "") + (categorized["ESTADO ATUAL"] ? "\n\n" : "") + body;
      } else if (upperTitle.includes("INTERVENÇÃO") || upperTitle.includes("TÉCNICA")) {
        categorized["INTERVENÇÕES"] = (categorized["INTERVENÇÕES"] || "") + (categorized["INTERVENÇÕES"] ? "\n\n" : "") + body;
      } else if (upperTitle.includes("EVOLUÇÃO") || upperTitle.includes("RESPOSTA") || upperTitle.includes("PROGRESSO")) {
        categorized["EVOLUÇÃO"] = (categorized["EVOLUÇÃO"] || "") + (categorized["EVOLUÇÃO"] ? "\n\n" : "") + body;
      } else if (upperTitle.includes("RISCO")) {
        categorized["RISCOS"] = (categorized["RISCOS"] || "") + (categorized["RISCOS"] ? "\n\n" : "") + body;
      } else if (upperTitle.includes("ANÁLISE") || upperTitle.includes("TÉCNICA") || upperTitle.includes("HIPÓTESE")) {
        categorized["ANÁLISE TÉCNICA"] = (categorized["ANÁLISE TÉCNICA"] || "") + (categorized["ANÁLISE TÉCNICA"] ? "\n\n" : "") + body;
      } else if (upperTitle.includes("RECOMENDAÇÃO") || upperTitle.includes("SUGESTÃO")) {
        categorized["RECOMENDAÇÕES"] = (categorized["RECOMENDAÇÕES"] || "") + (categorized["RECOMENDAÇÕES"] ? "\n\n" : "") + body;
      }
    });

    return categorized;
  }, [sections]);

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Botões de Ação */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => generatePDF(content, patientName)}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Pré-visualizar PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>

      {/* Gráficos Modernos com Cores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução de Mood com Cores */}
        <Card className="border-sky-200 dark:border-sky-800 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-sky-700 dark:text-sky-300">
              <Smile className="w-4 h-4" />
              Evolução do Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={graphData.moodEvolution}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="session" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 5]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "2px solid #0ea5e9",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ fill: "#0ea5e9", r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avaliação de Riscos com Cores */}
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4" />
              Avaliação de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={graphData.riskAssessment}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="risk" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 4]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "2px solid #ef4444",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="url(#colorRisk)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Riscos - Pizza */}
        {graphData.riskPie.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <BarChart3 className="w-4 h-4" />
                Distribuição de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={graphData.riskPie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {graphData.riskPie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-background)",
                      border: "2px solid #f59e0b",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Radar de Bem-estar */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Activity className="w-4 h-4" />
              Perfil de Bem-estar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={graphData.radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis dataKey="category" stroke="var(--color-muted-foreground)" />
                <PolarRadiusAxis stroke="var(--color-muted-foreground)" />
                <Radar name="Bem-estar" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "2px solid #a855f7",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seções Categorizadas */}
      {Object.entries(categorizedSections).map(([category, body]) => {
        const categoryConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS["ANÁLISE TÉCNICA"];
        const lines = body.split("\n").filter((line) => line.trim());

        return (
          <Card key={category} className={`border-2 ${categoryConfig.border} ${categoryConfig.bg}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm flex items-center gap-2 ${categoryConfig.color}`}>
                {categoryConfig.icon}
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lines.map((line, idx) => {
                // Verificar se é um ponto de lista
                const isListItem = line.match(/^[•\-*]\s+/);
                const cleanLine = line.replace(/^[•\-*]\s+/, "").trim();

                // Encontrar ícone apropriado
                let icon = null;
                for (const [key, iconComponent] of Object.entries(POINT_ICONS)) {
                  if (cleanLine.toLowerCase().includes(key.toLowerCase())) {
                    icon = iconComponent;
                    break;
                  }
                }

                return (
                  <div key={idx} className={`flex gap-3 ${isListItem ? "items-start" : "items-start"}`}>
                    {icon && <div className="mt-1 flex-shrink-0">{icon}</div>}
                    <p className={`text-sm leading-relaxed ${!icon && isListItem ? "ml-2" : ""}`}>
                      {formatBoldText(cleanLine)}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Fallback se não houver seções extraídas */}
      {Object.keys(categorizedSections).length === 0 && (
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <BookOpen className="w-5 h-5" />
              Análise Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <p className="whitespace-pre-wrap">{formatBoldText(content)}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
