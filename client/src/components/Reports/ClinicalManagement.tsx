// @ts-nocheck
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, TrendingUp, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ClinicalMetrics {
  clinicalNotesCreated: number;
  aiAnalysisUsage: number;
  averageNotesPerSession: number;
}

interface ClinicalManagementProps {
  data: ClinicalMetrics;
}

export function ClinicalManagement({ data }: ClinicalManagementProps) {
  const chartData = [
    {
      name: "Prontuários Criados",
      value: data.clinicalNotesCreated,
      fill: "#8b5cf6",
    },
    {
      name: "Análises com IA",
      value: data.aiAnalysisUsage,
      fill: "#06b6d4",
    },
  ];

  const aiUsagePercentage =
    data.clinicalNotesCreated > 0 ? ((data.aiAnalysisUsage / data.clinicalNotesCreated) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Gestão Clínica
          </CardTitle>
          <CardDescription>Análise de prontuários, notas clínicas e uso de ferramentas de IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
                Prontuários Criados
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{data.clinicalNotesCreated}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Notas clínicas
              </p>
            </div>

            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wide mb-1">
                Análises com IA
              </p>
              <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">{data.aiAnalysisUsage}</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-1 flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Ferramentas ativadas
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                Média por Sessão
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {data.averageNotesPerSession.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Notas/sessão
              </p>
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Análise de Uso de IA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                Utilização de IA
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Taxa de Uso</span>
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{aiUsagePercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${aiUsagePercentage}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.aiAnalysisUsage} de {data.clinicalNotesCreated} prontuários utilizaram análise por IA
                </p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Insights Clínicos
              </p>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>
                  • <strong>{data.clinicalNotesCreated}</strong> prontuários documentados
                </li>
                <li>
                  • <strong>{data.aiAnalysisUsage}</strong> análises técnicas realizadas
                </li>
                <li>
                  • Média de <strong>{data.averageNotesPerSession.toFixed(2)}</strong> notas por sessão
                </li>
                <li>
                  • Eficiência de IA: <strong>{aiUsagePercentage}%</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">Métrica</th>
                  <th className="text-right py-2 px-3 font-semibold">Valor</th>
                  <th className="text-left py-2 px-3 font-semibold">Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Prontuários Criados</td>
                  <td className="text-right py-2 px-3 font-bold text-purple-600 dark:text-purple-400">
                    {data.clinicalNotesCreated}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">Total de notas clínicas no período</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Análises com IA</td>
                  <td className="text-right py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                    {data.aiAnalysisUsage}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">Prontuários analisados por ferramentas de IA</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Taxa de Uso de IA</td>
                  <td className="text-right py-2 px-3 font-bold text-cyan-600 dark:text-cyan-400">{aiUsagePercentage}%</td>
                  <td className="py-2 px-3 text-muted-foreground">Percentual de prontuários com análise IA</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Média de Notas/Sessão</td>
                  <td className="text-right py-2 px-3 font-bold text-blue-600 dark:text-blue-400">
                    {data.averageNotesPerSession.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">Média de prontuários por sessão</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recomendações */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Recomendações</p>
            <ul className="text-xs space-y-1 text-amber-800 dark:text-amber-200">
              <li>
                • Aumente o uso de ferramentas de IA para melhorar a qualidade dos prontuários (atualmente em {aiUsagePercentage}%)
              </li>
              <li>• Mantenha a consistência na documentação de notas clínicas por sessão</li>
              <li>• Utilize as análises técnicas para otimizar o atendimento clínico</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
