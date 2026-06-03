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

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
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
  
  // Autonomous Agents Communication Endpoints (ANTES de Vite)
  app.get("/api/agents/health", async (req, res) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const health = await caller.autonomousAgents.health();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/agents/message", async (req, res) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.message(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  app.get("/api/agents/logs", async (req, res) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const logs = await caller.autonomousAgents.logs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/agents/sync-status", async (req, res) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.syncStatus(req.body);
      res.json(result);
    } catch (error: any) {
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
    
    // Fazer handshake com Amanda apos 2 segundos
    setTimeout(async () => {
      try {
        console.log("[E-SAUDE] Iniciando comunicacao com Amanda...");
        await checkAmandaHealth();
        await sendHandshakeToAmanda();
        console.log("[E-SAUDE] Conectado com Amanda com sucesso!");
      } catch (error) {
        console.error("[E-SAUDE] Erro ao conectar com Amanda:", error);
      }
    }, 2000);
  });
}

export { startServer };
