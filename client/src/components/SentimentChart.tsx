/**
 * Sentiment Trend Chart Component
 * Displays sentiment analysis over time with interactive charts
 */

import React, { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SentimentTrendPoint {
  date: Date;
  sentimentScore: number;
  label: "negative" | "neutral" | "positive";
}

interface SentimentChartProps {
  data: SentimentTrendPoint[];
  title?: string;
  description?: string;
  showPieChart?: boolean;
}

const SENTIMENT_COLORS = {
  negative: "#ef4444",
  neutral: "#f59e0b",
  positive: "#10b981",
};

const getSentimentLabel = (score: number): "negative" | "neutral" | "positive" => {
  if (score < -0.3) return "negative";
  if (score > 0.3) return "positive";
  return "neutral";
};

export function SentimentChart({
  data,
  title = "Sentiment Trend",
  description = "Patient sentiment analysis over time",
  showPieChart = true,
}: SentimentChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: new Date(point.date).toLocaleDateString("pt-BR"),
      score: Math.round(point.sentimentScore * 100),
      label: point.label,
    }));
  }, [data]);

  const sentimentCounts = useMemo(() => {
    const counts = { negative: 0, neutral: 0, positive: 0 };
    data.forEach((point) => {
      counts[point.label]++;
    });
    return counts;
  }, [data]);

  const pieData = useMemo(() => {
    return [
      { name: "Positivo", value: sentimentCounts.positive, color: SENTIMENT_COLORS.positive },
      { name: "Neutro", value: sentimentCounts.neutral, color: SENTIMENT_COLORS.neutral },
      { name: "Negativo", value: sentimentCounts.negative, color: SENTIMENT_COLORS.negative },
    ].filter((item) => item.value > 0);
  }, [sentimentCounts]);

  const averageSentiment = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.sentimentScore, 0);
    return sum / data.length;
  }, [data]);

  const trend = useMemo(() => {
    if (data.length < 2) return "estável";
    const firstScore = data[0]?.sentimentScore || 0;
    const lastScore = data[data.length - 1]?.sentimentScore || 0;
    const diff = lastScore - firstScore;

    if (diff > 0.1) return "melhorando";
    if (diff < -0.1) return "piorando";
    return "estável";
  }, [data]);

  const trendColor = {
    melhorando: "text-green-600",
    piorando: "text-red-600",
    estável: "text-yellow-600",
  }[trend];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sentimento Médio</p>
              <p className="text-2xl font-bold">{(averageSentiment * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tendência</p>
              <Badge className={trendColor}>{trend}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Sentimento (%)"
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {showPieChart && pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Sentimentos</CardTitle>
            <CardDescription>Proporção de sentimentos detectados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SentimentChart;
