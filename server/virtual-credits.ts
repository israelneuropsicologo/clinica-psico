import { getDb } from "./db";
import {
  virtualCredits,
  virtualCreditTransactions,
  agentCreditPool,
  agentCreditTransactions,
} from "../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Sistema de Créditos Virtuais Infinitos
 * - Não depende de créditos reais da plataforma
 * - Regenera automaticamente a cada 5 minutos
 * - Escalável infinitamente
 * - Comunicação entre agentes é GRÁTIS
 */

// ─── Regeneração de Créditos de Usuários ──────────────────────────────────
export async function regenerateUserCredits() {
  const db = await getDb();
  if (!db) {
    console.error("[Virtual Credits] ❌ Banco de dados não conectado");
    return;
  }

  const now = new Date();

  try {
    // Buscar todos os usuários com créditos ativos que precisam regenerar
    const creditsToRegenerate = await db
      .select()
      .from(virtualCredits)
      .where(
        and(
          eq(virtualCredits.isActive, true),
          lt(
            virtualCredits.lastRegeneration,
            new Date(now.getTime() - 300000) // 5 minutos atrás
          )
        )
      );

    console.log(
      `[Virtual Credits] Regenerando ${creditsToRegenerate.length} usuários...`
    );

    for (const credit of creditsToRegenerate) {
      const newBalance =
        parseFloat(credit.balance.toString()) +
        parseFloat(credit.regenerationRate.toString());
      const totalEarned =
        parseFloat(credit.totalEarned.toString()) +
        parseFloat(credit.regenerationRate.toString());

      // Atualizar saldo
      await db
        .update(virtualCredits)
        .set({
          balance: newBalance.toString(),
          totalEarned: totalEarned.toString(),
          lastRegeneration: now,
        })
        .where(eq(virtualCredits.id, credit.id));

      // Registrar transação
      await db.insert(virtualCreditTransactions).values({
        userId: credit.userId,
        transactionType: "regeneration",
        amount: credit.regenerationRate.toString(),
        description: `Regeneração automática de créditos (+${credit.regenerationRate})`,
        balanceBefore: credit.balance.toString(),
        balanceAfter: newBalance.toString(),
        metadata: JSON.stringify({
          regenerationRate: credit.regenerationRate,
          interval: credit.regenerationInterval,
        }),
      });
    }

    console.log(`[Virtual Credits] ✅ Regeneração de usuários completa`);
  } catch (error) {
    console.error(
      "[Virtual Credits] ❌ Erro ao regenerar créditos de usuários:",
      error
    );
  }
}

// ─── Regeneração de Créditos de Agentes ───────────────────────────────────
export async function regenerateAgentCredits() {
  const db = await getDb();
  if (!db) {
    console.error("[Agent Credits] ❌ Banco de dados não conectado");
    return;
  }

  const now = new Date();

  try {
    // Buscar todos os agentes com créditos ativos que precisam regenerar
    const agentCreditsToRegenerate = await db
      .select()
      .from(agentCreditPool)
      .where(
        and(
          eq(agentCreditPool.isActive, true),
          lt(
            agentCreditPool.lastRegeneration,
            new Date(now.getTime() - 300000) // 5 minutos atrás
          )
        )
      );

    console.log(
      `[Agent Credits] Regenerando ${agentCreditsToRegenerate.length} agentes...`
    );

    for (const credit of agentCreditsToRegenerate) {
      const newBalance =
        parseFloat(credit.balance.toString()) +
        parseFloat(credit.regenerationRate.toString());
      const totalEarned =
        parseFloat(credit.totalEarned.toString()) +
        parseFloat(credit.regenerationRate.toString());

      // Atualizar saldo
      await db
        .update(agentCreditPool)
        .set({
          balance: newBalance.toString(),
          totalEarned: totalEarned.toString(),
          lastRegeneration: now,
        })
        .where(eq(agentCreditPool.agentName, credit.agentName));

      // Registrar transação
      await db.insert(agentCreditTransactions).values({
        agentName: credit.agentName,
        transactionType: "regeneration",
        amount: credit.regenerationRate.toString(),
        description: `Regeneração automática de créditos (+${credit.regenerationRate})`,
        balanceBefore: credit.balance.toString(),
        balanceAfter: newBalance.toString(),
        metadata: JSON.stringify({
          regenerationRate: credit.regenerationRate,
        }),
      });
    }

    console.log(`[Agent Credits] ✅ Regeneração de agentes completa`);
  } catch (error) {
    console.error(
      "[Agent Credits] ❌ Erro ao regenerar créditos de agentes:",
      error
    );
  }
}

// ─── Consumir Créditos de Usuário ─────────────────────────────────────────
export async function consumeUserCredits(
  userId: number,
  amount: number | string,
  transactionType:
    | "email_send"
    | "api_call"
    | "report_generation"
    | "data_sync"
    | "manual_adjustment",
  description?: string
): Promise<{ success: boolean; newBalance?: string; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Banco de dados não conectado" };
  }

  try {
    const credit = await db
      .select()
      .from(virtualCredits)
      .where(eq(virtualCredits.userId, userId))
      .limit(1);

    if (!credit.length) {
      return { success: false, error: "Créditos não encontrados" };
    }

    const currentCredit = credit[0];
    const amountNum = parseFloat(amount.toString());
    const currentBalance = parseFloat(currentCredit.balance.toString());
    const newBalance = currentBalance - amountNum;

    if (newBalance < -0.01) {
      return { success: false, error: "Saldo insuficiente" };
    }

    const totalSpent =
      parseFloat(currentCredit.totalSpent.toString()) + amountNum;

    // Atualizar saldo
    await db
      .update(virtualCredits)
      .set({
        balance: newBalance.toString(),
        totalSpent: totalSpent.toString(),
      })
      .where(eq(virtualCredits.userId, userId));

    // Registrar transação
    await db.insert(virtualCreditTransactions).values({
      userId,
      transactionType,
      amount: amountNum.toString(),
      description: description || `${transactionType} (-${amount})`,
      balanceBefore: currentCredit.balance.toString(),
      balanceAfter: newBalance.toString(),
    });

    return { success: true, newBalance: newBalance.toString() };
  } catch (error) {
    console.error("[Virtual Credits] ❌ Erro ao consumir créditos:", error);
    return { success: false, error: "Erro ao consumir créditos" };
  }
}

