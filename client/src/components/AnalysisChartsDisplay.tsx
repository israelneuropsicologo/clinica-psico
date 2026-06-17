import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertTriangle, PieChart as PieChartIcon, Zap } from "lucide-react";

interface AnalysisChartsDisplayProps {
  data?: {
    moodEvolution?: Array<{ session: string; value: number }>;
    riskAssessment?: Array<{ risk: string; value: number }>;
    riskDistribution?: Array<{ name: string; value: number }>;
    wellbeingProfile?: Array<{ category: string; value: number }>;
  };
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const CHART_COLORS = {
  mood: "#3b82f6",
  risk: "#ef4444",
  distribution: "#10b981",
  wellbeing: "#a855f7",
};

export function AnalysisChartsDisplay({ data }: AnalysisChartsDisplayProps) {
  // Default data for when no analysis is available
  const defaultData = {
    moodEvolution: [
      { session: "Anterior", value: 3 },
      { session: "Atual", value: 5 },
    ],
    riskAssessment: [
      { risk: "Suicídio", value: 2 },
      { risk: "Auto-agressão", value: 1 },
      { risk: "Abuso", value: 1 },
    ],
    riskDistribution: [
      { name: "Risco Baixo", value: 60 },
      { name: "Risco Moderado", value: 35 },
      { name: "Risco Alto", value: 5 },
    ],
    wellbeingProfile: [
      { category: "Humor", value: 5 },
      { category: "Sono", value: 4 },
      { category: "Energia", value: 5 },
      { category: "Estabilidade", value: 6 },
      { category: "Relacionamentos", value: 5 },
    ],
  };

  const chartData = data || defaultData;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resultado da Análise</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Evolução do Humor */}
        {chartData.moodEvolution && chartData.moodEvolution.length > 0 && (
          <Card className="border-l-4 border-l-blue-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" /> Evolução do Humor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData.moodEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="session" stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS.mood} strokeWidth={2} dot={{ fill: CHART_COLORS.mood, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Avaliação de Riscos */}
        {chartData.riskAssessment && chartData.riskAssessment.length > 0 && (
          <Card className="border-l-4 border-l-red-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Avaliação de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData.riskAssessment}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="risk" stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                  <Bar dataKey="value" fill={CHART_COLORS.risk} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribuição de Riscos */}
        {chartData.riskDistribution && chartData.riskDistribution.length > 0 && (
          <Card className="border-l-4 border-l-yellow-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-yellow-500" /> Distribuição de Riscos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.riskDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={60} fill="#8884d8" dataKey="value">
                    {chartData.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Perfil de Bem-estar */}
        {chartData.wellbeingProfile && chartData.wellbeingProfile.length > 0 && (
          <Card className="border-l-4 border-l-purple-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" /> Perfil de Bem-estar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={chartData.wellbeingProfile}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="category" stroke="#6b7280" style={{ fontSize: "11px" }} />
                  <PolarRadiusAxis stroke="#6b7280" style={{ fontSize: "11px" }} />
                  <Radar name="Bem-estar" dataKey="value" stroke={CHART_COLORS.wellbeing} fill={CHART_COLORS.wellbeing} fillOpacity={0.6} />
                  <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
