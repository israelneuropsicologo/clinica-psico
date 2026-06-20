/*
 * E-SAÚDE Integration Router
 * Procedures tRPC para gerenciar integração com E-SAÚDE
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getAgentStatus, syncPendingAppointments } from "../esaude-agent";
import { getDb } from "../db";
import { syncLogs } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export const esaudeIntegrationRouter = router({
  /**
   * Obter status do agente de sincronização
   */
  getAgentStatus: publicProcedure.query(async () => {
    return await getAgentStatus();
  }),

  /**
   * Sincronizar agendamentos pendentes manualmente
   */
  syncNow: protectedProcedure.query(async ({ ctx }) => {
    // Apenas admins podem sincronizar manualmente
    if (ctx.user?.role !== "admin") {
      throw new Error("Apenas admins podem sincronizar");
    }

    await syncPendingAppointments();
    return { success: true, message: "Sincronização iniciada" };
  }),

  /**
   * Obter histórico de sincronizações
   */
  getSyncHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs = await db
        .select()
        .from(syncLogs)
        .orderBy(desc(syncLogs.startedAt))
        .limit(input.limit)
        .offset(input.offset) as any;

      return logs;
    }),

  /**
   * Obter estatísticas de sincronização
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Contar por isSuccess
    const [successCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.isSuccess, 1));

    const [failedCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.isSuccess, 0));

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs);

    return {
      success: successCount?.count || 0,
      failed: failedCount?.count || 0,
      total: totalCount?.count || 0,
    };
  }),
});
