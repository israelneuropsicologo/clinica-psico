import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startBackupScheduler } from "./backupScheduler";
import { initializeESaudeAgent, handleESaudeWebhook, getAgentStatus } from "../esaude-agent";
import { initChatbotToken, getChatbotToken } from "../init-chatbot-token";
import { registerAgentEndpoints } from "../agents-endpoints";
import { sendHandshakeToAmanda, checkAmandaHealth } from "../amanda-communication";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error("No available ports found");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // E-SAÚDE Integration
  initializeESaudeAgent();
  app.post("/api/esaude/webhook", handleESaudeWebhook);
  app.get("/api/esaude/status", async (req, res) => {
    const status = await getAgentStatus();
    res.json(status);
  });
  
  // Autonomous Agents Communication Endpoints
  registerAgentEndpoints(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Debug endpoint for chatbot appointments
  app.post("/api/webhooks/debug-chatbot", async (req: any, res: any) => {
    try {
      const { input } = req.body;
      console.log("[DEBUG] Chatbot appointment data:", input);
      
      // Validate with zod schema
      const result = await appRouter.createCaller({ user: null, req, res }).webhooks.debugChatbotAppointment(input);
      res.json(result);
    } catch (error: any) {
      console.error("[DEBUG] Validation error:", error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start backup scheduler
    startBackupScheduler();
    // Initialize ChatBot Amanda permanent token
    initChatbotToken().catch(err => console.error("[ChatBot] Erro ao inicializar token:", err));
    
    // Fazer handshake com Amanda apos 2 segundos (com timeout para nao bloquear)
    setTimeout(async () => {
      try {
        console.log("[E-SAUDE] Iniciando comunicacao com Amanda...");
        // Timeout de 5 segundos para cada chamada
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 5000)
        );
        await Promise.race([checkAmandaHealth(), timeoutPromise]);
        await Promise.race([sendHandshakeToAmanda(), timeoutPromise]);
        console.log("[E-SAUDE] Conectado com Amanda com sucesso!");
      } catch (error) {
        console.warn("[E-SAUDE] Amanda offline ou timeout. Tentando novamente em 30s...");
      }
    }, 2000);
  });
}

export { startServer };
