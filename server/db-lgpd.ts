import { getDb } from "./db";
import { lgpdAuditLogs } from "../drizzle/schema";
import type { InsertLGPDAuditLog } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Registra um evento LGPD no banco de dados
 */
export async function logLGPDAuditEvent(entry: Omit<InsertLGPDAuditLog, "id" | "createdAt">): Promise<void> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");
    await db.insert(lgpdAuditLogs).values({
      ...entry,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[LGPD DB] Erro ao registrar evento de auditoria:", error);
    // Não lançar erro para não quebrar o fluxo principal
  }
}

/**
 * Obtém logs LGPD para um usuário com filtros
 */
export async function getLGPDAuditLogs(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");

    // Construir condições de filtro
    const conditions = [eq(lgpdAuditLogs.userId, userId)];

    if (options?.eventType) {
      conditions.push(eq(lgpdAuditLogs.eventType, options.eventType));
    }

    if (options?.resourceType) {
      conditions.push(eq(lgpdAuditLogs.resourceType, options.resourceType));
    }

    if (options?.startDate) {
      conditions.push(gte(lgpdAuditLogs.timestamp, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(lgpdAuditLogs.timestamp, options.endDate));
    }

    // Executar query
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;

    const result = await db
      .select()
      .from(lgpdAuditLogs)
      .where(and(...conditions))
      .orderBy(lgpdAuditLogs.timestamp)
      .limit(limit)
      .offset(offset);

    return result;
  } catch (error) {
    console.error("[LGPD DB] Erro ao buscar logs de auditoria:", error);
    return [];
  }
}

/**
 * Exporta relatório de auditoria LGPD
 */
export async function exportLGPDAuditReport(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByResource: Record<string, number>;
  events: any[];
}> {
  try {
    const logs = await getLGPDAuditLogs(userId, { startDate, endDate, limit: 10000 });

    const eventsByType: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};

    for (const log of logs) {
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
      eventsByResource[log.resourceType] = (eventsByResource[log.resourceType] || 0) + 1;
    }

    return {
      totalEvents: logs.length,
      eventsByType,
      eventsByResource,
      events: logs,
    };
  } catch (error) {
    console.error("[LGPD DB] Erro ao exportar relatório de auditoria:", error);
    return {
      totalEvents: 0,
      eventsByType: {},
      eventsByResource: {},
      events: [],
    };
  }
}

/**
 * Conta eventos LGPD por tipo para um usuário
 */
export async function countLGPDEventsByType(userId: number): Promise<Record<string, number>> {
  try {
    const logs = await getLGPDAuditLogs(userId, { limit: 10000 });

    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.eventType] = (counts[log.eventType] || 0) + 1;
    }

    return counts;
  } catch (error) {
    console.error("[LGPD DB] Erro ao contar eventos:", error);
    return {};
  }
}
