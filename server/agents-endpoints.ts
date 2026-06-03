import { Express, Request, Response } from "express";
import { appRouter } from "./routers";

// Middleware para validar token de Amanda
function validateAmandaToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  
  if (!token || token !== "sk_txl9tplq8go4z2awfemx") {
    console.warn("[E-SAUDE] Tentativa de acesso não autorizado:", token);
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
}

export function registerAgentEndpoints(app: Express) {
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
      console.log("[E-SAUDE] Mensagem recebida de Amanda:", req.body.type);
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.message(req.body);
      res.json(result);
    } catch (error: any) {
      console.error("[E-SAUDE] Erro ao processar mensagem:", error.message);
      res.status(400).json({ error: error.message });
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
