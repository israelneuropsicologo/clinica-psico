import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  CalendarDays,
  DollarSign,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles } from "lucide-react";
import { formatDateSaoPaulo } from "@/lib/timezone";

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

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "teal" | "green" | "orange";
  onClick?: () => void;
  alert?: boolean;
}

function MetricCard({ title, value, icon, color = "blue", onClick, alert }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${alert ? "border-orange-200 dark:border-orange-800" : ""}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading } = trpc.dashboard.metrics.useQuery();
  const [, navigate] = useLocation();
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const aiChatMutation = trpc.ai.chat.useMutation();

  const handleAiChat = async () => {
    if (!aiInput.trim()) return;
    const userMessage = aiInput;
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput('');
    try {
      const response = await aiChatMutation.mutateAsync({
        message: userMessage,
        context: `Pacientes ativos: ${metrics?.patientCount || 0}. Sessoes este mes: ${metrics?.sessionsThisMonth || 0}. Receita mensal: R$ ${metrics?.monthlyRevenue || 0}`,
      });
      if (response.success) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
      }
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua solicitacao.' }]);
    }
  };

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

        {/* AI Assistant Chat */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Assistente de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-64 bg-muted/30 rounded-lg p-4 overflow-y-auto space-y-3 border">
                {aiMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
                    <div>
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Comece uma conversa com o assistente de IA</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      <button
                        onClick={() => setAiInput('Resuma as metricas do mes para mim')}
                        className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                      >
                        Resumir metricas do mes
                      </button>
                      <button
                        onClick={() => setAiInput('Analise as tendencias de crescimento de pacientes')}
                        className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                      >
                        Analisar tendencias de pacientes
                      </button>
                      <button
                        onClick={() => setAiInput('Quais sao as recomendacoes para melhorar a receita?')}
                        className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                      >
                        Melhorar receita
                      </button>
                      <button
                        onClick={() => setAiInput('Qual eh o status das sessoes em atraso?')}
                        className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                      >
                        Status de sessoes em atraso
                      </button>
                    </div>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Faca uma pergunta ao assistente..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiChat()}
                  disabled={aiChatMutation.isPending}
                />
                <Button
                  onClick={handleAiChat}
                  disabled={aiChatMutation.isPending || !aiInput.trim()}
                  size="icon"
                >
                  {aiChatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
