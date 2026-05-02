import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-openid",
    email: "psicologo@clinica.com",
    name: "Dra. Ana Silva",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = makeUser()): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
    _clearedCookies: clearedCookies,
  } as TrpcContext & { _clearedCookies: typeof clearedCookies };
}

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getSessions: vi.fn().mockResolvedValue([
    { id: 1, patientId: 1, scheduledAt: Date.now(), status: "scheduled", userId: 1, notes: "Test session" },
  ]),
  getTransactions: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, amount: 200, type: "income", category: "session", createdAt: new Date() },
  ]),
  getPatientById: vi.fn().mockResolvedValue({ id: 1, name: "Joao da Silva", userId: 1 }),
  getPatients: vi.fn().mockResolvedValue([
    { id: 1, name: "Joao da Silva", userId: 1, leadStatus: "lead" },
    { id: 2, name: "Maria Silva", userId: 1, leadStatus: "prospect" },
    { id: 3, name: "Pedro Santos", userId: 1, leadStatus: "customer" },
  ]),
  getClinicalNotesBySession: vi.fn().mockResolvedValue([]),
  getDocumentsByPatient: vi.fn().mockResolvedValue([]),
}));

vi.mock("./_core/reportGenerator", () => ({
  generatePatientReport: vi.fn().mockResolvedValue(Buffer.from("PDF_CONTENT_PATIENT")),
  generateFinancialReport: vi.fn().mockResolvedValue(Buffer.from("PDF_CONTENT_FINANCIAL")),
}));

describe("reports router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(makeCtx());
  });

  describe("generatePatientPDF", () => {
    it("should generate patient PDF report", async () => {
      const result = await caller.reports.generatePatientPDF({
        status: "all",
        leadSource: "all",
        leadStatus: "all",
      });

      expect(result.success).toBe(true);
      expect(result.filename).toContain("relatorio_pacientes_");
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.mimeType).toBe("application/pdf");
      expect(result.data).toBeTruthy();
      // Verify it's valid base64
      expect(() => Buffer.from(result.data, "base64")).not.toThrow();
    });

    it("should generate patient PDF with status filter", async () => {
      const result = await caller.reports.generatePatientPDF({
        status: "active",
        leadSource: "all",
        leadStatus: "all",
      });

      expect(result.success).toBe(true);
      expect(result.filename).toContain("relatorio_pacientes_");
      expect(result.data).toBeTruthy();
    });

    it("should generate patient PDF with lead source filter", async () => {
      const result = await caller.reports.generatePatientPDF({
        status: "all",
        leadSource: "chatbot",
        leadStatus: "all",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeTruthy();
    });
  });

  describe("generateFinancialPDF", () => {
    it("should generate financial PDF report", async () => {
      const result = await caller.reports.generateFinancialPDF({});

      expect(result.success).toBe(true);
      expect(result.filename).toContain("relatorio_financeiro_");
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.mimeType).toBe("application/pdf");
      expect(result.data).toBeTruthy();
      // Verify it's valid base64
      expect(() => Buffer.from(result.data, "base64")).not.toThrow();
    });

    it("should generate financial PDF with date range", async () => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const result = await caller.reports.generateFinancialPDF({
        from: thirtyDaysAgo,
        to: now,
      });

      expect(result.success).toBe(true);
      expect(result.filename).toContain("relatorio_financeiro_");
      expect(result.data).toBeTruthy();
    });
  });

  describe("exportSessions", () => {
    it("should export sessions as JSON", async () => {
      const result = await caller.reports.exportSessions({
        format: "json",
      });

      expect(result.filename).toContain("sessoes_");
      expect(result.filename).toMatch(/\.json$/);
      expect(result.mimeType).toBe("application/json");
      expect(result.content).toBeTruthy();
      // Verify it's valid JSON
      expect(() => JSON.parse(result.content)).not.toThrow();
    });

    it("should export sessions as CSV", async () => {
      const result = await caller.reports.exportSessions({
        format: "csv",
      });

      expect(result.filename).toContain("sessoes_");
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.mimeType).toBe("text/csv");
      expect(result.content).toBeTruthy();
      // Verify it contains CSV headers
      expect(result.content).toContain("ID");
      expect(result.content).toContain("Paciente");
    });
  });

  describe("exportFinancial", () => {
    it("should export financial data as JSON", async () => {
      const result = await caller.reports.exportFinancial({
        format: "json",
      });

      expect(result.filename).toContain("financeiro_");
      expect(result.filename).toMatch(/\.json$/);
      expect(result.mimeType).toBe("application/json");
      expect(result.content).toBeTruthy();
      // Verify it's valid JSON
      const parsed = JSON.parse(result.content);
      expect(parsed).toHaveProperty("summary");
      expect(parsed).toHaveProperty("transactions");
    });

    it("should export financial data as CSV", async () => {
      const result = await caller.reports.exportFinancial({
        format: "csv",
      });

      expect(result.filename).toContain("financeiro_");
      expect(result.filename).toMatch(/\.csv$/);
      expect(result.mimeType).toBe("text/csv");
      expect(result.content).toBeTruthy();
      // Verify it contains CSV headers
      expect(result.content).toContain("Data");
      expect(result.content).toContain("Tipo");
    });
  });

  describe("generateReportSummary", () => {
    it("should generate sessions summary", async () => {
      const result = await caller.reports.generateReportSummary({
        type: "sessions",
      });

      expect(result.type).toBe("sessions");
      expect(result.data).toBeTruthy();
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(result.generatedAt).toBeTruthy();
    });

    it("should generate financial summary", async () => {
      const result = await caller.reports.generateReportSummary({
        type: "financial",
      });

      expect(result.type).toBe("financial");
      expect(result.data).toBeTruthy();
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(result.generatedAt).toBeTruthy();
    });
  });
});


describe("dashboard router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    caller = appRouter.createCaller(makeCtx());
  });

  describe("conversionFunnel", () => {
    it("should return conversion funnel metrics", async () => {
  });
});

  describe("conversionFunnel", () => {
    it("should return conversion funnel metrics with correct structure", async () => {
      const result = await caller.dashboard.conversionFunnel();

      expect(result).toHaveProperty("leads");
      expect(result).toHaveProperty("prospects");
      expect(result).toHaveProperty("customers");
      expect(result).toHaveProperty("conversionRate");
      
      expect(typeof result.leads).toBe("number");
      expect(typeof result.prospects).toBe("number");
      expect(typeof result.customers).toBe("number");
      expect(typeof result.conversionRate).toBe("number");
      
    });

    it("should return valid conversion rate between 0 and 100", async () => {
      const result = await caller.dashboard.conversionFunnel();

      expect(result.conversionRate).toBeGreaterThanOrEqual(0);
      expect(result.conversionRate).toBeLessThanOrEqual(100);
    });
  });
});
