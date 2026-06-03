import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

export function VirtualCreditsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch user credits balance
  const { data: userBalance } = trpc.virtualCredits.getBalance.useQuery();

  // Fetch transaction history
  const { data: transactionData } = trpc.virtualCredits.getTransactionHistory.useQuery({
    limit: 50,
  });
  const transactions = transactionData?.transactions || [];

  // Fetch agent balance (admin only) - skipped for now
  // const { data: agentBalance } = trpc.virtualCredits.getAgentBalance.useQuery(undefined, {
  //   enabled: false, // Only enable for admins
  // });

  // Fetch agent communication log (admin only) - skipped for now
  // const { data: agentLogs } = trpc.virtualCredits.getAgentCommunicationLog.useQuery(undefined, {
  //   enabled: false, // Only enable for admins
  // });

  // Calculate statistics
  const totalSpent = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount.toString()), 0);
  const avgSpentPerDay = totalSpent / (selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90);

  // Prepare chart data
  const chartData = transactions.slice(0, 10).reverse().map((t: any) => ({
    date: new Date(t.createdAt).toLocaleDateString("pt-BR"),
    amount: parseFloat(t.amount.toString()),
    type: t.type,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Créditos Virtuais</h1>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === "7d" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("7d")}
          >
            7 dias
          </Button>
          <Button
            variant={selectedPeriod === "30d" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("30d")}
          >
            30 dias
          </Button>
          <Button
            variant={selectedPeriod === "90d" ? "default" : "outline"}
            onClick={() => setSelectedPeriod("90d")}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
            <p className="text-3xl font-bold text-green-600">
              {userBalance && typeof userBalance === "string" ? parseFloat(userBalance).toFixed(2) : "0.00"}
            </p>
            <p className="text-xs text-gray-500">Créditos disponíveis</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Total Gasto</p>
            <p className="text-3xl font-bold text-red-600">{totalSpent.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Últimos {selectedPeriod === "7d" ? "7" : selectedPeriod === "30d" ? "30" : "90"} dias</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Média/Dia</p>
            <p className="text-3xl font-bold text-blue-600">{avgSpentPerDay.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Consumo médio diário</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Consumo por Transação</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Tendência de Consumo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Transações</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">Tipo</th>
                <th className="text-left py-2">Descrição</th>
                <th className="text-right py-2">Créditos</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2">{t.description}</td>
                  <td className="text-right py-2 font-semibold text-red-600">
                    -{parseFloat(t.amount.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Sistema de Créditos Virtuais</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Saldo inicial: 1000 créditos por usuário</li>
          <li>✅ Regeneração: +100 créditos a cada 5 minutos</li>
          <li>✅ Comunicação entre agentes: GRÁTIS (0 créditos)</li>
          <li>✅ Escalável infinitamente sem custos reais</li>
        </ul>
      </Card>
    </div>
  );
}
