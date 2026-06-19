import { StatusBadge } from "@/components/StatusBadge";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { formatDateSaoPaulo } from "@/lib/timezone";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(ts: number) {
  return formatDateSaoPaulo(ts, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mock chart data for current month
const weeklyData = [
  { day: "Seg", sessoes: 4 },
  { day: "Ter", sessoes: 6 },
  { day: "Qua", sessoes: 3 },
  { day: "Qui", sessoes: 7 },
  { day: "Sex", sessoes: 5 },
  { day: "Sáb", sessoes: 2 },
];

const monthlyData = [
  { mes: "Jan", receita: 3200 },
  { mes: "Fev", receita: 4100 },
  { mes: "Mar", receita: 3800 },
  { mes: "Abr", receita: 4600 },
  { mes: "Mai", receita: 5200 },
  { mes: "Jun", receita: 4900 },
];

// Conversion data will be fetched from backend

export default function Dashboard() {
  const [trendPeriod, setTrendPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();
  const { data: conversionData, isLoading: conversionLoading } = trpc.dashboard.conversionFunnel.useQuery();
  const { data: patientGrowthData, isLoading: patientGrowthLoading } = trpc.dashboard.patientGrowth.useQuery({ period: trendPeriod });
  const { data: revenueHistoryData, isLoading: revenueHistoryLoading } = trpc.dashboard.revenueHistory.useQuery({ period: trendPeriod });
  const [, navigate] = useLocation();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visão geral da sua clínica —{" "}
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Pacientes Ativos"
            value={isLoading ? "—" : String(metrics?.patientCount ?? 0)}
            icon={<Users className="h-5 w-5" />}
            color="blue"
            onClick={() => navigate("/patients")}
          />
          <MetricCard
            title="Sessões no Mês"
            value={isLoading ? "—" : String(metrics?.sessionsThisMonth ?? 0)}
            icon={<CalendarDays className="h-5 w-5" />}
            color="teal"
            onClick={() => navigate("/sessions")}
          />
          <MetricCard
            title="Receita Mensal"
            value={isLoading ? "—" : formatCurrency(metrics?.monthlyRevenue ?? 0)}
            icon={<DollarSign className="h-5 w-5" />}
            color="green"
            onClick={() => navigate("/financial")}
          />
          <MetricCard
            title="Sessões em Atraso"
            value={isLoading ? "—" : String(metrics?.overdueCount ?? 0)}
            icon={<AlertCircle className="h-5 w-5" />}
            color="orange"
            onClick={() => navigate("/financial")}
            alert={Boolean(metrics?.overdueCount && metrics.overdueCount > 0)}
          />
        </div>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Funil de Conversão de Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversionLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-muted-foreground">Carregando...</div>
              </div>
            ) : !conversionData || (conversionData.leads + conversionData.prospects + conversionData.customers) === 0 ? (
              <div className="h-64 flex items-center justify-center text-center">
                <div>
                  <p className="text-muted-foreground text-sm">Nenhum lead registrado</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart key="conversion-pie-chart">
                    <Pie
                      data={[
                        { name: "Contatos", value: conversionData.leads },
                        { name: "Interessados", value: conversionData.prospects },
                        { name: "Pacientes", value: conversionData.customers },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#06b6d4" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, "Quantidade"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-muted-foreground">Taxa de Conversão</p>
                    <p className="font-bold text-lg">{conversionData.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contatos Ativos</p>
                    <p className="font-bold text-lg">{conversionData.leads}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Novos Pacientes</p>
                    <p className="font-bold text-lg">{conversionData.customers}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trend Charts */}
        <div className="space-y-4">
          {/* Period Filter */}
          <div className="flex gap-2">
            <Button
              variant={trendPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('month')}
              className="text-xs"
            >
              Últimos 30 dias
            </Button>
            <Button
              variant={trendPeriod === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('quarter')}
              className="text-xs"
            >
              Últimos 6 meses
            </Button>
            <Button
              variant={trendPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTrendPeriod('year')}
              className="text-xs"
            >
              Ano atual
            </Button>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Crescimento de Pacientes (12 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientGrowthLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : !patientGrowthData || patientGrowthData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">Sem dados de crescimento</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={patientGrowthData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                      formatter={(v: number) => [`${v} pacientes`, "Novos"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#patientGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" />
                Receita por Mês (12 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueHistoryLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : !revenueHistoryData || revenueHistoryData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-center">
                  <div>
                    <p className="text-muted-foreground text-sm">Sem dados de receita</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueHistoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                      formatter={(v: number) => [formatCurrency(v), "Receita"]}
                    />
                    <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Sessões por Dia (Semana Atual)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} key="weekly-bar-chart">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="sessoes" name="Sessões" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Receita Mensal (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(v: number) => [formatCurrency(v), "Receita"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="var(--color-accent)"
                    strokeWidth={2}
                    fill="url(#receitaGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Próximas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !metrics?.upcomingSessions?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma consulta agendada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {metrics.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{session.patient?.name ?? `Paciente #${session.patientId}`}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(session.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {session.modality === "online" ? "Online" : "Presencial"}
                      </span>
                      <StatusBadge status={session.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "teal" | "green" | "orange";
  onClick?: () => void;
  alert?: boolean;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
};

function MetricCard({ title, value, icon, color, onClick, alert }: MetricCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-all ${alert ? "border-orange-300 dark:border-orange-700" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
