import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";
import { desc, and, gte, lte, eq } from "drizzle-orm";

export const auditRouter = router({
  /**
   * Listar logs de auditoria com filtros
   */
  list: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // Apenas admins podem ver todos os logs
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const conditions = [];

      if (input.userId) {
        conditions.push(eq(auditLogs.userId, input.userId));
      }
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.entityType) {
        conditions.push(eq(auditLogs.entityType, input.entityType));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.createdAt, input.endDate));
      }

      const logs = await db
        .select()
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),

  /**
   * Contar total de logs com filtros
   */
  count: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        entityType: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not connected");

      const conditions = [];

      if (input.userId) {
        conditions.push(eq(auditLogs.userId, input.userId));
      }
      if (input.action) {
        conditions.push(eq(auditLogs.action, input.action));
      }
      if (input.entityType) {
        conditions.push(eq(auditLogs.entityType, input.entityType));
      }
      if (input.startDate) {
        conditions.push(gte(auditLogs.createdAt, input.startDate));
      }
      if (input.endDate) {
        conditions.push(lte(auditLogs.createdAt, input.endDate));
      }

      const result = await db
        .select({ count: auditLogs.id })
        .from(auditLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return result.length;
    }),
});
