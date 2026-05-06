import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";

interface SessionTabAIProps {
  data: any;
  onAnalyze: () => Promise<void>;
  isLoading?: boolean;
}

export function SessionTabAI({ data, onAnalyze, isLoading = false }: SessionTabAIProps) {
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);

  useEffect(() => {
    if (data?.aiAnalysisDate) {
      const date = new Date(data.aiAnalysisDate);
      setLastAnalysisTime(date.toLocaleString("pt-BR"));
    }
  }, [data?.aiAnalysisDate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise Técnica por IA</CardTitle>
          <CardDescription>
            Feedback técnico automático baseado no conteúdo do prontuário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              "Solicitar Nova Análise"
            )}
          </Button>

          {lastAnalysisTime && (
            <div className="text-sm text-muted-foreground">
              Última análise: {lastAnalysisTime}
            </div>
          )}

          {data?.aiAnalysis && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-sm mb-3">Feedback Técnico</h4>
              <div className="prose prose-sm max-w-none">
                <Streamdown>{data.aiAnalysis}</Streamdown>
              </div>
            </div>
          )}

          {data?.aiTokensUsed && (
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Tokens consumidos: {data.aiTokensUsed}
            </div>
          )}
        </CardContent>
      </Card>

      {!data?.aiAnalysis && !isLoading && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              💡 Clique em "Solicitar Nova Análise" para gerar feedback técnico automático baseado no prontuário.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
