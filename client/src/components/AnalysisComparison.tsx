import React, { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AnalysisItem {
  id: number;
  createdAt: Date;
  analysisType: "global" | "session" | "evolution";
  content: string;
  summary?: string;
}

interface AnalysisComparisonProps {
  analyses: AnalysisItem[];
  isLoading?: boolean;
  onCompare?: (startDate: Date, endDate: Date) => void;
}

export function AnalysisComparison({
  analyses,
  isLoading = false,
  onCompare,
}: AnalysisComparisonProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedAnalyses, setSelectedAnalyses] = useState<AnalysisItem[]>([]);

  const handleCompare = () => {
    if (!startDate || !endDate) {
      alert("Selecione ambas as datas");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert("Data inicial deve ser anterior à data final");
      return;
    }

    const filtered = analyses.filter((a) => {
      const date = new Date(a.createdAt);
      return date >= start && date <= end;
    });

    setSelectedAnalyses(filtered);
    onCompare?.(start, end);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de Datas */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Comparar Análises por Período
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="start-date" className="text-sm font-medium mb-2 block">
              Data Inicial
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-end justify-center pb-2">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          <div>
            <Label htmlFor="end-date" className="text-sm font-medium mb-2 block">
              Data Final
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Button
          onClick={handleCompare}
          className="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700"
        >
          Comparar Análises
        </Button>
      </Card>

      {/* Resultados da Comparação */}
      {selectedAnalyses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {selectedAnalyses.length} análise(s) encontrada(s)
            </h3>
            <span className="text-sm text-gray-500">
              {startDate && endDate
                ? `${format(new Date(startDate), "dd/MM/yyyy")} até ${format(
                    new Date(endDate),
                    "dd/MM/yyyy"
                  )}`
                : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {selectedAnalyses.map((analysis, idx) => (
              <Card key={analysis.id} className="p-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">
                      Análise {idx + 1}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(analysis.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    {analysis.analysisType === "global"
                      ? "Global"
                      : analysis.analysisType === "session"
                      ? "Sessão"
                      : "Evolução"}
                  </span>
                </div>

                {analysis.summary && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {analysis.summary}
                  </p>
                )}

                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded line-clamp-4">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: analysis.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .substring(0, 200) + "...",
                    }}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Resumo Comparativo */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h4 className="font-semibold mb-3 text-sm">📊 Resumo do Período</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {selectedAnalyses.length}
                </p>
                <p className="text-xs text-gray-600">Análises</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {selectedAnalyses.filter((a) => a.analysisType === "global").length}
                </p>
                <p className="text-xs text-gray-600">Globais</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {selectedAnalyses.filter((a) => a.analysisType === "session").length}
                </p>
                <p className="text-xs text-gray-600">Sessões</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {selectedAnalyses.filter((a) => a.analysisType === "evolution").length}
                </p>
                <p className="text-xs text-gray-600">Evolução</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedAnalyses.length === 0 && startDate && endDate && (
        <Card className="p-8 text-center text-gray-500">
          <p>Nenhuma análise encontrada no período selecionado</p>
        </Card>
      )}
    </div>
  );
}
