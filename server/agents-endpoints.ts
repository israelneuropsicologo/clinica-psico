import { Express, Request, Response } from "express";
import { appRouter } from "./routers";

export function registerAgentEndpoints(app: Express) {
  // GET /api/agents/health - Verificar status do E-SAÚDE
  app.get("/api/agents/health", async (req: Request, res: Response) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const health = await caller.autonomousAgents.health();
      res.json(health);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/message - Receber mensagens de Amanda
  app.post("/api/agents/message", async (req: Request, res: Response) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.message(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/agents/logs - Retornar logs de comunicação
  app.get("/api/agents/logs", async (req: Request, res: Response) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const logs = await caller.autonomousAgents.logs();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/agents/sync-status - Receber métricas de Amanda
  app.post("/api/agents/sync-status", async (req: Request, res: Response) => {
    try {
      const caller = appRouter.createCaller({ user: null, req, res });
      const result = await caller.autonomousAgents.syncStatus(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
}
