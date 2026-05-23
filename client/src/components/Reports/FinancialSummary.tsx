// @ts-nocheck
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, DollarSign } from "lucide-react";

interface FinancialData {
  grossRevenue: number;
  operationalExpenses: number;
  pendingPayments: number;
  paidAmount: number;
}

interface FinancialSummaryProps {
  data: FinancialData;
}

export function FinancialSummary({ data }: FinancialSummaryProps) {
  const chartData = [
    {
      name: "Receita Bruta",
      value: data.grossRevenue,
      fill: "#10b981",
    },
    {
      name: "Despesas",
      value: data.operationalExpenses,
      fill: "#ef4444",
    },
    {
      name: "Pendências",
      value: data.pendingPayments,
      fill: "#f59e0b",
    },
  ];

  const netRevenue = data.grossRevenue - data.operationalExpenses;
  const margin = data.grossRevenue > 0 ? ((netRevenue / data.grossRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Resumo Financeiro
          </CardTitle>
          <CardDescription>Análise de receitas, despesas e pagamentos pendentes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
                Receita Bruta
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.grossRevenue)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Total recebido
              </p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">
                Despesas Operacionais
              </p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  data.operationalExpenses
                )}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Gastos do período
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide mb-1">
                Pagamentos Pendentes
              </p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  data.pendingPayments
                )}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                A receber
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">
                Lucro Líquido
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netRevenue)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                Margem: <strong>{margin}%</strong>
              </p>
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div className="w-full h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                  }
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">Categoria</th>
                  <th className="text-right py-2 px-3 font-semibold">Valor</th>
                  <th className="text-right py-2 px-3 font-semibold">% do Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">Receita Bruta</td>
                  <td className="text-right py-2 px-3 font-medium text-green-600 dark:text-green-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      data.grossRevenue
                    )}
                  </td>
                  <td className="text-right py-2 px-3">100%</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">Despesas Operacionais</td>
                  <td className="text-right py-2 px-3 font-medium text-red-600 dark:text-red-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      data.operationalExpenses
                    )}
                  </td>
                  <td className="text-right py-2 px-3">
                    {data.grossRevenue > 0 ? ((data.operationalExpenses / data.grossRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3">Pagamentos Pendentes</td>
                  <td className="text-right py-2 px-3 font-medium text-yellow-600 dark:text-yellow-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      data.pendingPayments
                    )}
                  </td>
                  <td className="text-right py-2 px-3">
                    {data.grossRevenue > 0 ? ((data.pendingPayments / data.grossRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-950/20 font-semibold">
                  <td className="py-2 px-3">Lucro Líquido</td>
                  <td className="text-right py-2 px-3 text-blue-600 dark:text-blue-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netRevenue)}
                  </td>
                  <td className="text-right py-2 px-3">{margin}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
