import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  from: "esaude" | "amanda";
  type: string;
  timestamp: string;
  content: string;
  status: "sent" | "received" | "error";
}

interface AgentStatus {
  agent: "esaude" | "amanda";
  connected: boolean;
  lastHeartbeat: string | null;
  messageCount: number;
}

export function AgentChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [esaudeStatus, setEsaudeStatus] = useState<AgentStatus>({
    agent: "esaude",
    connected: true,
    lastHeartbeat: new Date().toISOString(),
    messageCount: 0,
  });
  const [amandaStatus, setAmandaStatus] = useState<AgentStatus>({
    agent: "amanda",
    connected: false,
    lastHeartbeat: null,
    messageCount: 0,
  });
  const [inputMessage, setInputMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Conectar ao WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/agents`;

    console.log("[AGENT-CHAT] Conectando ao WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[AGENT-CHAT] WebSocket conectado");
      setEsaudeStatus((prev) => ({
        ...prev,
        connected: true,
        lastHeartbeat: new Date().toISOString(),
      }));

      // Registrar como E-SAÚDE
      ws.send(
        JSON.stringify({
          type: "connect",
          agent: "esaude",
          token: "sk_txl9tplq8go4z2awfemx",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[AGENT-CHAT] Mensagem recebida:", data);

        if (data.type === "connected") {
          console.log("[AGENT-CHAT] E-SAÚDE conectado com sucesso");
        } else if (data.type === "message") {
          // Mensagem de outro agente
          const newMessage: Message = {
            id: `msg_${Date.now()}`,
            from: data.from || "amanda",
            type: data.messageType || "message",
            timestamp: data.timestamp || new Date().toISOString(),
            content: JSON.stringify(data, null, 2),
            status: "received",
          };
          setMessages((prev) => [...prev, newMessage]);

          // Atualizar status de Amanda
          if (data.from === "amanda") {
            setAmandaStatus((prev) => ({
              ...prev,
              connected: true,
              lastHeartbeat: new Date().toISOString(),
              messageCount: prev.messageCount + 1,
            }));
          }
        }
      } catch (error) {
        console.error("[AGENT-CHAT] Erro ao processar mensagem:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("[AGENT-CHAT] Erro WebSocket:", error);
      setEsaudeStatus((prev) => ({ ...prev, connected: false }));
    };

    ws.onclose = () => {
      console.log("[AGENT-CHAT] WebSocket desconectado");
      setEsaudeStatus((prev) => ({ ...prev, connected: false }));
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      from: "esaude",
      type: "message",
      timestamp: new Date().toISOString(),
      content: inputMessage,
      status: "sent",
    };

    setMessages((prev) => [...prev, message]);

    // Enviar via WebSocket
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        agent: "esaude",
        token: "sk_txl9tplq8go4z2awfemx",
        payload: {
          messageType: "manual",
          content: inputMessage,
          timestamp: new Date().toISOString(),
        },
      })
    );

    setInputMessage("");
    setEsaudeStatus((prev) => ({
      ...prev,
      messageCount: prev.messageCount + 1,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Status dos Agentes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">E-SAÚDE</h3>
              <Badge
                variant={esaudeStatus.connected ? "default" : "destructive"}
              >
                {esaudeStatus.connected ? "🟢 Online" : "🔴 Offline"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Mensagens: {esaudeStatus.messageCount}</p>
              <p>
                Último: {esaudeStatus.lastHeartbeat
                  ? new Date(esaudeStatus.lastHeartbeat).toLocaleTimeString(
                      "pt-BR"
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Amanda</h3>
              <Badge
                variant={amandaStatus.connected ? "default" : "secondary"}
              >
                {amandaStatus.connected ? "🟢 Online" : "🟡 Aguardando"}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Mensagens: {amandaStatus.messageCount}</p>
              <p>
                Último: {amandaStatus.lastHeartbeat
                  ? new Date(amandaStatus.lastHeartbeat).toLocaleTimeString(
                      "pt-BR"
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-semibold">Comunicação em Tempo Real</h3>

          {/* Mensagens */}
          <ScrollArea className="h-96 border rounded p-4 bg-muted/50">
            <div ref={scrollRef} className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Aguardando mensagens...
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.from === "esaude"
                        ? "bg-blue-100 dark:bg-blue-900 ml-8"
                        : "bg-green-100 dark:bg-green-900 mr-8"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {msg.from === "esaude" ? "E-SAÚDE" : "Amanda"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {msg.type}
                      </Badge>
                    </div>
                    <pre className="text-xs mt-2 overflow-auto max-h-24 bg-black/10 dark:bg-white/10 p-2 rounded">
                      {msg.content}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite uma mensagem para Amanda..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              disabled={!esaudeStatus.connected}
            />
            <Button
              onClick={sendMessage}
              disabled={!esaudeStatus.connected || !inputMessage.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-muted">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Dica:</strong> Aqui você pode ver a comunicação em tempo
          real entre E-SAÚDE e Amanda. Ambos os agentes se comunicam via
          WebSocket para sincronizar dados, resolver problemas e otimizar
          operações.
        </p>
      </Card>
    </div>
  );
}
