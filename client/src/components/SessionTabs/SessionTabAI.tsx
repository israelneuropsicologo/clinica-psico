import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  BookOpen,
  Target,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface SessionTabAIProps {
  data: any;
  onAnalyze: () => Promise<void>;
  isLoading?: boolean;
}

export function SessionTabAI({ data, onAnalyze, isLoading = false }: SessionTabAIProps) {
  const [aiResult, setAiResult] = useState(data?.aiAnalysis || "");

  useEffect(() => {
    if (data?.aiAnalysis) {
      setAiResult(data.aiAnalysis);
    }
  }, [data?.aiAnalysis]);

  const handleAnalyze = async () => {
    try {
      await onAnalyze();
    } catch (error) {
      console.error("Erro ao analisar com IA:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Legal Warning */}
      <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <AlertDescription className="text-amber-900 ml-2">
          <strong>⚠️ Aviso Legal:</strong> A IA é uma ferramenta de apoio e{" "}
          <strong>NÃO substitui o julgamento clínico</strong> do profissional. Use como supervisão
          técnica apenas.
        </AlertDescription>
      </Alert>

      {/* Main Analysis Card */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg text-gray-900">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Supervisão Técnica por IA
            </CardTitle>
            <div className="px-3 py-1 bg-green-100 rounded-full border border-green-300">
              <p className="text-xs font-semibold text-green-700">✅ Ilimitado</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <p className="text-sm text-gray-700 font-medium">
              A IA analisará todo o conteúdo do prontuário e fornecerá feedback técnico sobre:
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  icon: BookOpen,
                  label: "Clareza e Objetividade",
                  desc: "das anotações clínicas",
                },
                {
                  icon: Target,
                  label: "Lacunas de Informação",
                  desc: "dados faltantes ou incompletos",
                },
                {
                  icon: Lightbulb,
                  label: "Sugestões de Melhoria",
                  desc: "na redação clínica",
                },
                {
                  icon: AlertCircle,
                  label: "Inconsistências",
                  desc: "alertas sobre conflitos",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <feature.icon className="h-4 w-4 text-blue-600 mt-0.5 group-hover:text-blue-700 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{feature.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando prontuário...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Solicitar Análise de IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur opacity-30 animate-pulse"></div>
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin relative" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-gray-900">Analisando prontuário com IA...</p>
                <p className="text-xs text-gray-600">Processando informações clínicas</p>
              </div>
              <div className="w-full max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {aiResult && !isLoading && (
        <div className="space-y-4">
          {/* Success Badge */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-900">Análise Concluída</p>
          </div>

          {/* Results Card */}
          <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-gray-900">Feedback Técnico do Prontuário</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-code:text-indigo-600">
                <MarkdownRenderer>{aiResult}</MarkdownRenderer>
              </div>
            </CardContent>
          </Card>

          {/* Reanalyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            variant="outline"
            className="w-full gap-2 border-gray-300 hover:bg-gray-50"
          >
            <TrendingUp className="h-4 w-4" />
            Analisar Novamente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!aiResult && !isLoading && (
        <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
          <CardContent className="pt-8">
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="p-3 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full">
                <Sparkles className="h-8 w-8 text-white opacity-60" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Nenhuma análise realizada ainda</p>
                <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
                  Clique em "Solicitar Análise de IA" para obter feedback técnico detalhado sobre o
                  prontuário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
