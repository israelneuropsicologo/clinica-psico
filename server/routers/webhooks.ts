import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createApiToken,
  logWebhook,
  getWebhookLogs,
  checkCustomerExists,
} from "../db-webhooks";
import { createPatient, updatePatient, createSession, createTransaction } from "../db";
import { notifyOwner } from "../_core/notification";
import type { InsertPatient, InsertSession, InsertTransaction } from "../../drizzle/schema";

export const webhooksRouter = router({
  /**
   * Gerar novo token de API para Server-to-Server
   */
  generateToken: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await createApiToken(ctx.user.id, input.name, input.description);
      return {
        token: result.token,
        message: "Token criado com sucesso. Guarde-o em local seguro.",
      };
    }),

  /**
   * Listar logs de sincronização
   */
  getLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return getWebhookLogs(ctx.user.id, input.limit);
    }),

  /**
   * Sincronizar novo paciente (webhook POST)
   */
  syncPatient: protectedProcedure
    .input(
      z.object({
        customer_id: z.string(),
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        birth_date: z.string().optional(),
        cpf: z.string().optional(),
        address: z.string().optional(),
        occupation: z.string().optional(),
        main_complaint: z.string().optional(),
        medical_history: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validação cruzada: verificar se customer_id já existe
        const exists = await checkCustomerExists(ctx.user.id, input.customer_id);

        const patientData: InsertPatient = {
          userId: ctx.user.id,
          name: input.name,
          email: input.email,
          phone: input.phone,
          birthDate: input.birth_date,
          cpf: input.cpf,
          address: input.address,
          occupation: input.occupation,
          mainComplaint: input.main_complaint,
          medicalHistory: input.medical_history,
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (exists) {
          await updatePatient(ctx.user.id, ctx.user.id, patientData);
        } else {
          await createPatient(patientData);
        }

        // Log de sucesso
        await logWebhook(
          ctx.user.id,
          "patient",
          input.customer_id,
          input,
          "success"
        );

        await notifyOwner({
          title: "Novo Paciente Sincronizado",
          content: `Paciente ${input.name} foi sincronizado do site principal.`,
        });

        return { success: true, message: "Paciente sincronizado com sucesso" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logWebhook(
          ctx.user.id,
          "patient",
          input.customer_id,
          input,
          "failed",
          errorMessage
        );
        throw error;
      }
    }),

  /**
   * Sincronizar agendamento (webhook POST)
   * Somente cria sessão se payment_status === "approved"
   */
  syncAppointment: protectedProcedure
    .input(
      z.object({
        customer_id: z.string(),
        appointment_date: z.string(), // ISO 8601
        service_type: z.string(),
        duration_minutes: z.number().optional(),
        notes: z.string().optional(),
        payment_status: z.enum(["pending", "approved", "failed"]),
        transaction_id: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar se payment_status é "approved"
        if (input.payment_status !== "approved") {
          throw new Error(
            `Agendamento não pode ser criado com status de pagamento: ${input.payment_status}`
          );
        }

        // Validar se customer_id existe
        const customerExists = await checkCustomerExists(ctx.user.id, input.customer_id);
        if (!customerExists) {
          throw new Error(`Customer ${input.customer_id} não encontrado`);
        }

        // Criar sessão
        const sessionDate = new Date(input.appointment_date);
        const sessionData: InsertSession = {
          userId: ctx.user.id,
          patientId: 0, // Será preenchido após buscar o paciente
          scheduledAt: sessionDate.getTime(),
          status: "confirmed",
          sessionType: "individual",
          modality: "online",
          durationMinutes: input.duration_minutes || 60,
          isPaid: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await createSession(sessionData);

        await logWebhook(
          ctx.user.id,
          "appointment",
          input.customer_id,
          input,
          "success"
        );

        await notifyOwner({
          title: "Novo Agendamento Confirmado",
          content: `Agendamento para ${sessionDate.toLocaleDateString("pt-BR")} foi sincronizado do site principal.`,
        });

        return { success: true, message: "Agendamento sincronizado com sucesso" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logWebhook(
          ctx.user.id,
          "appointment",
          input.customer_id,
          input,
          "failed",
          errorMessage
        );
        throw error;
      }
    }),

  /**
   * Sincronizar pagamento (webhook POST)
   */
  syncPayment: protectedProcedure
    .input(
      z.object({
        transaction_id: z.string(),
        customer_id: z.string(),
        amount: z.number(),
        currency: z.string().default("BRL"),
        payment_status: z.enum(["pending", "approved", "failed", "refunded"]),
        appointment_id: z.string().optional(),
        payment_method: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Registrar transação
        const transactionData: InsertTransaction = {
          userId: ctx.user.id,
          sessionId: 0, // Será preenchido se houver appointment_id
          amount: input.amount.toString(),
          type: "income",
          status: input.payment_status === "approved" ? "paid" : "pending",
          paymentMethod: (input.payment_method as any) || "other",
          category: "session",
          transactionDate: Date.now(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await createTransaction(transactionData);

        await logWebhook(
          ctx.user.id,
          "payment",
          input.transaction_id,
          input,
          "success"
        );

        await notifyOwner({
          title: "Pagamento Recebido",
          content: `Pagamento de R$ ${input.amount.toFixed(2)} foi sincronizado do site principal.`,
        });

        return { success: true, message: "Pagamento sincronizado com sucesso" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logWebhook(
          ctx.user.id,
          "payment",
          input.transaction_id,
          input,
          "failed",
          errorMessage
        );
        throw error;
      }
    }),

  /**
   * Validação cruzada: verificar se customer_id existe
   */
  validateCustomer: protectedProcedure
    .input(z.object({ customer_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const exists = await checkCustomerExists(ctx.user.id, input.customer_id);
      return { exists, customer_id: input.customer_id };
    }),

  /**
   * Status da integração
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const logs = await getWebhookLogs(ctx.user.id, 10);
    const successCount = logs.filter((l) => l.status === "success").length;
    const failureCount = logs.filter((l) => l.status === "failed").length;
    const lastSync = logs.length > 0 ? logs[logs.length - 1].syncedAt : null;

    return {
      lastSync,
      successCount,
      failureCount,
      totalSyncs: logs.length,
      recentLogs: logs,
    };
  }),
});

export type WebhooksRouter = typeof webhooksRouter;
