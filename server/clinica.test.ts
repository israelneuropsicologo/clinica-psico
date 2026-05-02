/**
 * Testes Vitest para os routers principais da plataforma E-Saúde.
 * Cobertura: auth.logout, patients CRUD, sessions CRUD, clinicalNotes, financial.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Mock DB ─────────────────────────────────────────────────────────────────

vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getPatients: vi.fn().mockResolvedValue([
    { id: 1, name: "João da Silva", status: "active", userId: 1 },
  ]),
  getPatientsShared: vi.fn().mockResolvedValue([
    { id: 1, name: "João da Silva", status: "active", userId: 1 },
  ]),
  getPatientByIdShared: vi.fn().mockResolvedValue({ id: 1, name: "João da Silva", userId: 1 }),
  getPatientById: vi.fn().mockResolvedValue({ id: 1, name: "João da Silva", userId: 1 }),
  createPatient: vi.fn().mockResolvedValue(1),
  updatePatient: vi.fn().mockResolvedValue(undefined),
  deletePatient: vi.fn().mockResolvedValue(undefined),
  getPatientCount: vi.fn().mockResolvedValue(5),
  getSessions: vi.fn().mockResolvedValue([
    { id: 1, patientId: 1, scheduledAt: Date.now(), status: "scheduled", userId: 1 },
  ]),
  getSessionById: vi.fn().mockResolvedValue({
    id: 1, patientId: 1, scheduledAt: Date.now(), status: "scheduled", userId: 1,
  }),
  createSession: vi.fn().mockResolvedValue(1),
  updateSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  getSessionsThisMonth: vi.fn().mockResolvedValue(8),
  getUpcomingSessions: vi.fn().mockResolvedValue([]),
  getClinicalNotesBySession: vi.fn().mockResolvedValue([]),
  getClinicalNotesByPatient: vi.fn().mockResolvedValue([]),
  createClinicalNote: vi.fn().mockResolvedValue(1),
  updateClinicalNote: vi.fn().mockResolvedValue(undefined),
  getTransactions: vi.fn().mockResolvedValue([]),
  createTransaction: vi.fn().mockResolvedValue(1),
  updateTransaction: vi.fn().mockResolvedValue(undefined),
  getMonthlyRevenue: vi.fn().mockResolvedValue(3200),
  getOverdueSessions: vi.fn().mockResolvedValue(2),
  getDocumentsByPatient: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(1),
  deletDocument: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Análise clínica gerada pela IA." } }],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna success: true", async () => {
    const ctx = makeCtx();
    const clearedCookies = (ctx as TrpcContext & { _clearedCookies: { name: string; options: Record<string, unknown> }[] })._clearedCookies;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("auth.me retorna null quando não autenticado", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("patients router", () => {
  it("lista pacientes do usuário autenticado", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.patients.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("busca paciente por ID", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.patients.getById({ id: 1 });
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
  });

  it("cria um novo paciente", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.patients.create({
      name: "Maria Oliveira",
      email: "maria@email.com",
      phone: "11999999999",
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("atualiza dados do paciente", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.patients.update({ id: 1, name: "Maria Oliveira Santos" });
    expect(result).toEqual({ success: true });
  });

  it("deleta paciente", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.patients.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });

  it("rejeita acesso sem autenticação", async () => {
    const ctx = makeCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.patients.list({})).rejects.toThrow();
  });
});

describe("sessions router", () => {
  it("lista sessões do usuário", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("cria uma nova sessão e notifica o proprietário", async () => {
    const { notifyOwner } = await import("./_core/notification");
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.create({
      patientId: 1,
      scheduledAt: Date.now() + 86400000,
      durationMinutes: 50,
      status: "scheduled",
      sessionType: "individual",
      modality: "in_person",
    });
    expect(result).toHaveProperty("id");
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Nova sessão agendada" })
    );
  });

  it("cancela sessão e notifica o proprietário", async () => {
    const { notifyOwner } = await import("./_core/notification");
    vi.mocked(notifyOwner).mockClear();
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.update({
      id: 1,
      status: "cancelled",
      cancelReason: "Paciente solicitou cancelamento",
    });
    expect(result).toEqual({ success: true });
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Sessão cancelada" })
    );
  });
});

describe("clinicalNotes router", () => {
  it("cria anotação clínica para uma sessão", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clinicalNotes.create({
      sessionId: 1,
      patientId: 1,
      content: "<p>Paciente relatou melhora significativa esta semana.</p>",
      mood: "good",
      progressRating: 7,
    });
    expect(result).toHaveProperty("id");
  });

  it("analisa anotação com IA e retorna sugestões", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.clinicalNotes.analyzeWithAI({
      noteId: 1,
      content: "Paciente apresentou melhora no humor e redução de ansiedade.",
    });
    expect(result).toHaveProperty("suggestions");
    expect(typeof result.suggestions).toBe("string");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});

describe("dashboard router", () => {
  it("retorna métricas do dashboard", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dashboard.metrics();
    expect(result).toHaveProperty("patientCount");
    expect(result).toHaveProperty("sessionsThisMonth");
    expect(result).toHaveProperty("monthlyRevenue");
    expect(result).toHaveProperty("overdueCount");
    expect(result).toHaveProperty("upcomingSessions");
    expect(result.patientCount).toBe(5);
    expect(result.sessionsThisMonth).toBe(8);
    expect(result.monthlyRevenue).toBe(3200);
  });
});
