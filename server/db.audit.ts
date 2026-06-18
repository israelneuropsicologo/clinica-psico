import { getDb } from "./db";
import { auditLogs, AuditLog, InsertAuditLog } from "../drizzle/schema";

export type LogAuditParams = Omit<InsertAuditLog, 'createdAt'>;

/**
 * Registra uma atividade no log de auditoria
 */
export async function logAudit(params: LogAuditParams) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not connected");
    await db.insert(auditLogs).values({
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      description: params.description,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      status: params.status || "success",
      errorMessage: params.errorMessage,
    });
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
    // Não falha a operação principal se a auditoria falhar
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");
  let query = db.select().from(auditLogs);

  // TODO: Adicionar filtros dinâmicos com where()

  return query as any;
}
