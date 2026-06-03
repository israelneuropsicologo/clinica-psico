import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Send, Zap } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  agent: "esaude" | "amanda";
  type: "message" | "status" | "error" | "command";
  title: string;
  content: string;
  status: "success" | "pending" | "error";
}

export function AgentCommunicationDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [esaudeOnline, setEsaudeOnline] = useState(true);
  const [amandaOnline, setAmandaOnline] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simular conexão WebSocket e recebimento de logs
  useEffect(() => {
    // E-SAÚDE está sempre online
    setEsaudeOnline(true);

    // Adicionar log inicial
    const initialLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: "esaude",
      type: "status",
      title: "E-SAÚDE Inicializado",
      content: "Sistema pronto para comunicação com Amanda",
      status: "success",
    };
    setLogs([initialLog]);

    // Simular tentativa de conexão com Amanda
    const connectTimer = setTimeout(() => {
      const connectLog: LogEntry = {
        id: `log_${Date.now()}_connect`,
        timestamp: new Date().toISOString(),
        agent: "esaude",
        type: "message",
        title: "Tentando conectar com Amanda",
        content: "Enviando handshake para psicologo.manus.space",
        status: "pending",
      };
      setLogs((prev) => [...prev, connectLog]);
    }, 1000);

    return () => clearTimeout(connectTimer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const addLog = (log: Omit<LogEntry, "id">) => {
    const newLog: LogEntry = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const sendCommand = () => {
    if (!commandInput.trim()) return;

    // Log do comando
    addLog({
      timestamp: new Date().toISOString(),
      agent: "esaude",
      type: "command",
      title: "Comando Enviado",
      content: commandInput,
      status: "pending",
    });

    // Simular resposta de Amanda
    setTimeout(() => {
      addLog({
        timestamp: new Date().toISOString(),
        agent: "amanda",
        type: "message",
        title: "Comando Recebido",
        content: `Processando: "${commandInput}"`,
        status: "success",
      });
      setAmandaOnline(true);
    }, 500);

    setCommandInput("");
  };

  const getLogColor = (agent: "esaude" | "amanda") => {
    return agent === "esaude"
      ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950"
      : "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return "🟢";
      case "pending":
        return "🟡";
      case "error":
        return "🔴";
      default:
        return "⚪";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Comunicação entre Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Monitore a comunicação em tempo real entre E-SAÚDE e Amanda
        </p>
      </div>

      {/* Status dos Agentes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">E-SAÚDE</h2>
              <Badge variant={esaudeOnline ? "default" : "secondary"}>
                {esaudeOnline ? "🟢 Online" : "🔴 Offline"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">URL:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  sistemaclinicaapp.manus.space
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">WebSocket:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  /ws/agents
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> Pronto
                para comunicação
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Amanda</h2>
              <Badge variant={amandaOnline ? "default" : "secondary"}>
                {amandaOnline ? "🟢 Online" : "🟡 Aguardando"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">URL:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  psicologo-nloa9w3g.manus.space
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Protocolo:</span>{" "}
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  autonomousWebSocket v3.0
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                {amandaOnline ? "Conectado" : "Aguardando handshake"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Painel de Comandos */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Enviar Comando
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: sincronizar agendamentos, validar dados, gerar relatório..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                sendCommand();
              }
            }}
          />
          <Button onClick={sendCommand} disabled={!commandInput.trim()}>
            <Send className="w-4 h-4 mr-2" /> Enviar
          </Button>
        </div>
      </Card>

      {/* Logs em Tempo Real */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Logs em Tempo Real</h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
          </div>

          <ScrollArea className="h-96 border rounded-lg p-4 bg-muted/30">
            <div ref={scrollRef} className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aguardando comunicação...
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg ${getLogColor(log.agent)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getStatusIcon(log.status)}</span>
                          <p className="font-semibold text-sm">
                            {log.agent === "esaude" ? "E-SAÚDE" : "Amanda"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {log.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{log.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    {log.content && (
                      <pre className="text-xs mt-2 bg-black/10 dark:bg-white/10 p-2 rounded overflow-auto max-h-20">
                        {log.content}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>E-SAÚDE e Amanda são agentes autônomos em servidores separados</li>
              <li>Eles se comunicam via WebSocket em tempo real</li>
              <li>Você envia comandos e ambos executam juntos</li>
              <li>Todos os logs aparecem aqui em tempo real</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
