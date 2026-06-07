import React, { useState } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle, Brain, Zap, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trpc } from '@/lib/trpc';

export function AIAnalytics() {
  const [, navigate] = useLocation();
  const [monthsBack, setMonthsBack] = useState(5);

  // Fetch real data from backend
  const { data: analyticsData, isLoading, error } = trpc.aiAnalytics.getDashboardData.useQuery({
    monthsBack,
  });

  // Use real data or defaults
  const emotionalPatterns = analyticsData?.emotionalPatterns || [];
  const interventionEffectiveness = analyticsData?.interventionEffectiveness || [];
  const riskFactors = analyticsData?.riskFactors || [];
  const recommendations = analyticsData?.recommendations || [];
  const kpis = analyticsData?.kpis || {
    improvementRate: 0,
    patientsAtRisk: 0,
    averageEffectiveness: 0,
    insightsGenerated: 0,
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando análise de IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar ao Dashboard</span>
          </button>
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar ao Dashboard</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de IA</h1>
            <p className="text-muted-foreground">Análise de padrões comportamentais e recomendações de intervenção</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Últimos</label>
            <select
              value={monthsBack}
              onChange={(e) => setMonthsBack(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md bg-background text-foreground"
            >
              <option value={1}>1 mês</option>
              <option value={3}>3 meses</option>
              <option value={5}>5 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Melhora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">+{kpis.improvementRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">Comparado ao período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{kpis.patientsAtRisk}</div>
            <p className="text-xs text-muted-foreground mt-2">Requerem atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Efetividade Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{kpis.averageEffectiveness}%</div>
            <p className="text-xs text-muted-foreground mt-2">Das intervenções recomendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Insights Gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{kpis.insightsGenerated}</div>
            <p className="text-xs text-muted-foreground mt-2">Neste período</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Emotional Patterns */}
        {emotionalPatterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Evolução de Padrões Emocionais
              </CardTitle>
              <CardDescription>Últimos {monthsBack} meses - Tendência de evolução</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emotionalPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="anxiety" stroke="#ef4444" strokeWidth={2} name="Ansiedade" />
                  <Line type="monotone" dataKey="depression" stroke="#3b82f6" strokeWidth={2} name="Depressão" />
                  <Line type="monotone" dataKey="stress" stroke="#f59e0b" strokeWidth={2} name="Estresse" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Intervention Effectiveness */}
        {interventionEffectiveness.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Efetividade de Intervenções
              </CardTitle>
              <CardDescription>Taxa de sucesso por tipo de intervenção</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interventionEffectiveness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="effectiveness" fill="#3b82f6" name="Taxa de Efetividade (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Fatores de Risco Identificados
            </CardTitle>
            <CardDescription>Análise de fatores que impactam a evolução clínica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {riskFactors.map((factor) => (
                <div key={factor.factor} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{factor.factor}</span>
                    <Badge variant={factor.risk > 60 ? 'destructive' : factor.risk > 40 ? 'secondary' : 'outline'}>
                      {factor.risk}%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        factor.risk > 60 ? 'bg-red-500' : factor.risk > 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${factor.risk}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tendência: <span className="font-medium">{factor.trend === 'up' ? '↑' : factor.trend === 'down' ? '↓' : '→'}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Recomendações de Intervenção
            </CardTitle>
            <CardDescription>Sugestões baseadas em análise de IA e efetividade histórica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority === 'high' ? 'Alta Prioridade' : 'Média Prioridade'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
                    <TrendingUp className="h-4 w-4" />
                    <span>{rec.impact}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {emotionalPatterns.length === 0 && interventionEffectiveness.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sem dados para análise</h3>
              <p className="text-muted-foreground mb-4">
                Crie sessões e adicione notas clínicas para que a IA possa gerar análises e recomendações.
              </p>
              <Button onClick={() => navigate('/sessions')} variant="outline">
                Ir para Sessões
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
