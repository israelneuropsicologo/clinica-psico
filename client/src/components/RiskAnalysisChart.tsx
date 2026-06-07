/**
 * Risk Analysis Chart Component
 * Displays risk patterns and alerts with visual indicators
 */

import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react";

interface RiskAlert {
  patientId: number;
  patientName: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  suggestedActions: string[];
  timestamp: Date;
}

interface RiskAnalysisChartProps {
  alerts: RiskAlert[];
  title?: string;
  description?: string;
}

const RISK_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#7c2d12",
};

const RISK_ICONS = {
  low: AlertCircle,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: AlertOctagon,
};

export function RiskAnalysisChart({
  alerts,
  title = "Risk Analysis",
  description = "Patient risk assessment and alerts",
}: RiskAnalysisChartProps) {
  const riskCounts = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    alerts.forEach((alert) => {
      counts[alert.riskLevel]++;
    });
    return counts;
  }, [alerts]);

  const chartData = useMemo(() => {
    return [
      { name: "Baixo", value: riskCounts.low, color: RISK_COLORS.low },
      { name: "Médio", value: riskCounts.medium, color: RISK_COLORS.medium },
      { name: "Alto", value: riskCounts.high, color: RISK_COLORS.high },
      { name: "Crítico", value: riskCounts.critical, color: RISK_COLORS.critical },
    ];
  }, [riskCounts]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter((alert) => alert.riskLevel === "critical" || alert.riskLevel === "high");
  }, [alerts]);

  const totalRiskScore = useMemo(() => {
    const riskWeights = { low: 1, medium: 2, high: 3, critical: 4 };
    const sum = alerts.reduce((acc, alert) => acc + riskWeights[alert.riskLevel], 0);
    return Math.round((sum / (alerts.length * 4)) * 100) || 0;
  }, [alerts]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pontuação de Risco</p>
              <p className="text-2xl font-bold">{totalRiskScore}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas Críticos</p>
              <Badge variant="destructive">{criticalAlerts.length}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.some((item) => item.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="Quantidade de Pacientes">
                  {chartData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="value" fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              Nenhum alerta de risco
            </div>
          )}
        </CardContent>
      </Card>

      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Alertas Críticos</CardTitle>
            <CardDescription className="text-red-700">Pacientes que requerem atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAlerts.slice(0, 5).map((alert) => {
                const Icon = RISK_ICONS[alert.riskLevel];
                return (
                  <div key={`${alert.patientId}-${alert.timestamp}`} className="flex gap-3 rounded-lg border border-red-200 bg-white p-3">
                    <Icon className="h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.patientName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.riskFactors.slice(0, 2).join(", ")}
                        {alert.riskFactors.length > 2 && ` +${alert.riskFactors.length - 2}`}
                      </p>
                    </div>
                    <Badge className={`flex-shrink-0 ${alert.riskLevel === "critical" ? "bg-red-600" : "bg-orange-600"}`}>
                      {alert.riskLevel === "critical" ? "Crítico" : "Alto"}
                    </Badge>
                  </div>
                );
              })}
              {criticalAlerts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{criticalAlerts.length - 5} alertas adicionais
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RiskAnalysisChart;
