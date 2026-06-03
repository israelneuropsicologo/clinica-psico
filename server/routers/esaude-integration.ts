/**
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
        .orderBy(desc(syncLogs.createdAt))
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

    // Contar por status
    const [successCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.status, "success"));

    const [failedCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.status, "failed"));

    const [retryCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.status, "retry"));

    const [pendingCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(syncLogs)
      .where(eq(syncLogs.status, "pending"));

    return {
      success: successCount?.count || 0,
      failed: failedCount?.count || 0,
      retry: retryCount?.count || 0,
      pending: pendingCount?.count || 0,
      total: (successCount?.count || 0) + (failedCount?.count || 0) + (retryCount?.count || 0) + (pendingCount?.count || 0),
    };
  }),
});
