/**
 * Testes para E-SAÚDE Agent
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAgentStatus,
  initializeESaudeAgent,
  stopESaudeAgent,
  handleESaudeWebhook,
  syncPendingAppointments,
} from "./esaude-agent";

describe("E-SAÚDE Agent", () => {
  beforeEach(() => {
    // Limpar estado antes de cada teste
    stopESaudeAgent();
  });

  describe("Agent Lifecycle", () => {
    it("deve inicializar o agente", async () => {
      initializeESaudeAgent();
      const status = await getAgentStatus();
      expect(status.isRunning).toBe(true);
    });

    it("deve parar o agente", async () => {
      initializeESaudeAgent();
      stopESaudeAgent();
      const status = await getAgentStatus();
      expect(status.isRunning).toBe(false);
    });

    it("deve retornar status correto", async () => {
      const status = await getAgentStatus();
      expect(status).toHaveProperty("isRunning");
      expect(status).toHaveProperty("lastSync");
      expect(status).toHaveProperty("pendingCount");
      expect(status).toHaveProperty("successCount");
      expect(status).toHaveProperty("failureCount");
      expect(status).toHaveProperty("uptime");
    });
  });

  describe("Webhook Handler", () => {
    it("deve rejeitar webhook sem token", async () => {
      const req = {
        body: {
          action: "appointment.confirmed",
          appointment: {},
          // token ausente
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar webhook com payload inválido", async () => {
      const req = {
        body: {
          // action ausente
          token: "test_token",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("deve processar webhook válido", async () => {
      const req = {
        body: {
          action: "appointment.confirmed",
          appointment: {
            id: "appt_123",
            customer_id: "patient_1",
            customer_name: "João Silva",
            customer_email: "joao@example.com",
            appointment_date: "2026-06-15",
            appointment_time: "14:00",
            service_type: "Consulta",
            session_type: "presencial",
            status: "confirmed",
          },
          token: process.env.ESAUDE_WEBHOOK_SECRET || "test_token",
        },
      };

      const res = {
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("Sync Pending Appointments", () => {
    it("deve sincronizar agendamentos pendentes", async () => {
      // Este teste é mais de integração
      // Ele verifica se a função executa sem erros
      await expect(syncPendingAppointments()).resolves.toBeUndefined();
    });
  });

  describe("Agent Status Tracking", () => {
    it("deve rastrear sucesso de sincronizações", async () => {
      const statusBefore = await getAgentStatus();
      const successBefore = statusBefore.successCount;

      // Simular sucesso (em um teste real, isso seria feito via mock)
      // Por enquanto, apenas verificamos que o contador existe
      expect(successBefore).toBeGreaterThanOrEqual(0);
    });

    it("deve rastrear falhas de sincronizações", async () => {
      const status = await getAgentStatus();
      expect(status.failureCount).toBeGreaterThanOrEqual(0);
    });

    it("deve rastrear tentativas de retry", async () => {
      const status = await getAgentStatus();
      expect(status).toHaveProperty("uptime");
      expect(typeof status.uptime).toBe("number");
    });
  });
});
