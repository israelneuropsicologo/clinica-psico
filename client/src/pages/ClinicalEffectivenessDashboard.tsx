/**
 * Clinical Effectiveness Dashboard
 * 
 * Visualiza métricas de efetividade clínica:
 * - Efetividade de técnicas
 * - Taxa de conversão por fonte
 * - Retenção de pacientes
 * - Análise estratégica mensal
 */

import React, { useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Users, Target, Activity } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function ClinicalEffectivenessDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Fetch effectiveness summary
  const { data: summary, isLoading: summaryLoading } = trpc.clinicalEffectiveness.getEffectivenessSummary.useQuery();

  // Fetch conversion metrics
  const { data: conversionMetrics, isLoading: conversionLoading } = trpc.clinicalEffectiveness.getConversionMetrics.useQuery();

  // Fetch strategy analytics
  const { data: strategyAnalytics, isLoading: analyticsLoading } = trpc.clinicalEffectiveness.getStrategyAnalytics.useQuery();

  if (summaryLoading || conversionLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Prepare data for charts
  const conversionBySourceData = summary?.conversionBySource || [];
  const latestAnalytics = summary?.latestAnalytics;

  // Calculate metrics
  const avgConversionRate = summary?.summary?.averageConversionRate || 0;
  const avgRetentionRate = summary?.summary?.averageRetentionRate || 0;
  const totalMetricsRecorded = summary?.summary?.totalMetricsRecorded || 0;

  // Prepare monthly trend data
  const monthlyTrendData = (strategyAnalytics || [])
    .slice(0, 12)
    .reverse()
    .map((analytics: any) => ({
      month: analytics.period,
      effectiveness: analytics.averageEffectiveness || 0,
      conversion: analytics.conversionRate || 0,
      retention: analytics.retentionRate || 0,
    }));

  // Prepare technique effectiveness data
  const techniqueData = [
    { name: "CBT", effectiveness: 85, sessions: 45 },
    { name: "Psicodrama", effectiveness: 78, sessions: 32 },
    { name: "Mindfulness", effectiveness: 82, sessions: 28 },
    { name: "Gestalt", effectiveness: 75, sessions: 20 },
    { name: "Psicanálise", effectiveness: 70, sessions: 15 },
  ];

  // Prepare lead source data
  const leadSourceData = [
    { name: "Chatbot", value: 35, color: "#3b82f6" },
    { name: "Indicação", value: 25, color: "#10b981" },
    { name: "Website", value: 20, color: "#f59e0b" },
    { name: "Manual", value: 15, color: "#ef4444" },
    { name: "Outros", value: 5, color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Efetividade Clínica</h1>
        <p className="text-muted-foreground mt-2">
          Análise estratégica de técnicas, conversão e retenção de pacientes
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média de lead → paciente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRetentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Pacientes que continuam</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Métricas Registradas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetricsRecorded}</div>
            <p className="text-xs text-muted-foreground">Períodos com dados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efetividade Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestAnalytics?.averageEffectiveness?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Última análise</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="techniques">Técnicas</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Conversion by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Fonte</CardTitle>
                <CardDescription>Taxa de conversão por origem de lead</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionBySourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="conversionRate" fill="#3b82f6" name="Taxa %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Lead Source Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Leads</CardTitle>
                <CardDescription>Origem dos leads por percentual</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Latest Analytics */}
          {latestAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Análise Estratégica - {latestAnalytics.period}</CardTitle>
                <CardDescription>Resumo do período mais recente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                    <p className="text-2xl font-bold">{latestAnalytics.totalPatients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
                    <p className="text-2xl font-bold">{latestAnalytics.activePatients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Novos Pacientes</p>
                    <p className="text-2xl font-bold">{latestAnalytics.newPatients}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Melhora</p>
                    <p className="text-2xl font-bold">{latestAnalytics.improvementRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>
                {latestAnalytics.topTechnique && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Técnica Mais Efetiva</p>
                    <p className="text-lg font-semibold">
                      {latestAnalytics.topTechnique}{" "}
                      <Badge className="ml-2">
                        {latestAnalytics.topTechniqueEffectiveness?.toFixed(1)}%
                      </Badge>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Techniques Tab */}
        <TabsContent value="techniques">
          <Card>
            <CardHeader>
              <CardTitle>Efetividade por Técnica</CardTitle>
              <CardDescription>Desempenho de cada técnica clínica</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={techniqueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="effectiveness" fill="#10b981" name="Efetividade %" />
                  <Bar yAxisId="right" dataKey="sessions" fill="#3b82f6" name="Sessões" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Conversão</CardTitle>
              <CardDescription>Detalhes de conversão por fonte de lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionBySourceData.map((item: any) => (
                  <div key={item.source} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.source}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.convertedLeads} de {item.totalLeads} leads
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.conversionRate?.toFixed(1) || 0}%</p>
                      <Badge variant={item.conversionRate > 30 ? "default" : "secondary"}>
                        {item.conversionRate > 30 ? "Bom" : "Melhorar"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Mensais</CardTitle>
              <CardDescription>Evolução de métricas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="effectiveness"
                    stroke="#10b981"
                    name="Efetividade %"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversion"
                    stroke="#3b82f6"
                    name="Conversão %"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="#f59e0b"
                    name="Retenção %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      {latestAnalytics?.recommendations && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Recomendações Estratégicas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800">{latestAnalytics.recommendations}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
