import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface AIAnalysisResultProps {
  content: string;
  patientHistory?: {
    previousMood?: string;
    previousSufferingLevel?: number;
    sessionCount?: number;
  };
}

// Cores por categoria
const CATEGORY_COLORS: Record<string, { bg: string; border: string; icon: React.ReactNode; color: string }> = {
  "ESTADO ATUAL": {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    color: "text-blue-700 dark:text-blue-300",
    icon: <Heart className="w-5 h-5" />,
  },
  "INTERVENÇÕES": {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    color: "text-purple-700 dark:text-purple-300",
    icon: <Zap className="w-5 h-5" />,
  },
  "EVOLUÇÃO": {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    color: "text-green-700 dark:text-green-300",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  "RISCOS": {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    color: "text-red-700 dark:text-red-300",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  "ANÁLISE TÉCNICA": {
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    border: "border-indigo-200 dark:border-indigo-800",
    color: "text-indigo-700 dark:text-indigo-300",
    icon: <Brain className="w-5 h-5" />,
  },
  "RECOMENDAÇÕES": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    color: "text-amber-700 dark:text-amber-300",
    icon: <Lightbulb className="w-5 h-5" />,
  },
};

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
    "very_bad": 1,
    "bad": 2,
    "neutral": 3,
    "good": 4,
    "very_good": 5,
  };

  const riskMap: Record<string, number> = {
    "absent": 0,
    "low": 1,
    "moderate": 2,
    "high": 3,
    "extreme": 4,
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

export const AIAnalysisResult: React.FC<AIAnalysisResultProps> = ({ content, patientHistory }) => {
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
    <div className="space-y-6">
      {/* Gráficos de Dados Relevantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução de Mood */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smile className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Evolução do Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={graphData.moodEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="session" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 5]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avaliação de Riscos */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              Avaliação de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={graphData.riskAssessment}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="risk" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" domain={[0, 4]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                  }}
                />
                <Bar dataKey="value" fill="#ef4444" />
              </BarChart>
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
