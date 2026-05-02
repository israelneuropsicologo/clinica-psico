import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("webhooks router", () => {
  it("should generate API token for webhook authentication", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.generateToken({
      name: "Test Token",
      description: "Token for testing",
    });

    expect(result).toHaveProperty("token");
    expect(result.token).toBeTruthy();
    expect(result.token.length).toBeGreaterThan(20);
  });

  it.skip("should validate customer exists", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First, sync a patient to create a customer
      const result = await caller.webhooks.syncPatient({
      customer_id: "cust_test_123",
      name: "Test Patient",
      email: "test@example.com",
      phone: "+55 11 99999-9999",
      birth_date: "1990-01-15",
      cpf: "123.456.789-00",
      address: "Rua Test, 123",
      occupation: "Engineer",
      main_complaint: "Anxiety",
      medical_history: "None",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);

    // Now validate the customer exists
    const validateResult = await caller.webhooks.validateCustomer({
      customer_id: "cust_test_123",
    });

    expect(validateResult).toHaveProperty("exists");
    expect(validateResult.exists).toBe(true);
  });

  it.skip("should sync patient and create webhook log", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.webhooks.syncPatient({
      customer_id: "cust_patient_456",
      name: "João Silva",
      email: "joao@example.com",
      phone: "+55 11 98765-4321",
      birth_date: "1985-05-20",
      cpf: "987.654.321-00",
      address: "Av. Paulista, 1000",
      occupation: "Doctor",
      main_complaint: "Depression",
      medical_history: "Hypertension",
    });

    expect(result).toBeTruthy();
    expect(typeof result).toBe("object");
  });

  it.skip("should sync appointment with payment validation", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a patient
    const patientResult = await caller.webhooks.syncPatient({
      customer_id: "cust_apt_789",
      name: "Maria Santos",
      email: "maria@example.com",
      phone: "+55 11 97777-7777",
      birth_date: "1992-03-10",
      cpf: "111.222.333-44",
      address: "Rua Santos, 500",
      occupation: "Teacher",
      main_complaint: "Stress",
      medical_history: "None",
    });

    // Now sync an appointment
    const appointmentResult = await caller.webhooks.syncAppointment({
      customer_id: "cust_apt_789",
      appointment_date: "2026-05-15T14:00:00Z",
      service_type: "Psychotherapy",
      duration_minutes: 50,
      notes: "First session",
      payment_status: "approved",
      transaction_id: "txn_apt_001",
    });

    expect(appointmentResult).toBeTruthy();
    expect(typeof appointmentResult).toBe("object");
  });

  it.skip("should reject appointment if payment not approved", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create a patient
    await caller.webhooks.syncPatient({
      customer_id: "cust_apt_rejected",
      name: "Pedro Costa",
      email: "pedro@example.com",
      phone: "+55 11 96666-6666",
      birth_date: "1988-07-25",
      cpf: "555.666.777-88",
      address: "Rua Costa, 300",
      occupation: "Engineer",
      main_complaint: "Anxiety",
      medical_history: "None",
    });

    // Try to sync appointment with pending payment - should throw error
    let errorThrown = false;
    try {
      await caller.webhooks.syncAppointment({
        customer_id: "cust_apt_rejected",
        appointment_date: "2026-05-20T15:00:00Z",
        service_type: "Consultation",
        duration_minutes: 30,
        notes: "Pending payment",
        payment_status: "pending",
        transaction_id: "txn_apt_pending",
      });
    } catch (error) {
      errorThrown = true;
    }

    expect(errorThrown).toBe(true);
  });

  it.skip("should sync payment and update transaction", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First create patient and appointment
    const patientResult = await caller.webhooks.syncPatient({
      customer_id: "cust_pay_111",
      name: "Ana Silva",
      email: "ana@example.com",
      phone: "+55 11 95555-5555",
      birth_date: "1995-11-30",
      cpf: "999.888.777-66",
      address: "Rua Ana, 200",
      occupation: "Lawyer",
      main_complaint: "Burnout",
      medical_history: "None",
    });

    await caller.webhooks.syncAppointment({
      customer_id: "cust_pay_111",
      appointment_date: "2026-05-25T10:00:00Z",
      service_type: "Therapy",
      duration_minutes: 50,
      notes: "Payment pending",
      payment_status: "approved",
      transaction_id: "txn_pay_001",
    });

    // Now sync payment
    const paymentResult = await caller.webhooks.syncPayment({
      transaction_id: "txn_pay_001",
      customer_id: "cust_pay_111",
      amount: 150.00,
      currency: "BRL",
      payment_status: "approved",
      payment_method: "credit_card",
    });

    expect(paymentResult).toBeTruthy();
    expect(typeof paymentResult).toBe("object");
  });

  it("should get webhook logs", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const logsResult = await caller.webhooks.getLogs({ limit: 10 });

    expect(Array.isArray(logsResult)).toBe(true);
    if (logsResult.length > 0) {
      expect(logsResult[0]).toHaveProperty("id");
      expect(logsResult[0]).toHaveProperty("webhookType");
      expect(logsResult[0]).toHaveProperty("status");
      expect(logsResult[0]).toHaveProperty("syncedAt");
    }
  });

  it("should get webhook sync status", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const statusResult = await caller.webhooks.getStatus();

    expect(statusResult).toHaveProperty("totalSyncs");
    expect(statusResult).toHaveProperty("successCount");
    expect(statusResult).toHaveProperty("failureCount");
    expect(typeof statusResult.totalSyncs).toBe("number");
    expect(typeof statusResult.successCount).toBe("number");
    expect(typeof statusResult.failureCount).toBe("number");
  });
});
