import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { transactions } from "../../drizzle/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { getBillingMetrics, getMonthlyRevenueWithForecast, getTopPatientsByRevenue } from "../db";

function getPeriodRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "week": {
      const from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), quarter * 3, 1);
      const to = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
      return { from, to };
    }
    case "year": {
      const from = new Date(now.getFullYear(), 0, 1);
      const to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { from, to };
    }
    default: {
      // month
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to };
    }
  }
}

export const financialRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        period: z.string().optional().default("month"),
        type: z.string().optional().default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { from, to } = getPeriodRange(input.period);
      const conditions = [
        eq(transactions.userId, ctx.user.id),
        gte(transactions.createdAt, from),
        lte(transactions.createdAt, to),
      ];
      if (input.type && input.type !== "all") {
        conditions.push(eq(transactions.type, input.type as "income" | "expense" | "refund"));
      }
      return db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt));
    }),

  summary: protectedProcedure
    .input(z.object({ period: z.string().optional().default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { byCategory: [], monthly: [] };

      const { from, to } = getPeriodRange(input.period);

      // Buscar todas as transacoes de income no periodo
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            eq(transactions.type, "income"),
            gte(transactions.createdAt, from),
            lte(transactions.createdAt, to)
          )
        );

      // Agrupar por categoria
      const byCategory = Array.from(
        allTransactions.reduce((map, t) => {
          const cat = t.category || "other";
          const existing = map.get(cat) || 0;
          map.set(cat, existing + (parseFloat(t.amount as any) || 0));
          return map;
        }, new Map<string, number>())
      ).map(([category, total]) => ({ category, total }));

      // Buscar ultimos 6 meses de transacoes
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      
      const monthlyTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            eq(transactions.type, "income"),
            gte(transactions.createdAt, sixMonthsAgo)
          )
        );

      // Agrupar por mes usando JavaScript
      const monthlyMap = new Map<string, number>();
      monthlyTransactions.forEach(t => {
        const date = new Date(t.createdAt);
        const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
        const existing = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, existing + (parseFloat(t.amount as any) || 0));
      });

      const monthly = Array.from(monthlyMap.entries()).map(([month, total]) => ({
        month,
        total,
      }));

      return { byCategory, monthly };
    }),

  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["income", "expense", "refund"]).default("income"),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("paid"),
        description: z.string().min(1),
        amount: z.string(),
        category: z.string().default("other"),
        transactionDate: z.string().optional(),
        patientId: z.number().optional(),
        sessionId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const transactionDate = input.transactionDate
        ? new Date(input.transactionDate as string).getTime()
        : Date.now();
      const result = await db.insert(transactions).values({
        userId: ctx.user.id,
        patientId: input.patientId,
        sessionId: input.sessionId,
        amount: input.amount,
        type: input.type,
        status: input.status,
        category: input.category,
        description: input.description,
        transactionDate,
      });
      // Notify owner on overdue
      if (input.status === "overdue") {
        await notifyOwner({
          title: "Pagamento em atraso registrado",
          content: `Uma transação em atraso foi registrada: ${input.description} — R$ ${input.amount}`,
        }).catch(() => {});
      }
      return { id: (result[0] as { insertId: number }).insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["income", "expense", "refund"]).optional(),
        status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
        description: z.string().min(1).optional(),
        amount: z.string().optional(),
        category: z.string().optional(),
        transactionDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Verify ownership
      const existing = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);

      if (!existing) throw new Error("Transaction not found or unauthorized");

      const updateData: Record<string, any> = {};
      if (input.type) updateData.type = input.type;
      if (input.status) updateData.status = input.status;
      if (input.description) updateData.description = input.description;
      if (input.amount) updateData.amount = input.amount;
      if (input.category) updateData.category = input.category;
      if (input.transactionDate) updateData.transactionDate = new Date(input.transactionDate).getTime();
      if (input.notes !== undefined) updateData.notes = input.notes;

      await db.update(transactions).set(updateData).where(eq(transactions.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Verify ownership
      const existing = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, input.id), eq(transactions.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);

      if (!existing) throw new Error("Transaction not found or unauthorized");

      await db.delete(transactions).where(eq(transactions.id, input.id));
      return { success: true };
    }),

  deleteBulk: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Check if all transactions belong to the user
      const userTransactions = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            sql`id IN (${sql.raw(input.ids.join(","))})`
          )
        );

      if (userTransactions.length !== input.ids.length) {
        throw new Error("Some transactions not found or unauthorized");
      }

      await db.delete(transactions).where(
        and(
          eq(transactions.userId, ctx.user.id),
          sql`id IN (${sql.raw(input.ids.join(","))})`
        )
      );
      return { success: true, deletedCount: input.ids.length };
    }),

  // Billing Dashboard
  billingMetrics: protectedProcedure
    .input(z.object({ period: z.enum(["week", "month", "quarter", "year"]).default("month") }))
    .query(async ({ ctx, input }) => {
      return getBillingMetrics(ctx.user.id, input.period);
    }),

  monthlyRevenueWithForecast: protectedProcedure
    .input(z.object({ months: z.number().optional().default(12) }))
    .query(async ({ ctx, input }) => {
      return getMonthlyRevenueWithForecast(ctx.user.id, input.months);
    }),

  topPatientsByRevenue: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ ctx, input }) => {
      return getTopPatientsByRevenue(ctx.user.id, input.limit);
    }),
});
