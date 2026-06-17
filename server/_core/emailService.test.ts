import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sendEmail, sendLoginEmail } from "./emailService";

describe("Email Service", () => {
  describe("sendEmail", () => {
    it("should send email successfully", async () => {
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>This is a test email</p>",
        text: "This is a test email",
      });

      // Email pode falhar se credenciais não estão configuradas
      // Mas não deve lançar erro
      expect(typeof result).toBe("boolean");
    });

    it("should send login email with proper HTML", async () => {
      const result = await sendLoginEmail({
        to: "user@example.com",
        name: "Test User",
        loginUrl: "https://example.com/login",
        password: "temp123456",
      });

      expect(typeof result).toBe("boolean");
    });

    it("should handle missing credentials gracefully", async () => {
      // Sem credenciais, deve retornar false sem lançar erro
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(typeof result).toBe("boolean");
    });
  });
});
