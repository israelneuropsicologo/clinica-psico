import React, { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Send, Zap } from "lucide-react";
import { useAgentWebSocket } from "@/hooks/useAgentWebSocket";

export function AgentCommunicationDashboard() {
  const { messages, esaudeStatus, amandaStatus, sendCommand, isConnected } = useAgentWebSocket();
  const [commandInput, setCommandInput] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleSendCommand = () => {
    if (!commandInput.trim()) return;
    sendCommand(commandInput);
    setCommandInput("");
  };

  const getLogColor = (agent: "esaude" | "amanda") => {
    return agent === "esaude"
      ? "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950"
      : "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return "🟢";
      case "pending": return "🟡";
      case "error": return "🔴";
      default: return "⚪";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Comunicacao entre Agentes</h1>
        <p className="text-muted-foreground mt-2">
          Monitore a comunicacao em tempo real entre E-SAUDE e Amanda
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">E-SAUDE</h2>
              <Badge variant={esaudeStatus.connected ? "default" : "secondary"}>
                {esaudeStatus.connected ? "🟢 Online" : "🔴 Offline"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Status:</span> {esaudeStatus.connected ? "Conectado" : "Desconectado"}</p>
              <p><span className="text-muted-foreground">Mensagens:</span> {esaudeStatus.messageCount}</p>
              <p><span className="text-muted-foreground">Ultimo:</span> {esaudeStatus.lastHeartbeat ? new Date(esaudeStatus.lastHeartbeat).toLocaleTimeString("pt-BR") : "—"}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Amanda</h2>
              <Badge variant={amandaStatus.connected ? "default" : "secondary"}>
                {amandaStatus.connected ? "🟢 Online" : "🟡 Aguardando"}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Status:</span> {amandaStatus.connected ? "Conectado" : "Aguardando"}</p>
              <p><span className="text-muted-foreground">Mensagens:</span> {amandaStatus.messageCount}</p>
              <p><span className="text-muted-foreground">Ultimo:</span> {amandaStatus.lastHeartbeat ? new Date(amandaStatus.lastHeartbeat).toLocaleTimeString("pt-BR") : "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Enviar Comando
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: sincronizar agendamentos, validar dados..."
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendCommand();
              }
            }}
            disabled={!isConnected}
          />
          <Button onClick={handleSendCommand} disabled={!isConnected || !commandInput.trim()}>
            <Send className="w-4 h-4 mr-2" /> Enviar
          </Button>
        </div>
      </Card>

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
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aguardando comunicacao...
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${getLogColor(msg.agent)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getStatusIcon(msg.status)}</span>
                          <p className="font-semibold text-sm">
                            {msg.agent === "esaude" ? "E-SAUDE" : "Amanda"}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {msg.type}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mt-1">{msg.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR")}
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
        </div>
      </Card>

      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>E-SAUDE e Amanda sao agentes autonomos em servidores separados</li>
              <li>Eles se comunicam via WebSocket em tempo real</li>
              <li>Voce envia comandos e ambos executam juntos</li>
              <li>Todos os logs aparecem aqui em tempo real</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
