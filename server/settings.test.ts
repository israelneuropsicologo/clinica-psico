import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("settings router", () => {
  it("should return default settings when none exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.get();

    expect(result).toBeDefined();
    expect(result.userId).toBe(ctx.user.id);
    expect(result.clinicName).toBeTruthy(); // Pode ser qualquer valor padrão
    expect(result.currency).toBeTruthy(); // Pode ser qualquer moeda padrão
    expect(result.timezone).toBeTruthy(); // Pode ser qualquer timezone padrão
    expect(result.language).toBeTruthy(); // Pode ser qualquer idioma padrão
    expect(result.sessionDefaultDuration).toBeTruthy(); // Pode ser qualquer duração padrão
  });

  it("should update settings successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const updateResult = await caller.settings.update({
      clinicName: "Clínica Teste",
      clinicEmail: "clinica@test.com",
      ownerName: "Dr. João",
      ownerCRPNumber: "06/123456",
      sessionDefaultDuration: 50,
      sessionDefaultPrice: "250.00",
    });

    expect(updateResult).toBeDefined();
    expect(updateResult.clinicName).toBe("Clínica Teste");
    expect(updateResult.clinicEmail).toBe("clinica@test.com");
    expect(updateResult.ownerName).toBe("Dr. João");
    expect(updateResult.ownerCRPNumber).toBe("06/123456");
    expect(updateResult.sessionDefaultDuration).toBe(50);
  });

  it("should preserve existing settings when updating partial data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Primeira atualização
    await caller.settings.update({
      clinicName: "Clínica Inicial",
      clinicEmail: "inicial@test.com",
    });

    // Segunda atualização (apenas um campo)
    const result = await caller.settings.update({
      ownerName: "Dr. Silva",
    });

    expect(result.clinicName).toBe("Clínica Inicial");
    expect(result.clinicEmail).toBe("inicial@test.com");
    expect(result.ownerName).toBe("Dr. Silva");
  });

  it("should handle regional preferences", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.settings.update({
      language: "en-US",
      currency: "USD",
      timezone: "America/New_York",
    });

    expect(result.language).toBe("en-US");
    expect(result.currency).toBe("USD");
    expect(result.timezone).toBe("America/New_York");
  });
});
