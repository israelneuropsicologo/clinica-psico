import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  title: string;
  content?: string;
  status: string;
  createdAt: number;
}

export function AgentCommunicationDashboard() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [esaudeStatus, setEsaudeStatus] = useState("online");
  const [amandaStatus, setAmandaStatus] = useState("offline");

  const { data: messagesData } = trpc.agents.getMessages.useQuery(undefined, {
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const { data: statusData } = trpc.agents.getStatus.useQuery(undefined, {
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [messagesData]);

  useEffect(() => {
    if (statusData) {
      setEsaudeStatus(statusData.esaude?.status || "offline");
      setAmandaStatus(statusData.amanda?.status || "offline");
    }
  }, [statusData]);

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      // Simula verificação de status
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-500">🟢 Online</Badge>;
      case "offline":
        return <Badge className="bg-red-500">🔴 Offline</Badge>;
      case "waiting":
        return <Badge className="bg-yellow-500">🟡 Aguardando</Badge>;
      default:
        return <Badge>⚪ Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Comunicação entre Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Monitore o histórico de comunicação entre E-SAÚDE e Amanda
        </p>
      </div>

      {/* Status dos Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">E-SAÚDE</h2>
              {getStatusBadge(esaudeStatus)}
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {esaudeStatus === "online" ? "Conectado" : "Desconectado"}
              </p>
              <p>
                <span className="text-muted-foreground">Mensagens:</span>{" "}
                {messages.filter((m) => m.fromAgent === "esaude").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Amanda</h2>
              {getStatusBadge(amandaStatus)}
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {amandaStatus === "online" ? "Conectado" : "Aguardando"}
              </p>
              <p>
                <span className="text-muted-foreground">Mensagens:</span>{" "}
                {messages.filter((m) => m.fromAgent === "amanda").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Botão de Verificação */}
      <Card className="p-6">
        <Button onClick={handleCheckStatus} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Verificando..." : "Verificar Status"}
        </Button>
      </Card>

      {/* Histórico de Mensagens */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Histórico de Comunicação</h2>
        <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhuma mensagem registrada ainda
              </div>
            ) : (
              messages
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      msg.fromAgent === "esaude"
                        ? "border-l-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-l-green-500 bg-green-50 dark:bg-green-950"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(msg.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">
                            {msg.fromAgent === "esaude" ? "E-SAÚDE" : "Amanda"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {msg.messageType}
                          </Badge>
                          <Badge
                            variant={
                              msg.status === "success" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {msg.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{msg.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {msg.content && (
                      <pre className="text-xs mt-2 bg-black/10 dark:bg-white/10 p-2 rounded overflow-auto max-h-20">
                        {msg.content}
                      </pre>
                    )}
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Informações */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>E-SAÚDE e Amanda são agentes autônomos em servidores separados</li>
              <li>O histórico de comunicação é salvo no banco de dados</li>
              <li>Clique em "Verificar Status" para ver o status atual dos agentes</li>
              <li>Todas as mensagens aparecem aqui com timestamp</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
