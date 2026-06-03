import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const agentsRouter = router({
  getMessages: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return [];
      const messages = await db.execute(
        sql`SELECT * FROM agent_messages ORDER BY createdAt DESC LIMIT 100`
      );
      return messages as any[];
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      return [];
    }
  }),

  getStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) return { esaude: { status: "offline", messageCount: 0 }, amanda: { status: "offline", messageCount: 0 } };
      const statuses = await db.execute(
        sql`SELECT * FROM agent_status`
      );
      
      const statusMap = (statuses as any[]).reduce((acc, status) => {
        acc[status.agentName] = status;
        return acc;
      }, {} as Record<string, any>);

      return {
        esaude: statusMap.esaude || { status: "offline", messageCount: 0 },
        amanda: statusMap.amanda || { status: "offline", messageCount: 0 },
      };
    } catch (error) {
      console.error("Erro ao buscar status:", error);
      return {
        esaude: { status: "offline", messageCount: 0 },
        amanda: { status: "offline", messageCount: 0 },
      };
    }
  }),

  addMessage: publicProcedure
    .input(z.object({
      fromAgent: z.string(),
      toAgent: z.string(),
      messageType: z.string(),
      title: z.string(),
      content: z.string().optional(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database connection failed" };
        const now = Date.now();
        await db.execute(
          sql`INSERT INTO agent_messages (id, fromAgent, toAgent, messageType, title, content, status, createdAt, updatedAt)
              VALUES (UUID(), ${input.fromAgent}, ${input.toAgent}, ${input.messageType}, ${input.title}, ${input.content || null}, ${input.status}, ${now}, ${now})`
        );
        return { success: true };
      } catch (error) {
        console.error("Erro ao adicionar mensagem:", error);
        return { success: false, error: String(error) };
      }
    }),

  updateStatus: publicProcedure
    .input(z.object({
      agentName: z.string(),
      status: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) return { success: false, error: "Database connection failed" };
        const now = Date.now();
        await db.execute(
          sql`INSERT INTO agent_status (id, agentName, status, lastHeartbeat, updatedAt)
              VALUES (UUID(), ${input.agentName}, ${input.status}, ${now}, ${now})
              ON DUPLICATE KEY UPDATE status = ${input.status}, lastHeartbeat = ${now}, updatedAt = ${now}`
        );
        return { success: true };
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return { success: false, error: String(error) };
      }
    }),
});
