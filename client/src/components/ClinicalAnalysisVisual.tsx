import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  PieChart as PieChartIcon,
  Smile,
  Brain,
  Heart,
  Shield,
} from "lucide-react";

interface ClinicalAnalysisData {
  moodEvolution: Array<{ session: string; value: number }>;
  riskAssessment: Array<{ risk: string; value: number }>;
  riskDistribution: Array<{ name: string; value: number }>;
  wellbeingProfile: Array<{ category: string; value: number }>;
  patterns: string[];
  alerts: string[];
  recommendations: string[];
}

interface ClinicalAnalysisVisualProps {
  data: ClinicalAnalysisData;
  isLoading?: boolean;
}

const COLORS = {
  mood: "#3b82f6",
  risk: "#ef4444",
  distribution: "#10b981",
  wellbeing: "#a855f7",
  secondary: "#f59e0b",
};

export function ClinicalAnalysisVisual({
  data,
  isLoading = false,
}: ClinicalAnalysisVisualProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 bg-muted rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Análise Clínica Detalhada
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Visualização profissional da evolução clínica do paciente
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolução do Humor */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Evolução do Humor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.moodEvolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="session"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value) => [`${value}/10`, "Humor"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.mood}
                  strokeWidth={2}
                  dot={{ fill: COLORS.mood, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Avaliação de Riscos */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Avaliação de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.riskAssessment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="risk"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="value" fill={COLORS.risk} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Riscos */}
        <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-green-600" />
              Distribuição de Riscos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.riskDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={[COLORS.distribution, COLORS.secondary][
                        index % 2
                      ]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Perfil de Bem-estar */}
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Smile className="h-4 w-4 text-purple-600" />
              Perfil de Bem-estar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={data.wellbeingProfile}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <Radar
                  name="Bem-estar"
                  dataKey="value"
                  stroke={COLORS.wellbeing}
                  fill={COLORS.wellbeing}
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Patterns & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Padrões Identificados */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              Padrões Identificados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.patterns.map((pattern, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="mt-1 shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {idx + 1}
                </Badge>
                <p className="text-sm text-foreground">{pattern}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Pontos de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="mt-1 shrink-0 bg-red-50 text-red-700 border-red-200"
                >
                  ⚠
                </Badge>
                <p className="text-sm text-foreground">{alert}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-green-600" />
            Recomendações para Próxima Sessão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-200 text-green-700 text-xs font-semibold shrink-0">
                  {idx + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
