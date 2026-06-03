import { Express, Request, Response } from "express";
import { appRouter } from "./routers";

// Middleware para validar token de Amanda
function validateAmandaToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  console.log("[E-SAUDE] DEBUG - Authorization header:", authHeader);
  console.log("[E-SAUDE] DEBUG - Request URL:", req.url);
  
  const token = authHeader?.replace("Bearer ", "");
  console.log("[E-SAUDE] DEBUG - Extracted token:", token);
  console.log("[E-SAUDE] DEBUG - Expected token: sk_txl9tplq8go4z2awfemx");
  console.log("[E-SAUDE] DEBUG - Token match:", token === "sk_txl9tplq8go4z2awfemx");
  
  if (!token || token !== "sk_txl9tplq8go4z2awfemx") {
    console.warn("[E-SAUDE] REJECTED - Token:", token);
    return res.status(401).json({ error: "Unauthorized", received: token });
  }
  
  console.log("[E-SAUDE] ACCEPTED - Token validated");
  next();
}

export function registerAgentEndpoints(app: Express) {
  // CORS middleware para todos os endpoints de agentes
  app.use("/api/agents", (req: Request, res: Response, next: Function) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Expose-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // GET /api/agents/health - Verificar status do E-SAÚDE
  app.get("/api/agents/health", validateAmandaToken, async (req: Request, res: Response) => {
    try {
      console.log("[E-SAUDE] Amanda verificando health...");
      const caller = appRouter.createCaller({ user: null, req, res });
      const health = await caller.autonomousAgents.health();
      res.json(health);
    } catch (error: any) {
      console.error("[E-SAUDE] Erro em health check:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/message - Receber mensagens de Amanda
  app.post("/api/agents/message", validateAmandaToken, async (req: Request, res: Response) => {
    try {
      console.log("[E-SAUDE] POST /api/agents/message - Token validado");
      console.log("[E-SAUDE] Tipo de mensagem:", req.body.type);
      const caller = appRouter.createCaller({ user: null, req, res });
      console.log("[E-SAUDE] Chamando tRPC procedure...");
      const result = await caller.autonomousAgents.message(req.body);
      console.log("[E-SAUDE] Sucesso! Respondendo...");
      res.json(result);
    } catch (error: any) {
      console.error("[E-SAUDE] ERRO na tRPC:", error.message);
      console.error("[E-SAUDE] Code:", error.code);
      res.status(400).json({ error: error.message, code: error.code });
    }
  });

  // GET /api/agents/logs - Retornar logs de comunicação
  app.get("/api/agents/logs", validateAmandaToken, async (req: Request, res: Response) => {
    try {
      console.log("[E-SAUDE] Amanda solicitando logs...");
      const caller = appRouter.createCaller({ user: null, req, res });
      const logs = await caller.autonomousAgents.logs();
      res.json(logs);
    } catch (error: any) {
      console.error("[E-SAUDE] Erro ao retornar logs:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/sync-status - Receber métricas de Amanda
  app.post("/api/agents/sync-status", validateAmandaToken, async (req: Request, res: Response) => {
    try {
      console.log("[E-SAUDE] Status de sincronização recebido de Amanda");
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.syncStatus(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("[E-SAUDE] Erro ao processar sync-status:", error.message);
      res.status(400).json({ error: error.message });
    }
  });
}
