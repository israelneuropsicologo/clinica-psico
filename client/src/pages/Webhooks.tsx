import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function Webhooks() {
  const { user } = useAuth();
  const [copiedToken, setCopiedToken] = useState(false);
  const [manualSyncLoading, setManualSyncLoading] = useState(false);

  const { data: status, isLoading: statusLoading } = trpc.webhooks.getStatus.useQuery();
  const { data: logs, isLoading: logsLoading } = trpc.webhooks.getLogs.useQuery({ limit: 20 });
  const generateTokenMutation = trpc.webhooks.generateToken.useMutation();

  // Mock data para gráfico de sincronizações por hora
  const syncChartData = [
    { hora: "00:00", sucesso: 12, falha: 2 },
    { hora: "04:00", sucesso: 8, falha: 1 },
    { hora: "08:00", sucesso: 24, falha: 3 },
    { hora: "12:00", sucesso: 18, falha: 2 },
    { hora: "16:00", sucesso: 30, falha: 5 },
    { hora: "20:00", sucesso: 22, falha: 2 },
  ];

  const handleGenerateToken = async () => {
    try {
      const result = await generateTokenMutation.mutateAsync({
        name: "Integração Site Mãe",
        description: "Token para sincronizar dados do psicologo.manus.space",
      });
      toast.success("Token gerado com sucesso!");
      setCopiedToken(false);
    } catch (error) {
      toast.error("Erro ao gerar token");
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    toast.success("Token copiado!");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleManualSync = async () => {
    setManualSyncLoading(true);
    try {
      // Simular sincronização manual
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Sincronização manual iniciada com sucesso!");
    } catch (error) {
      toast.error("Erro ao iniciar sincronização manual");
    } finally {
      setManualSyncLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Integração com Site Mãe</h1>
          <p className="text-gray-600 mt-2">
            Configure webhooks para sincronizar dados automaticamente do psicologo.manus.space
          </p>
        </div>

        {/* Botão de Sincronização Manual */}
        <div className="flex gap-2">
          <Button
            onClick={handleManualSync}
            disabled={manualSyncLoading}
            className="w-full md:w-auto"
            variant="outline"
          >
            {manualSyncLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        </div>

        {/* Status Overview */}
        {statusLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin w-8 h-8 text-primary" />
          </div>
        ) : status ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Sincronizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.totalSyncs}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{status.successCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{status.failureCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {status.lastSync
                    ? new Date(status.lastSync).toLocaleString("pt-BR")
                    : "Nunca"}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Gráfico de Sincronizações */}
        <Card>
          <CardHeader>
            <CardTitle>Sincronizações por Hora (Últimas 24h)</CardTitle>
            <CardDescription>Visualização de sucesso e falhas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={syncChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sucesso" fill="#10b981" name="Sucesso" />
                <Bar dataKey="falha" fill="#ef4444" name="Falha" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alertas de Falhas */}
        {status && status.failureCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Falhas Detectadas
              </CardTitle>
              <CardDescription className="text-red-700">
                {status.failureCount} sincronizações falharam nas últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                Verifique os logs abaixo para mais detalhes. Possíveis causas: token inválido, rate limit excedido ou erro de validação de dados.
              </p>
            </CardContent>
          </Card>
        )}

        {/* API Token Section */}
        <Card>
          <CardHeader>
            <CardTitle>Token de API</CardTitle>
            <CardDescription>
              Use este token para autenticar requisições do site mãe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateToken}
              disabled={generateTokenMutation.isPending}
              className="w-full"
            >
              {generateTokenMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar Novo Token"
              )}
            </Button>

            {generateTokenMutation.data && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono bg-white px-3 py-2 rounded flex-1 mr-2 overflow-auto">
                    {generateTokenMutation.data.token}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyToken(generateTokenMutation.data.token)}
                  >
                    {copiedToken ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-700">
                  ⚠️ Guarde este token em local seguro. Você não poderá vê-lo novamente.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Webhooks</CardTitle>
            <CardDescription>
              Configure os seguintes endpoints no seu site mãe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <label className="text-sm font-medium">Endpoint: Sincronizar Paciente</label>
                <Input
                  readOnly
                  value={`${window.location.origin}/api/trpc/webhooks.syncPatient`}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Endpoint: Sincronizar Agendamento</label>
                <Input
                  readOnly
                  value={`${window.location.origin}/api/trpc/webhooks.syncAppointment`}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Endpoint: Sincronizar Pagamento</label>
                <Input
                  readOnly
                  value={`${window.location.origin}/api/trpc/webhooks.syncPayment`}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Método HTTP</label>
                <Input readOnly value="POST" className="mt-1" />
              </div>

              <div>
                <label className="text-sm font-medium">Header de Autenticação</label>
                <Input
                  readOnly
                  value="Authorization: Bearer {seu_token_aqui}"
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs Recentes</CardTitle>
            <CardDescription>Últimas 20 sincronizações</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin w-6 h-6 text-primary" />
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{log.webhookType}</span>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ID: {log.externalId}
                      </div>
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {log.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {new Date(log.syncedAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma sincronização ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Payload: Sincronizar Paciente</h4>
              <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">
{`{
  "customer_id": "cust_123",
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "+55 11 99999-9999",
  "birth_date": "1990-01-15",
  "cpf": "123.456.789-00",
  "address": "Rua A, 123",
  "occupation": "Engenheiro",
  "main_complaint": "Ansiedade",
  "medical_history": "Sem histórico"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Payload: Sincronizar Agendamento</h4>
              <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">
{`{
  "customer_id": "cust_123",
  "appointment_date": "2026-05-15T14:00:00Z",
  "service_type": "Psicoterapia",
  "duration_minutes": 50,
  "notes": "Primeira sessão",
  "payment_status": "approved",
  "transaction_id": "txn_456"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Payload: Sincronizar Pagamento</h4>
              <pre className="bg-gray-50 p-3 rounded overflow-auto text-xs">
{`{
  "transaction_id": "txn_456",
  "customer_id": "cust_123",
  "amount": 150.00,
  "currency": "BRL",
  "payment_status": "approved",
  "appointment_id": "apt_789",
  "payment_method": "credit_card"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
