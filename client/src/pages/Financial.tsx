import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportButton from "@/components/ExportButton";
import PDFExportButton from "@/components/PDFExportButton";
import DashboardLayout from "@/components/DashboardLayout";
import BillingDashboard from "@/components/BillingDashboard";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  CheckCircle,
  DollarSign,
  Edit2,
  Plus,
  Trash2,
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
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Billing Dashboard queries
  const { data: billingMetrics } = trpc.financial.billingMetrics.useQuery({ period: "month" });
  const { data: monthlyRevenue } = trpc.financial.monthlyRevenueWithForecast.useQuery({ months: 12 });
  const { data: topPatients } = trpc.financial.topPatientsByRevenue.useQuery({ limit: 10 });

  const { data: transactions, isLoading, refetch } = trpc.financial.list.useQuery({
    period,
    type: typeFilter,
  });
  const { data: summary } = trpc.financial.summary.useQuery({ period });

  const generateFinancialPDFMutation = trpc.reports.generateFinancialPDF.useMutation();
  const trpcUtils = trpc.useUtils();

  const deleteMutation = trpc.financial.delete.useMutation({
    onSuccess: () => { toast.success("Transação deletada!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteBulkMutation = trpc.financial.deleteBulk.useMutation({
    onSuccess: () => { toast.success("Transações deletadas!"); setSelectedTransactions(new Set()); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleTransactionSelection = (id: number) => {
    const newSet = new Set(selectedTransactions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTransactions(newSet);
  };

  const toggleSelectAllTransactions = () => {
    if (selectedTransactions.size === transactions?.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions?.map((t) => t.id) || []));
    }
  };

  const handleExportFinancialPDF = async () => {
    const result = await generateFinancialPDFMutation.mutateAsync({});
    return result;
  };

  const handleExportFinancial = async (format: string) => {
    try {
      const result = await trpcUtils.reports.exportFinancial.fetch({
        format: format as "json" | "csv",
      });
      return result || { content: "", filename: "", mimeType: "" };
    } catch (error) {
      toast.error("Erro ao exportar dados financeiros");
      return { content: "", filename: "", mimeType: "" };
    }
  };

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
            <PDFExportButton
              label="Exportar PDF"
              onExportPDF={handleExportFinancialPDF}
            />
            <ExportButton
              label="Exportar"
              onExport={(format: string) => handleExportFinancial(format)}
            />
            <Button 
              onClick={() => window.open('https://clinic-rep-ungcdbcu.manus.space', '_blank')} 
              className="gap-2"
              variant="outline"
            >
              <BarChart3 className="h-4 w-4" />
              Relatórios Gerenciais
            </Button>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Transação
            </Button>
           </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Temporarily disabled */}
          {/* <TabsContent value="dashboard" className="space-y-4">
            {billingMetrics && monthlyRevenue && topPatients ? (
              <BillingDashboard
                totalRevenue={billingMetrics.totalRevenue}
                averageTicket={billingMetrics.averageTicket}
                defaultersCount={billingMetrics.defaultersCount}
                conversionRate={billingMetrics.conversionRate}
                monthlyData={monthlyRevenue}
                patientsData={topPatients}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Carregando dados de faturamento...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
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
              {selectedTransactions.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedTransactions.size} selecionada(s)</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja deletar as transações selecionadas?")) {
                        deleteBulkMutation.mutate({ ids: Array.from(selectedTransactions) });
                      }
                    }}
                    disabled={deleteBulkMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Deletar Selecionadas
                  </Button>
                </div>
              )}
              {selectedTransactions.size === 0 && (
                <CardTitle className="text-base font-semibold">Transações</CardTitle>
              )}
              <Select key="type-filter" value={typeFilter} onValueChange={setTypeFilter}>
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
            {transactions?.length ? (
              <div className="flex items-center gap-2 p-3 mb-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedTransactions.size === transactions?.length && transactions?.length > 0}
                  onChange={toggleSelectAllTransactions}
                  className="rounded border-input"
                />
                <span className="text-sm text-muted-foreground">Selecionar Tudo</span>
              </div>
            ) : null}
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
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      selectedTransactions.has(t.id)
                        ? "bg-accent/10 border border-accent"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(t.id)}
                        onChange={() => toggleTransactionSelection(t.id)}
                        className="rounded border-input"
                      />
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingTransaction(t)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja deletar esta transação?")) {
                            deleteMutation.mutate({ id: t.id });
                          }
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

            {/* Overdue Sessions */}
            <OverdueSessions />
          </TabsContent>
        </Tabs>
      </div>

      <CreateTransactionDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />

      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => { setEditingTransaction(null); refetch(); }}
        />
      )}
    </DashboardLayout>
  );
}

function OverdueSessions() {
  const { data: sessions, refetch } = trpc.sessions.list.useQuery({ status: "completed", isPaid: "pending" });
  const updateSession = trpc.sessions.update.useMutation({
    onSuccess: () => { toast.success("Pagamento registrado!"); refetch(); },
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
                <p className="text-sm font-medium">{session.patient?.name || `Paciente #${session.patientId}`}</p>
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
  const [form, setForm] = useState(() => ({
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    category: "session_payment",
    transactionDate: new Date().toISOString().split("T")[0],
    status: "paid" as "paid" | "pending" | "overdue",
  }));

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
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
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

function EditTransactionDialog({
  transaction,
  onClose,
  onSuccess,
}: {
  transaction: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() => ({
    type: transaction.type as "income" | "expense",
    description: transaction.description || "",
    amount: transaction.amount || "",
    category: transaction.category || "session_payment",
    transactionDate: new Date(transaction.transactionDate || transaction.createdAt).toISOString().split("T")[0],
    status: transaction.status as "paid" | "pending" | "overdue",
  }));

  const updateMutation = trpc.financial.update.useMutation({
    onSuccess: () => { toast.success("Transação atualizada!"); onSuccess(); },
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
    <Dialog open={!!transaction} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate({ id: transaction.id, ...form });
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
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Atualizar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
