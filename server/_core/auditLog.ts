/**
 * Audit Logging System
 * Tracks all AI analysis operations and data access for compliance
 */

import { getDb } from "../db";
import { TRPCError } from "@trpc/server";

export interface AuditLogEntry {
  id?: number;
  userId: number;
  action: string;
  entityType: "patient" | "analysis" | "report" | "risk_alert" | "recommendation";
  entityId: number;
  description: string;
  dataAccessed: string[];
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failed" | "denied";
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<void> {
  try {
    // In production, this would write to a dedicated audit log table
    // For now, we'll log to console and could extend to database
    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    console.log("[AUDIT]", JSON.stringify(logEntry));

    // Store in database if audit_logs table exists
    // await db.insert(auditLogs).values(logEntry);
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Log patient data access
 */
export async function logPatientAccess(
  userId: number,
  patientId: number,
  action: "view" | "edit" | "delete" | "export",
  dataAccessed: string[],
  status: "success" | "failed" | "denied" = "success"
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `patient_${action}`,
    entityType: "patient",
    entityId: patientId,
    description: `User ${action}ed patient record`,
    dataAccessed,
    status,
  });
}

/**
 * Log AI analysis operation
 */
export async function logAIAnalysis(
  userId: number,
  patientId: number,
  analysisType: "sentiment" | "risk" | "recommendation" | "trend",
  status: "success" | "failed" = "success",
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `ai_analysis_${analysisType}`,
    entityType: "analysis",
    entityId: patientId,
    description: `AI ${analysisType} analysis performed`,
    dataAccessed: ["clinical_notes", "session_data"],
    status,
    metadata,
  });
}

/**
 * Log report generation
 */
export async function logReportGeneration(
  userId: number,
  patientId: number,
  reportType: "ai_analysis" | "clinical_summary" | "risk_assessment",
  format: "txt" | "json" | "pdf",
  status: "success" | "failed" = "success"
): Promise<void> {
  await logAuditEvent({
    userId,
    action: `report_generated`,
    entityType: "report",
    entityId: patientId,
    description: `${reportType} report generated in ${format} format`,
    dataAccessed: ["patient_data", "analysis_results"],
    status,
    metadata: { reportType, format },
  });
}

/**
 * Log risk alert generation
 */
export async function logRiskAlert(
  userId: number,
  patientId: number,
  riskLevel: "low" | "medium" | "high" | "critical",
  riskFactors: string[]
): Promise<void> {
  await logAuditEvent({
    userId,
    action: "risk_alert_generated",
    entityType: "risk_alert",
    entityId: patientId,
    description: `${riskLevel.toUpperCase()} risk alert generated`,
    dataAccessed: ["clinical_notes", "patient_history"],
    status: "success",
    metadata: { riskLevel, riskFactors },
  });
}

/**
 * Log recommendation generation
 */
export async function logRecommendation(
  userId: number,
  patientId: number,
  recommendationType: string,
  confidence: number
): Promise<void> {
  await logAuditEvent({
    userId,
    action: "recommendation_generated",
    entityType: "recommendation",
    entityId: patientId,
    description: `Treatment recommendation generated: ${recommendationType}`,
    dataAccessed: ["patient_history", "clinical_patterns"],
    status: "success",
    metadata: { recommendationType, confidence },
  });
}

/**
 * Get audit logs for a patient (for compliance/review)
 */
export async function getPatientAuditLogs(
  userId: number,
  patientId: number,
  daysBack: number = 90
): Promise<AuditLogEntry[]> {
  // In production, this would query the audit_logs table
  // For now, return empty array as placeholder
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // This would be:
  // return db.select().from(auditLogs)
  //   .where(and(
  //     eq(auditLogs.entityId, patientId),
  //     gte(auditLogs.timestamp, startDate)
  //   ))
  //   .orderBy(desc(auditLogs.timestamp));

  return [];
}

/**
 * Get audit logs for a user (for accountability)
 */
export async function getUserAuditLogs(
  userId: number,
  daysBack: number = 90
): Promise<AuditLogEntry[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // This would be:
  // return db.select().from(auditLogs)
  //   .where(and(
  //     eq(auditLogs.userId, userId),
  //     gte(auditLogs.timestamp, startDate)
  //   ))
  //   .orderBy(desc(auditLogs.timestamp));

  return [];
}

/**
 * Get all failed access attempts (security monitoring)
 */
export async function getFailedAccessAttempts(daysBack: number = 30): Promise<AuditLogEntry[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // This would be:
  // return db.select().from(auditLogs)
  //   .where(and(
  //     eq(auditLogs.status, "failed"),
  //     gte(auditLogs.timestamp, startDate)
  //   ))
  //   .orderBy(desc(auditLogs.timestamp));

  return [];
}

/**
 * Export audit logs for compliance reports
 */
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date,
  format: "json" | "csv" = "json"
): Promise<string> {
  // This would query all audit logs in the date range
  // For now, return placeholder

  const logs: AuditLogEntry[] = [];

  if (format === "json") {
    return JSON.stringify(logs, null, 2);
  } else {
    // CSV format
    const headers = ["Timestamp", "User ID", "Action", "Entity Type", "Entity ID", "Status", "Description"];
    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.entityType,
      log.entityId,
      log.status,
      log.description,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    return csv;
  }
}
