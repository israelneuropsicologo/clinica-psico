import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportButton from "@/components/ExportButton";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  DollarSign,
  Plus,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export default function Financial() {
  const [period, setPeriod] = useState("month");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data: transactions, isLoading, refetch } = trpc.financial.list.useQuery({
    period,
    type: typeFilter,
  });
  const { data: summary } = trpc.financial.summary.useQuery({ period });

  const totalIncome = transactions?.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalExpense = transactions?.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const balance = totalIncome - totalExpense;

  const categoryData =
    summary?.byCategory?.map((c) => ({ name: c.category, value: Number(c.total) })) ?? [];

  const monthlyData = summary?.monthly ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground text-sm mt-1">Controle de receitas e despesas</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              label="Exportar"
              onExport={async (format) => {
                const result = await trpc.reports.exportFinancial.useQuery({
                  format,
                });
                return result.data || { content: "", filename: "", mimeType: "" };
              }}
            />
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
           </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {[
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
            { value: "quarter", label: "Trimestre" },
            { value: "year", label: "Ano" },
          ].map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalIncome)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(totalExpense)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                    {fmt(balance)}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${balance >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Receitas por Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                      formatter={(v: number) => [fmt(v), "Receita"]}
                    />
                    <Bar dataKey="total" name="Receita" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {categoryData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  Por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base font-semibold">Transações</CardTitle>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ) : !transactions?.length ? (
              <div className="text-center py-10 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma transação no período.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        t.type === "income"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"
                      }`}>
                        {t.type === "income" ? (
                          <ArrowUpCircle className="h-4 w-4" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.category} • {new Date(t.transactionDate ?? t.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <span className={`text-sm font-semibold ${
                        t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {t.type === "income" ? "+" : "-"}{fmt(Number(t.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Sessions */}
        <OverdueSessions />
      </div>

      <CreateTransactionDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />
    </DashboardLayout>
  );
}

function OverdueSessions() {
  const { data: sessions } = trpc.sessions.list.useQuery({ status: "completed" });
  const updateSession = trpc.sessions.update.useMutation({
    onSuccess: () => toast.success("Pagamento registrado!"),
    onError: (e) => toast.error(e.message),
  });

  if (!sessions?.length) return null;

  return (
    <Card className="border-orange-300 dark:border-orange-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertCircle className="h-4 w-4" />
          Sessões com Pagamento Pendente ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"
            >
              <div>
                <p className="text-sm font-medium">Paciente #{session.patientId}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.scheduledAt).toLocaleDateString("pt-BR")} •{" "}
                  {session.sessionValue
                    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(session.sessionValue))
                    : "Valor não definido"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => updateSession.mutate({ id: session.id, isPaid: "paid" })}
                disabled={updateSession.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Marcar como Pago
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTransactionDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    category: "session_payment",
    transactionDate: new Date().toISOString().split("T")[0],
    status: "paid" as "paid" | "pending" | "overdue",
    notes: "",
  });

  const createMutation = trpc.financial.create.useMutation({
    onSuccess: () => { toast.success("Transação registrada!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const incomeCategories = [
    { value: "session_payment", label: "Pagamento de sessão" },
    { value: "evaluation", label: "Avaliação" },
    { value: "report", label: "Laudo" },
    { value: "other_income", label: "Outra receita" },
  ];
  const expenseCategories = [
    { value: "supervision", label: "Supervisão" },
    { value: "rent", label: "Aluguel" },
    { value: "software", label: "Software" },
    { value: "training", label: "Formação" },
    { value: "other_expense", label: "Outra despesa" },
  ];
  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({ ...form, amount: form.amount });
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as typeof form.type, category: v === "income" ? "session_payment" : "supervision" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as typeof form.status }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Em atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.description} onChange={set("description")} required placeholder="Ex: Sessão com paciente João" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input value={form.amount} onChange={set("amount")} required placeholder="200.00" type="number" step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input type="date" value={form.transactionDate} onChange={set("transactionDate")} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
