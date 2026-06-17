// @ts-nocheck
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Activity, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface PatientMetrics {
  newRegistrations: number;
  activeSessions: number;
  conversionRate: number;
  totalPatients: number;
}

interface PatientMetricsProps {
  data: PatientMetrics;
}

export function PatientMetrics({ data }: PatientMetricsProps) {
  const conversionChartData = [
    { name: "Convertidos", value: data.conversionRate, fill: "#10b981" },
    { name: "Não Convertidos", value: 100 - data.conversionRate, fill: "#e5e7eb" },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Métricas de Pacientes
          </CardTitle>
          <CardDescription>Análise de novos cadastros, sessões ativas e taxa de conversão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                Novos Cadastros
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{data.newRegistrations}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Neste período
              </p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-1">
                Sessões Ativas
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{data.activeSessions}</p>
              <p className="text-xs text-purple-600 dark:text-purple-500 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Completadas
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                Taxa de Conversão
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">{data.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Triagem → Tratamento
              </p>
            </div>

            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-1">
                Total de Pacientes
              </p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{data.totalPatients}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">Ativos no sistema</p>
            </div>
          </div>

          {/* Gráfico de Taxa de Conversão */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Taxa de Conversão (Funil)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conversionChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {conversionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Convertidos: <strong>{data.conversionRate.toFixed(1)}%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                  <span>Não Convertidos: <strong>{(100 - data.conversionRate).toFixed(1)}%</strong></span>
                </div>
              </div>
            </div>

            {/* Resumo Textual */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <p className="text-sm font-semibold mb-2">Análise do Período</p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>
                    • <strong>{data.newRegistrations}</strong> novos pacientes foram cadastrados
                  </li>
                  <li>
                    • <strong>{data.activeSessions}</strong> sessões foram completadas
                  </li>
                  <li>
                    • A taxa de conversão está em <strong>{data.conversionRate.toFixed(1)}%</strong>
                  </li>
                  <li>
                    • Total de <strong>{data.totalPatients}</strong> pacientes ativos no sistema
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Média de Sessões por Paciente</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.totalPatients > 0 ? (data.activeSessions / data.totalPatients).toFixed(1) : 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">sessões por paciente</p>
              </div>
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
                  <td className="py-2 px-3 font-medium">Novos Cadastros</td>
                  <td className="text-right py-2 px-3 font-bold text-blue-600 dark:text-blue-400">{data.newRegistrations}</td>
                  <td className="py-2 px-3 text-muted-foreground">Pacientes cadastrados no período</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Sessões Ativas</td>
                  <td className="text-right py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{data.activeSessions}</td>
                  <td className="py-2 px-3 text-muted-foreground">Sessões completadas</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Taxa de Conversão</td>
                  <td className="text-right py-2 px-3 font-bold text-green-600 dark:text-green-400">{data.conversionRate.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-muted-foreground">Triagem convertida em tratamento</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Total de Pacientes</td>
                  <td className="text-right py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{data.totalPatients}</td>
                  <td className="py-2 px-3 text-muted-foreground">Pacientes ativos no sistema</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
