import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";

interface Client {
  id: string;
  ws: WebSocket;
  agent: "esaude" | "amanda";
  connected: boolean;
}

const clients = new Map<string, Client>();

export function setupWebSocketServer(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: "/ws/agents" });

  wss.on("connection", (ws: WebSocket, req: any) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[WS] Nova conexão: ${clientId}`);

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        const { type, agent, token, payload } = data;

        // Validar token
        console.log(`[WS] DEBUG - Agent: ${agent}, Token: ${token?.substring(0, 15)}...`);
        if (token !== "sk_txl9tplq8go4z2awfemx") {
          console.warn(`[WS] ❌ Token inválido: ${token}`);
          ws.send(JSON.stringify({ error: "Invalid token", received: token }));
          return;
        }
        console.log(`[WS] ✅ Token válido`);

        // Registrar cliente
        if (type === "connect") {
          const client: Client = {
            id: clientId,
            ws,
            agent: agent as "esaude" | "amanda",
            connected: true,
          };
          clients.set(clientId, client);
          console.log(`[WS] ✅ ${agent} conectado (${clientId})`);

          ws.send(
            JSON.stringify({
              type: "connected",
              clientId,
              message: `Bem-vindo ${agent}!`,
            })
          );
          return;
        }

        // Rotear mensagem para o outro agente
        if (type === "message") {
          const targetAgent = agent === "esaude" ? "amanda" : "esaude";
          console.log(`[WS] 📨 ${agent} → ${targetAgent}: ${payload?.messageType || 'unknown'}`);

          let sent = false;
          clients.forEach((client) => {
            if (client.agent === targetAgent && client.connected) {
              try {
                client.ws.send(
                  JSON.stringify({
                    type: "message",
                    from: agent,
                    timestamp: new Date().toISOString(),
                    ...payload,
                  })
                );
                console.log(`[WS] ✅ Mensagem entregue a ${targetAgent}`);
                sent = true;
              } catch (err: any) {
                console.error(`[WS] Erro ao enviar:`, err.message);
              }
            }
          });

          if (!sent) {
            ws.send(
              JSON.stringify({
                error: `${targetAgent} não está conectado`,
              })
            );
          }
        }
      } catch (error: any) {
        console.error("[WS] Erro ao processar mensagem:", error.message);
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      const client = clients.get(clientId);
      if (client) {
        console.log(`[WS] ❌ ${client.agent} desconectado`);
        clients.delete(clientId);
      }
    });

    ws.on("error", (error: any) => {
      console.error(`[WS] Erro:`, error.message);
    });
  });

  console.log("[WS] WebSocket server pronto em ws://localhost:3000/ws/agents");
}
