import { useEffect, useRef, useState, useCallback } from "react";

export interface AgentMessage {
  id: string;
  timestamp: string;
  agent: "esaude" | "amanda";
  type: "message" | "status" | "error" | "command";
  title: string;
  content: string;
  status: "success" | "pending" | "error";
}

export interface AgentStatus {
  agent: "esaude" | "amanda";
  connected: boolean;
  lastHeartbeat: string | null;
  messageCount: number;
}

export function useAgentWebSocket() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [esaudeStatus, setEsaudeStatus] = useState<AgentStatus>({
    agent: "esaude",
    connected: false,
    lastHeartbeat: null,
    messageCount: 0,
  });
  const [amandaStatus, setAmandaStatus] = useState<AgentStatus>({
    agent: "amanda",
    connected: false,
    lastHeartbeat: null,
    messageCount: 0,
  });
  const wsRef = useRef<WebSocket | null>(null);

  const addMessage = useCallback((msg: Omit<AgentMessage, "id">) => {
    const newMsg: AgentMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  }, []);

  const sendCommand = useCallback((command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("[AGENT-WS] WebSocket nao esta conectado");
      return;
    }

    addMessage({
      timestamp: new Date().toISOString(),
      agent: "esaude",
      type: "command",
      title: "Comando Enviado",
      content: command,
      status: "pending",
    });

    wsRef.current.send(JSON.stringify({
      type: "message",
      agent: "esaude",
      token: "sk_txl9tplq8go4z2awfemx",
      payload: {
        messageType: "command",
        content: command,
        timestamp: new Date().toISOString(),
      },
    }));
  }, [addMessage]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/agents`;

    console.log("[AGENT-WS] Conectando ao WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[AGENT-WS] WebSocket conectado");
      setEsaudeStatus((prev) => ({
        ...prev,
        connected: true,
        lastHeartbeat: new Date().toISOString(),
      }));

      addMessage({
        timestamp: new Date().toISOString(),
        agent: "esaude",
        type: "status",
        title: "E-SAUDE Conectado",
        content: "Sistema pronto para comunicacao",
        status: "success",
      });

      ws.send(JSON.stringify({
        type: "connect",
        agent: "esaude",
        token: "sk_txl9tplq8go4z2awfemx",
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[AGENT-WS] Mensagem recebida:", data);

        if (data.type === "connected") {
          addMessage({
            timestamp: new Date().toISOString(),
            agent: "esaude",
            type: "status",
            title: "Conexao Confirmada",
            content: `Cliente ID: ${data.clientId}`,
            status: "success",
          });
        } else if (data.type === "message") {
          addMessage({
            timestamp: data.timestamp || new Date().toISOString(),
            agent: data.from || "amanda",
            type: data.messageType || "message",
            title: `Mensagem de ${data.from === "amanda" ? "Amanda" : "E-SAUDE"}`,
            content: data.content || JSON.stringify(data, null, 2),
            status: "success",
          });

          if (data.from === "amanda") {
            setAmandaStatus((prev) => ({
              ...prev,
              connected: true,
              lastHeartbeat: new Date().toISOString(),
              messageCount: prev.messageCount + 1,
            }));
          }
        } else if (data.error) {
          addMessage({
            timestamp: new Date().toISOString(),
            agent: "esaude",
            type: "error",
            title: "Erro",
            content: data.error,
            status: "error",
          });
        }
      } catch (error) {
        console.error("[AGENT-WS] Erro ao processar mensagem:", error);
      }
    };

    ws.onerror = () => {
      console.error("[AGENT-WS] Erro WebSocket");
      setEsaudeStatus((prev) => ({ ...prev, connected: false }));
    };

    ws.onclose = () => {
      console.log("[AGENT-WS] WebSocket desconectado");
      setEsaudeStatus((prev) => ({ ...prev, connected: false }));
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addMessage]);

  return {
    messages,
    esaudeStatus,
    amandaStatus,
    sendCommand,
    isConnected: esaudeStatus.connected,
  };
}
