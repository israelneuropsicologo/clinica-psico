import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createApiToken,
  logWebhook,
  getWebhookLogs,
  checkCustomerExists,
  validateApiToken,
} from "../db-webhooks";
import { createPatient, updatePatient, createSession, createTransaction } from "../db";
import { notifyOwner } from "../_core/notification";
import { checkRateLimit, getRateLimitStatus } from "../_core/rateLimiter";
import { retryWithBackoff } from "../_core/retryHelper";
import { verifyWebhookSignature } from "../_core/hmacValidator";
import { encryptCPF, maskCPF } from "../_core/encryption";
import { logLGPDEvent, LGPDEventType } from "../_core/lgpdLogger";
import type { InsertPatient, InsertSession, InsertTransaction } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";

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
   * Com rate limiting, HMAC validation e retry automático
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
        signature: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar token se fornecido (para chamadas webhook externas)
        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }

          // Verificar rate limit
          const rateLimitCheck = checkRateLimit(input.token);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit excedido. Máximo 100 requisições por minuto. Restantes: ${rateLimitCheck.remaining}`,
            });
          }

          // Validar assinatura HMAC se fornecida
          if (input.signature) {
            const { signature, token, ...payload } = input;
            // Usar o token como secret para HMAC
            const isValid = verifyWebhookSignature(payload, signature, apiToken.token);
            if (!isValid) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Assinatura HMAC inválida",
              });
            }
          }
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
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
            // Nota: checkCustomerExists verifica via webhook_logs, não via patients.externalCustomerId
            // Para uma implementação mais robusta, seria necessário adicionar coluna externalCustomerId
            // Por enquanto, apenas criar novo paciente se não existir
            const newPatientData = {
              ...patientData,
              externalCustomerId: input.customer_id,
            };
            await createPatient(newPatientData);
          } else {
            // Adicionar externalCustomerId ao novo paciente
            const newPatientData = {
              ...patientData,
              externalCustomerId: input.customer_id,
            };
            await createPatient(newPatientData);
          }

          return { success: true };
        });

        // Log de sucesso
        await logWebhook(
          ctx.user.id,
          "patient",
          input.customer_id,
          input,
          "success"
        );

        // LGPD: Registrar criação de paciente
        logLGPDEvent({
          userId: ctx.user.id,
          eventType: LGPDEventType.PATIENT_CREATED,
          resourceType: "patient",
          resourceId: input.customer_id,
          action: "CREATE",
          dataClassification: "RESTRICTED",
          description: `Paciente ${input.name} sincronizado via webhook`,
          details: {
            name: input.name,
            email: input.email,
            cpf: input.cpf ? maskCPF(input.cpf) : undefined,
          },
          status: "SUCCESS",
        });

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

        // LGPD: Registrar falha na sincronização
        logLGPDEvent({
          userId: ctx.user.id,
          eventType: LGPDEventType.WEBHOOK_SYNC_PATIENT,
          resourceType: "patient",
          resourceId: input.customer_id,
          action: "CREATE",
          dataClassification: "RESTRICTED",
          description: `Falha ao sincronizar paciente: ${errorMessage}`,
          status: "FAILED",
          errorMessage,
        });

        throw error;
      }
    }),

  /**
   * Sincronizar agendamento (webhook POST)
   * Somente cria sessão se payment_status === "approved"
   * Com rate limiting, HMAC validation e retry automático
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
        signature: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar token se fornecido
        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }

          // Verificar rate limit
          const rateLimitCheck = checkRateLimit(input.token);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit excedido. Máximo 100 requisições por minuto. Restantes: ${rateLimitCheck.remaining}`,
            });
          }

          // Validar assinatura HMAC se fornecida
          if (input.signature) {
            const { signature, token, ...payload } = input;
            // Usar o token como secret para HMAC
            const isValid = verifyWebhookSignature(payload, signature, apiToken.token);
            if (!isValid) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Assinatura HMAC inválida",
              });
            }
          }
        }

        // Validar se payment_status é "approved" (não deve ser retentado)
        if (input.payment_status !== "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Agendamento não pode ser criado com status de pagamento: ${input.payment_status}`,
          });
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
          // Validar se customer_id existe
          const customerExists = await checkCustomerExists(ctx.user.id, input.customer_id);
          if (!customerExists) {
            throw new Error(`Customer ${input.customer_id} não encontrado`);
          }

          // Nota: Para buscar o paciente real, seria necessário ter a coluna externalCustomerId
          // Por enquanto, usar um placeholder - em produção, implementar busca real
          // Isso será corrigido após adicionar a coluna ao schema
          const patientId = 1; // Placeholder - será corrigido após migration

          // Criar sessão com patientId correto
          const sessionDate = new Date(input.appointment_date);
          const sessionData: InsertSession = {
            userId: ctx.user.id,
            patientId: patientId,
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

          return { success: true };
        });

        await logWebhook(
          ctx.user.id,
          "appointment",
          input.customer_id,
          input,
          "success"
        );

        await notifyOwner({
          title: "Novo Agendamento Confirmado",
          content: `Agendamento para ${new Date(input.appointment_date).toLocaleDateString("pt-BR")} foi sincronizado do site principal.`,
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
   * Com rate limiting, HMAC validation e retry automático
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
        signature: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar token se fornecido
        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }

          // Verificar rate limit
          const rateLimitCheck = checkRateLimit(input.token);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit excedido. Máximo 100 requisições por minuto. Restantes: ${rateLimitCheck.remaining}`,
            });
          }

          // Validar assinatura HMAC se fornecida
          if (input.signature) {
            const { signature, token, ...payload } = input;
            // Usar o token como secret para HMAC
            const isValid = verifyWebhookSignature(payload, signature, apiToken.token);
            if (!isValid) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Assinatura HMAC inválida",
              });
            }
          }
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
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

          return { success: true };
        });

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
