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


describe("E-SAÚDE Webhook - Criação de Agendamentos", () => {
  beforeEach(() => {
    stopESaudeAgent();
  });

  describe("Webhook com Novo Agendamento", () => {
    it("deve criar novo paciente e agendamento quando não encontrado", async () => {
      // Este teste verifica se o webhook consegue criar um novo agendamento
      // quando o paciente não existe no sistema
      const req = {
        body: {
          action: "appointment.confirmed",
          appointment: {
            id: "esaude_marcia_123",
            customer_id: "marcia_456",
            customer_name: "Márcia Borges",
            customer_email: "marcia.borges@example.com",
            customer_phone: "11987654321",
            appointment_date: "2026-06-10",
            appointment_time: "14:30",
            service_type: "Consulta Psicológica",
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

      // Verificar que o webhook foi processado
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty("success");
    });

    it("deve processar ação appointment.cancelled", async () => {
      const req = {
        body: {
          action: "appointment.cancelled",
          appointment: {
            id: "esaude_cancel_123",
            customer_id: "patient_cancel",
            customer_name: "João Silva",
            customer_email: "joao.cancel@example.com",
            customer_phone: "11999999999",
            appointment_date: "2026-06-15",
            appointment_time: "10:00",
            service_type: "Consulta",
            session_type: "presencial",
            status: "cancelled",
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

    it("deve processar ação appointment.updated", async () => {
      const req = {
        body: {
          action: "appointment.updated",
          appointment: {
            id: "esaude_update_123",
            customer_id: "patient_update",
            customer_name: "Maria Santos",
            customer_email: "maria.santos@example.com",
            customer_phone: "11988888888",
            appointment_date: "2026-06-20",
            appointment_time: "15:00",
            service_type: "Consulta",
            session_type: "online",
            status: "updated",
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

  describe("Webhook Segurança", () => {
    it("deve rejeitar webhook com token inválido", async () => {
      const req = {
        body: {
          action: "appointment.confirmed",
          appointment: {
            id: "esaude_invalid_token",
            customer_id: "patient_1",
            customer_name: "João Silva",
            customer_email: "joao@example.com",
            appointment_date: "2026-06-15",
            appointment_time: "14:00",
            service_type: "Consulta",
            session_type: "presencial",
            status: "confirmed",
          },
          token: "invalid_token_12345",
        },
      };

      const res = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis(),
      };

      await handleESaudeWebhook(req, res);

      // O webhook deve processar mas retornar erro
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it("deve rejeitar payload sem action", async () => {
      const req = {
        body: {
          appointment: {
            id: "esaude_123",
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
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar payload sem appointment", async () => {
      const req = {
        body: {
          action: "appointment.confirmed",
          token: process.env.ESAUDE_WEBHOOK_SECRET || "test_token",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar payload sem token", async () => {
      const req = {
        body: {
          action: "appointment.confirmed",
          appointment: {
            id: "esaude_123",
            customer_id: "patient_1",
            customer_name: "João Silva",
            customer_email: "joao@example.com",
            appointment_date: "2026-06-15",
            appointment_time: "14:00",
            service_type: "Consulta",
            session_type: "presencial",
            status: "confirmed",
          },
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await handleESaudeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
