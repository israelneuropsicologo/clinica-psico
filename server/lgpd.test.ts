import { describe, it, expect, beforeEach } from "vitest";
import {
  logLGPDAuditEvent,
  getLGPDAuditLogs,
  exportLGPDAuditReport,
  countLGPDEventsByType,
} from "./db-lgpd";
import type { InsertLGPDAuditLog } from "../drizzle/schema";

describe("LGPD logging module", () => {
  const testUserId = 999;

  beforeEach(async () => {
    // Limpar logs anteriores (em um teste real, seria rollback de transação)
  });

  it("should log LGPD audit event", async () => {
    const event: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_CREATED",
      resourceType: "patient",
      resourceId: "test_patient_1",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Test patient creation",
      status: "SUCCESS",
    };

    // Não deve lançar erro
    await logLGPDAuditEvent(event);

    // Verificar que o evento foi registrado
    const logs = await getLGPDAuditLogs(testUserId);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should retrieve LGPD logs with filters", async () => {
    const event1: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_CREATED",
      resourceType: "patient",
      resourceId: "patient_1",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Patient 1 created",
      status: "SUCCESS",
    };

    const event2: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_DELETED",
      resourceType: "patient",
      resourceId: "patient_2",
      action: "DELETE",
      dataClassification: "RESTRICTED",
      description: "Patient 2 deleted",
      status: "SUCCESS",
    };

    await logLGPDAuditEvent(event1);
    await logLGPDAuditEvent(event2);

    // Filtrar por eventType
    const createdLogs = await getLGPDAuditLogs(testUserId, {
      eventType: "PATIENT_CREATED",
    });

    expect(createdLogs.length).toBeGreaterThan(0);
    expect(createdLogs[0].eventType).toBe("PATIENT_CREATED");
  });

  it("should export LGPD audit report", async () => {
    const event: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_CREATED",
      resourceType: "patient",
      resourceId: "patient_report",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Test report",
      status: "SUCCESS",
    };

    await logLGPDAuditEvent(event);

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
    const endDate = new Date();

    const report = await exportLGPDAuditReport(testUserId, startDate, endDate);

    expect(report).toHaveProperty("totalEvents");
    expect(report).toHaveProperty("eventsByType");
    expect(report).toHaveProperty("eventsByResource");
    expect(report).toHaveProperty("events");
  });

  it("should count events by type", async () => {
    const event1: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_CREATED",
      resourceType: "patient",
      resourceId: "patient_count_1",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Count test 1",
      status: "SUCCESS",
    };

    const event2: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "PATIENT_CREATED",
      resourceType: "patient",
      resourceId: "patient_count_2",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Count test 2",
      status: "SUCCESS",
    };

    await logLGPDAuditEvent(event1);
    await logLGPDAuditEvent(event2);

    const counts = await countLGPDEventsByType(testUserId);

    expect(counts["PATIENT_CREATED"]).toBeGreaterThanOrEqual(2);
  });

  it("should handle pagination in getLGPDAuditLogs", async () => {
    // Registrar múltiplos eventos
    for (let i = 0; i < 5; i++) {
      const event: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
        userId: testUserId,
        eventType: "PATIENT_CREATED",
        resourceType: "patient",
        resourceId: `patient_page_${i}`,
        action: "CREATE",
        dataClassification: "RESTRICTED",
        description: `Pagination test ${i}`,
        status: "SUCCESS",
      };

      await logLGPDAuditEvent(event);
    }

    // Primeira página
    const page1 = await getLGPDAuditLogs(testUserId, { limit: 2, offset: 0 });
    expect(page1.length).toBeLessThanOrEqual(2);

    // Segunda página
    const page2 = await getLGPDAuditLogs(testUserId, { limit: 2, offset: 2 });
    expect(page2.length).toBeLessThanOrEqual(2);
  });

  it("should handle failed events", async () => {
    const failedEvent: Omit<InsertLGPDAuditLog, "id" | "createdAt"> = {
      userId: testUserId,
      eventType: "WEBHOOK_SYNC_PATIENT",
      resourceType: "patient",
      resourceId: "failed_sync",
      action: "CREATE",
      dataClassification: "RESTRICTED",
      description: "Failed webhook sync",
      status: "FAILED",
      errorMessage: "Network timeout",
    };

    await logLGPDAuditEvent(failedEvent);

    const logs = await getLGPDAuditLogs(testUserId);
    const failedLogs = logs.filter((log) => log.status === "FAILED");

    expect(failedLogs.length).toBeGreaterThan(0);
    expect(failedLogs[0].errorMessage).toBe("Network timeout");
  });
});
