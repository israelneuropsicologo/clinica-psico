import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getUserCreditsBalance,
  getAgentCreditsBalance,
  consumeUserCredits,
  initializeUserCredits,
  initializeAgentCredits,
} from "../virtual-credits";
import { getDb } from "../db";
import {
  virtualCreditTransactions,
  agentCreditTransactions,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const virtualCreditsRouter = router({
  // ─── Obter Saldo do Usuário ──────────────────────────────────────────
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const balance = await getUserCreditsBalance(ctx.user.id);
    return {
      userId: ctx.user.id,
      balance: balance || "0",
      status: balance ? "active" : "not_initialized",
    };
  }),

  // ─── Obter Histórico de Transações do Usuário ─────────────────────────
  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { transactions: [], error: "Banco de dados não conectado" };

      try {
        const transactions = await db
          .select()
          .from(virtualCreditTransactions)
          .where(eq(virtualCreditTransactions.userId, ctx.user.id))
          .orderBy(desc(virtualCreditTransactions.createdAt))
          .limit(input.limit);

        return {
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.transactionType,
            amount: t.amount.toString(),
            description: t.description,
            balanceBefore: t.balanceBefore.toString(),
            balanceAfter: t.balanceAfter.toString(),
            createdAt: t.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Virtual Credits] Erro ao buscar histórico:", error);
        return { transactions: [], error: "Erro ao buscar histórico" };
      }
    }),

  // ─── Inicializar Créditos para Novo Usuário ──────────────────────────
  initialize: protectedProcedure.mutation(async ({ ctx }) => {
    const success = await initializeUserCredits(ctx.user.id);
    return {
      success,
      message: success
        ? "Créditos inicializados com sucesso"
        : "Erro ao inicializar créditos",
    };
  }),

  // ─── Obter Saldo de Agente (Admin) ───────────────────────────────────
  getAgentBalance: protectedProcedure
    .input(z.object({ agentName: z.string() }))
    .query(async ({ ctx, input }) => {
      // Apenas admins podem ver saldo de agentes
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas admins podem acessar saldo de agentes");
      }

      const balance = await getAgentCreditsBalance(input.agentName);
      return {
        agentName: input.agentName,
        balance: balance || "0",
        status: balance ? "active" : "not_initialized",
      };
    }),

  // ─── Obter Log de Comunicações entre Agentes (Admin) ─────────────────
  getAgentCommunicationLog: protectedProcedure
    .input(z.object({ agentName: z.string().optional(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      // Apenas admins podem ver log de comunicações
      if (ctx.user.role !== "admin") {
        throw new Error("Apenas admins podem acessar log de comunicações");
      }

      const db = await getDb();
      if (!db) return { communications: [], error: "Banco de dados não conectado" };

      try {
        const communications = await db
          .select()
          .from(agentCreditTransactions)
          .where(
            input.agentName
              ? eq(agentCreditTransactions.agentName, input.agentName)
              : undefined
          )
          .orderBy(desc(agentCreditTransactions.createdAt));



        return {
          communications: communications.map((c) => ({
            id: c.id,
            agentName: c.agentName,
            type: c.transactionType,
            relatedAgent: c.relatedAgent,
            amount: c.amount.toString(),
            description: c.description,
            createdAt: c.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Virtual Credits] Erro ao buscar log:", error);
        return { communications: [], error: "Erro ao buscar log" };
      }
    }),

  // ─── Consumir Créditos (Interno) ──────────────────────────────────────
  consume: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        transactionType: z.enum([
          "email_send",
          "api_call",
          "report_generation",
          "data_sync",
          "manual_adjustment",
        ]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await consumeUserCredits(
        ctx.user.id,
        input.amount,
        input.transactionType,
        input.description
      );

      return result;
    }),

  // ─── Estatísticas de Créditos (Admin) ─────────────────────────────────
  getStatistics: protectedProcedure.query(async ({ ctx }) => {
    // Apenas admins podem ver estatísticas
    if (ctx.user.role !== "admin") {
      throw new Error("Apenas admins podem acessar estatísticas");
    }

    const db = await getDb();
    if (!db) return { error: "Banco de dados não conectado" };

    try {
      // Contar transações totais
      const totalTransactions = await db
        .select()
        .from(virtualCreditTransactions);

      // Contar transações de agentes
      const agentTransactions = await db
        .select()
        .from(agentCreditTransactions);

      // Calcular total gasto
      let totalSpent = 0;
      for (const t of totalTransactions) {
        if (t.transactionType !== "regeneration" && t.transactionType !== "bonus") {
          totalSpent += parseFloat(t.amount.toString());
        }
      }

      return {
        totalUserTransactions: totalTransactions.length,
        totalAgentTransactions: agentTransactions.length,
        totalSpent: totalSpent.toString(),
        transactionTypes: {
          regeneration: totalTransactions.filter(
            (t) => t.transactionType === "regeneration"
          ).length,
          emailSend: totalTransactions.filter(
            (t) => t.transactionType === "email_send"
          ).length,
          apiCall: totalTransactions.filter(
            (t) => t.transactionType === "api_call"
          ).length,
          reportGeneration: totalTransactions.filter(
            (t) => t.transactionType === "report_generation"
          ).length,
          dataSync: totalTransactions.filter(
            (t) => t.transactionType === "data_sync"
          ).length,
        },
      };
    } catch (error) {
      console.error("[Virtual Credits] Erro ao buscar estatísticas:", error);
      return { error: "Erro ao buscar estatísticas" };
    }
  }),
});
