import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AnalysisItem {
  id: number;
  createdAt: Date;
  analysisType: "global" | "session" | "evolution";
  content: string;
  summary?: string;
}

interface AnalysisTimelineProps {
  analyses: AnalysisItem[];
  isLoading?: boolean;
}

export function AnalysisTimeline({ analyses, isLoading = false }: AnalysisTimelineProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      global: "Análise Global",
      session: "Análise de Sessão",
      evolution: "Análise de Evolução",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      global: "border-blue-500 bg-blue-50",
      session: "border-purple-500 bg-purple-50",
      evolution: "border-green-500 bg-green-50",
    };
    return colors[type] || "border-gray-500 bg-gray-50";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma análise registrada ainda</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card
          key={analysis.id}
          className={`border-l-4 ${getTypeColor(analysis.analysisType)} cursor-pointer transition-all hover:shadow-md`}
          onClick={() =>
            setExpandedId(expandedId === analysis.id ? null : analysis.id)
          }
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-sm">
                    {getTypeLabel(analysis.analysisType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(analysis.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {analysis.summary && (
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {analysis.summary}
                  </p>
                )}
              </div>
              <button className="ml-4 text-gray-500 hover:text-gray-700">
                {expandedId === analysis.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            {expandedId === analysis.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div
                  className="text-sm text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: analysis.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
