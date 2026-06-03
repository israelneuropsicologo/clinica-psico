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
  try {
    console.log("[BOOT] Initializing E-SAUDE agent...");
    initializeESaudeAgent();
    console.log("[BOOT] E-SAUDE agent initialized");
  } catch (error) {
    console.error("[BOOT] Error initializing E-SAUDE agent:", error);
  }
  app.post("/api/esaude/webhook", handleESaudeWebhook);
  app.get("/api/esaude/status", async (req, res) => {
    const status = await getAgentStatus();
    res.json(status);
  });
  
  // Autonomous Agents Communication Endpoints (HTTP diretos)
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
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[BOOT] Setting up Vite...");
      await setupVite(app, server);
      console.log("[BOOT] Vite setup complete");
    } else {
      console.log("[BOOT] Serving static files...");
      serveStatic(app);
      console.log("[BOOT] Static files setup complete");
    }
  } catch (error) {
    console.error("[BOOT] Error setting up frontend:", error);
  }

  // Use PORT from environment or default to 3000
  // Do NOT hunt for available ports - always use the assigned port
  const port = parseInt(process.env.PORT || "3000");

  console.log(`[BOOT] Attempting to listen on port ${port}...`);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start backup scheduler
    startBackupScheduler();
    // Initialize ChatBot Amanda permanent token
    initChatbotToken().catch(err => console.error("[ChatBot] Erro ao inicializar token:", err));
    
    // Comunicacao com Amanda via endpoints HTTP diretos
    console.log("[E-SAUDE] Sistema pronto para comunicacao com Amanda");
    console.log("[E-SAUDE] Endpoints disponiveis:");
    console.log("  GET  /api/agents/health");
    console.log("  POST /api/agents/message");
    console.log("  GET  /api/agents/logs");
    console.log("  POST /api/agents/sync-status");
    console.log("[E-SAUDE] Amanda pode fazer POST para /api/agents/message para iniciar handshake");
  });
}

// Start the server immediately when this module is loaded
startServer().catch(err => {
  console.error("[BOOT] Fatal error starting server:", err);
  process.exit(1);
});

export { startServer };