// ─── Comunicação entre Agentes (GRÁTIS) ───────────────────────────────────
export async function logAgentCommunication(
  fromAgent: string,
  toAgent: string,
  messageType: string,
  description?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Agent Credits] ❌ Banco de dados não conectado");
    return;
  }

  try {
    // Comunicação entre agentes é GRÁTIS - não consome créditos
    // Apenas registra a transação para auditoria

    const fromAgentCredit = await db
      .select()
      .from(agentCreditPool)
      .where(eq(agentCreditPool.agentName, fromAgent))
      .limit(1);

    if (fromAgentCredit.length) {
      const credit = fromAgentCredit[0];

      await db.insert(agentCreditTransactions).values({
        agentName: fromAgent,
        transactionType: "communication_sent",
        amount: "0", // GRÁTIS
        description: description || `Comunicação enviada para ${toAgent}`,
        balanceBefore: credit.balance.toString(),
        balanceAfter: credit.balance.toString(),
        relatedAgent: toAgent,
        metadata: JSON.stringify({ messageType }),
      });
    }

    const toAgentCredit = await db
      .select()
      .from(agentCreditPool)
      .where(eq(agentCreditPool.agentName, toAgent))
      .limit(1);

    if (toAgentCredit.length) {
      const credit = toAgentCredit[0];

      await db.insert(agentCreditTransactions).values({
        agentName: toAgent,
        transactionType: "communication_received",
        amount: "0", // GRÁTIS
        description: description || `Comunicação recebida de ${fromAgent}`,
        balanceBefore: credit.balance.toString(),
        balanceAfter: credit.balance.toString(),
        relatedAgent: fromAgent,
        metadata: JSON.stringify({ messageType }),
      });
    }
  } catch (error) {
    console.error("[Agent Credits] ❌ Erro ao registrar comunicação:", error);
  }
}

// ─── Obter Saldo de Créditos ──────────────────────────────────────────────
export async function getUserCreditsBalance(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const credit = await db
      .select()
      .from(virtualCredits)
      .where(eq(virtualCredits.userId, userId))
      .limit(1);

    return credit.length ? credit[0].balance.toString() : null;
  } catch (error) {
    console.error("[Virtual Credits] ❌ Erro ao obter saldo:", error);
    return null;
  }
}

// ─── Obter Saldo de Agente ────────────────────────────────────────────────
export async function getAgentCreditsBalance(agentName: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const credit = await db
      .select()
      .from(agentCreditPool)
      .where(eq(agentCreditPool.agentName, agentName))
      .limit(1);

    return credit.length ? credit[0].balance.toString() : null;
  } catch (error) {
    console.error("[Agent Credits] ❌ Erro ao obter saldo de agente:", error);
    return null;
  }
}

// ─── Inicializar Créditos para Novo Usuário ──────────────────────────────
export async function initializeUserCredits(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error("[Virtual Credits] ❌ Banco de dados não conectado");
    return false;
  }

  try {
    const existing = await db
      .select()
      .from(virtualCredits)
      .where(eq(virtualCredits.userId, userId))
      .limit(1);

    if (existing.length) {
      return true; // Já inicializado
    }

    await db.insert(virtualCredits).values({
      userId,
      balance: "1000",
      totalEarned: "1000",
      totalSpent: "0",
      regenerationRate: "100",
      regenerationInterval: 300,
      isActive: true,
    });

    console.log(
      `[Virtual Credits] ✅ Créditos inicializados para usuário ${userId}`
    );
    return true;
  } catch (error) {
    console.error("[Virtual Credits] ❌ Erro ao inicializar créditos:", error);
    return false;
  }
}

// ─── Inicializar Créditos para Novo Agente ───────────────────────────────
export async function initializeAgentCredits(agentName: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    console.error("[Agent Credits] ❌ Banco de dados não conectado");
    return false;
  }

  try {
    const existing = await db
      .select()
      .from(agentCreditPool)
      .where(eq(agentCreditPool.agentName, agentName))
      .limit(1);

    if (existing.length) {
      return true; // Já inicializado
    }

    await db.insert(agentCreditPool).values({
      agentName,
      balance: "10000",
      totalEarned: "10000",
      totalSpent: "0",
      regenerationRate: "500",
      isActive: true,
    });

    console.log(
      `[Agent Credits] ✅ Créditos inicializados para agente ${agentName}`
    );
    return true;
  } catch (error) {
    console.error(
      "[Agent Credits] ❌ Erro ao inicializar créditos de agente:",
      error
    );
    return false;
  }
}

// ─── Scheduler de Regeneração ────────────────────────────────────────────
export function startCreditRegenerationScheduler() {
  console.log(
    "[Virtual Credits] 🔄 Iniciando scheduler de regeneração de créditos..."
  );

  // Regenerar créditos a cada 5 minutos
  setInterval(async () => {
    await regenerateUserCredits();
    await regenerateAgentCredits();
  }, 300000); // 5 minutos

  // Executar uma vez na inicialização
  regenerateUserCredits();
  regenerateAgentCredits();

  console.log("[Virtual Credits] ✅ Scheduler de regeneração ativo");
}
