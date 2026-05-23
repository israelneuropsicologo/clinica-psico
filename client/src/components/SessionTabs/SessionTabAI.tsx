import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface SessionTabAIProps {
  data: any;
  onAnalyze: () => Promise<void>;
  isLoading?: boolean;
}

export function SessionTabAI({ data, onAnalyze, isLoading = false }: SessionTabAIProps) {
  const [aiResult, setAiResult] = useState(data?.aiAnalysis || "");
  const [tokenCost] = useState(5);

  useEffect(() => {
    if (data?.aiAnalysis) {
      setAiResult(data.aiAnalysis);
    }
  }, [data?.aiAnalysis]);

  const handleAnalyze = async () => {
    try {
      await onAnalyze();
      // The result will be updated via props
    } catch (error) {
      console.error("Erro ao analisar com IA:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-amber-300 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          ⚠️ <strong>Aviso Legal:</strong> A IA é uma ferramenta de apoio e <strong>NÃO substitui o julgamento clínico</strong> do profissional. Use como supervisão técnica apenas.
        </AlertDescription>
      </Alert>

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="h-5 w-5" />
            Supervisão Técnica por IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-blue-900">
              A IA analisará todo o conteúdo do prontuário e fornecerá feedback técnico sobre:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-900 ml-2">
              <li>Clareza e objetividade das anotações</li>
              <li>Identificação de lacunas de informação</li>
              <li>Sugestões de melhoria na redação clínica</li>
              <li>Alertas sobre inconsistências</li>
              <li>Recomendações de próximos passos</li>
            </ul>
          </div>

          <div className="bg-blue-100 p-3 rounded-lg border border-blue-300">
            <p className="text-xs text-blue-900 font-semibold">
              💰 Custo: {tokenCost} Tokens de IA por análise
            </p>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando prontuário...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Solicitar Análise de IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="border-blue-300">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground text-center">
                Analisando prontuário com IA...
              </p>
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns segundos
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {aiResult && !isLoading && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Resultado da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer>{aiResult}</MarkdownRenderer>
            </div>
          </CardContent>
        </Card>
      )}

      {!aiResult && !isLoading && (
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Nenhuma análise realizada ainda</p>
              <p className="text-xs mt-1 leading-relaxed">
                Clique em "Solicitar Análise de IA" para obter feedback técnico sobre o prontuário
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
