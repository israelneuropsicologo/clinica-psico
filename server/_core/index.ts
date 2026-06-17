import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// import { startBackupScheduler } from "./backupScheduler"; // Removido
import { registerAgentEndpoints } from "../agents-endpoints";
import { sendHandshakeToAmanda, checkAmandaHealth } from "../amanda-communication";

// Removed: isPortAvailable function - not needed

// Removed: findAvailablePort function - use port 3000 directly in production

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Initialize in background, don't block startup
  setImmediate(() => {
    try {
    } catch (err: any) {
      console.error("[E-SAUDE] Init error:", err);
    }
  });
  
    res.json(status);
  });
  
  // Autonomous Agents Communication Endpoints (non-blocking)
  setImmediate(() => {
    try {
      registerAgentEndpoints(app);
    } catch (err: any) {
      console.error("[AGENTS] Register error:", err);
    }
  });
  
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

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
  
  // ALL background tasks AFTER server is listening
  // This ensures server responds to health check immediately
  // startBackupScheduler removed - backup service not available
  
  setImmediate(() => {
  });
  
  setImmediate(() => {
    console.log("[E-SAUDE] Sistema pronto para comunicacao com Amanda");
    console.log("[E-SAUDE] Amanda pode chamar: POST /api/trpc/agentCommunication.receiveFromAmanda");
  });
  
  // Inicializar comunicacao com Amanda apos 20 segundos
  setTimeout(() => {
    console.log("[E-SAUDE] Tentando conectar com Amanda...");
    sendHandshakeToAmanda().catch(() => {
      console.warn("[E-SAUDE] Amanda offline ou indisponivel");
    });
  }, 20000);
}

// Iniciar servidor automaticamente
startServer().catch((err) => {
  console.error("[FATAL] Falha ao iniciar servidor:", err);
  process.exit(1);
});

export { startServer };
