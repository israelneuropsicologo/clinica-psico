import z from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { transactions } from "../../drizzle/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

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
        .orderBy(desc(transactions.createdAt))
        .catch(() => []);
    }),

  summary: protectedProcedure
    .input(z.object({ period: z.string().optional().default("month") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { byCategory: [], monthly: [] };

      const { from, to } = getPeriodRange(input.period);

      let byCategory: Array<{ category: string | null; total: number }> = [];
      try {
        byCategory = await db
          .select({
            category: transactions.category,
            total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, ctx.user.id),
              eq(transactions.type, "income"),
              gte(transactions.createdAt, from),
              lte(transactions.createdAt, to)
            )
          )
          .groupBy(transactions.category)
          .catch(() => []);
      } catch (err) {
        console.error("[financial.summary] Error fetching byCategory:", err);
      }

      let monthly: Array<{ month: string; total: number }> = [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const result = await db.execute(sql`
          SELECT 
            DATE_FORMAT(createdAt, '%b') as month,
            COALESCE(SUM(amount), 0) as total
          FROM transactions
          WHERE 
            userId = ${ctx.user.id}
            AND type = 'income'
            AND createdAt >= ${sixMonthsAgo}
          GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
          ORDER BY DATE_FORMAT(createdAt, '%Y-%m')
        `);
        
        if (result && Array.isArray(result)) {
          monthly = result as Array<{ month: string; total: number }>;
        }
      } catch (err) {
        console.error("[financial.summary] Error fetching monthly data:", err);
      }

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
});
