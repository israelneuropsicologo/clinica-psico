/**
 * Logger LGPD (Lei Geral de Proteção de Dados)
 * Registra todas as operações com dados sensíveis para auditoria
 */

export enum LGPDEventType {
  // Operações com dados sensíveis
  PATIENT_CREATED = "PATIENT_CREATED",
  PATIENT_UPDATED = "PATIENT_UPDATED",
  PATIENT_DELETED = "PATIENT_DELETED",
  PATIENT_VIEWED = "PATIENT_VIEWED",
  PATIENT_EXPORTED = "PATIENT_EXPORTED",

  // Operações com dados financeiros
  TRANSACTION_CREATED = "TRANSACTION_CREATED",
  TRANSACTION_UPDATED = "TRANSACTION_UPDATED",
  TRANSACTION_DELETED = "TRANSACTION_DELETED",
  TRANSACTION_EXPORTED = "TRANSACTION_EXPORTED",

  // Operações com documentos
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  DOCUMENT_DOWNLOADED = "DOCUMENT_DOWNLOADED",
  DOCUMENT_DELETED = "DOCUMENT_DELETED",

  // Operações de sincronização
  WEBHOOK_SYNC_PATIENT = "WEBHOOK_SYNC_PATIENT",
  WEBHOOK_SYNC_APPOINTMENT = "WEBHOOK_SYNC_APPOINTMENT",
  WEBHOOK_SYNC_PAYMENT = "WEBHOOK_SYNC_PAYMENT",

  // Operações administrativas
  SETTINGS_UPDATED = "SETTINGS_UPDATED",
  TOKEN_GENERATED = "TOKEN_GENERATED",
  TOKEN_REVOKED = "TOKEN_REVOKED",
}

export interface LGPDLogEntry {
  id?: string;
  timestamp: Date;
  userId: number;
  eventType: LGPDEventType;
  resourceType: string; // "patient", "transaction", "document", etc
  resourceId: string | number;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXPORT";
  dataClassification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  description: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILED";
  errorMessage?: string;
}

// Armazenar logs em memória (em produção, usar banco de dados)
const lgpdLogs: LGPDLogEntry[] = [];

/**
 * Registra um evento LGPD
 */
export function logLGPDEvent(entry: Omit<LGPDLogEntry, "id" | "timestamp">): void {
  const logEntry: LGPDLogEntry = {
    id: `lgpd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    ...entry,
  };

  lgpdLogs.push(logEntry);

  // Log no console para debugging
  console.log(
    `[LGPD] ${logEntry.eventType} - ${logEntry.resourceType}#${logEntry.resourceId} - ${logEntry.action} - ${logEntry.status}`
  );

  // Manter apenas os últimos 10000 logs em memória
  if (lgpdLogs.length > 10000) {
    lgpdLogs.splice(0, lgpdLogs.length - 10000);
  }
}

/**
 * Obtém logs LGPD para um usuário
 */
export function getLGPDLogs(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
    eventType?: LGPDEventType;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }
): LGPDLogEntry[] {
  let filtered = lgpdLogs.filter((log) => log.userId === userId);

  if (options?.eventType) {
    filtered = filtered.filter((log) => log.eventType === options.eventType);
  }

  if (options?.resourceType) {
    filtered = filtered.filter((log) => log.resourceType === options.resourceType);
  }

  if (options?.startDate) {
    filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
  }

  if (options?.endDate) {
    filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
  }

  // Ordenar por timestamp descendente (mais recentes primeiro)
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const offset = options?.offset || 0;
  const limit = options?.limit || 100;

  return filtered.slice(offset, offset + limit);
}

/**
 * Exporta relatório de auditoria LGPD
 */
export function exportLGPDAuditReport(
  userId: number,
  startDate: Date,
  endDate: Date
): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByResource: Record<string, number>;
  events: LGPDLogEntry[];
} {
  const logs = getLGPDLogs(userId, { startDate, endDate });

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
}

/**
 * Registra acesso a dados sensíveis
 */
export function logSensitiveDataAccess(
  userId: number,
  resourceType: string,
  resourceId: string | number,
  reason: string,
  ipAddress?: string
): void {
  logLGPDEvent({
    userId,
    eventType: LGPDEventType.PATIENT_VIEWED,
    resourceType,
    resourceId,
    action: "READ",
    dataClassification: "RESTRICTED",
    description: `Acesso a dados sensíveis: ${reason}`,
    ipAddress,
    status: "SUCCESS",
  });
}

/**
 * Registra exclusão de dados (importante para LGPD - direito ao esquecimento)
 */
export function logDataDeletion(
  userId: number,
  resourceType: string,
  resourceId: string | number,
  reason: string
): void {
  logLGPDEvent({
    userId,
    eventType: LGPDEventType.PATIENT_DELETED,
    resourceType,
    resourceId,
    action: "DELETE",
    dataClassification: "RESTRICTED",
    description: `Exclusão de dados: ${reason}`,
    status: "SUCCESS",
  });
}

/**
 * Registra exportação de dados (importante para LGPD - direito de portabilidade)
 */
export function logDataExport(
  userId: number,
  resourceType: string,
  format: "CSV" | "JSON" | "PDF",
  recordCount: number
): void {
  logLGPDEvent({
    userId,
    eventType: LGPDEventType.PATIENT_EXPORTED,
    resourceType,
    resourceId: `export_${Date.now()}`,
    action: "EXPORT",
    dataClassification: "CONFIDENTIAL",
    description: `Exportação de ${recordCount} registros em formato ${format}`,
    details: { format, recordCount },
    status: "SUCCESS",
  });
}
