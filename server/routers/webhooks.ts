import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createApiToken,
  logWebhook,
  getWebhookLogs,
  checkCustomerExists,
  validateApiToken,
  getPatientByExternalId,
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
   * Público: autenticado por Bearer token + HMAC
   */
  syncPatient: publicProcedure
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
        // Validar token e obter userId
        let userId: number;

        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }
          userId = apiToken.userId;

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
        } else if (ctx.user) {
          // Fallback para usuário autenticado via OAuth
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
          // Validação cruzada: verificar se customer_id já existe
          const exists = await checkCustomerExists(userId, input.customer_id);

          if (exists) {
            // Paciente já existe - não criar duplicata
            return { success: true, message: "Paciente já existe" };
          }

          // Criptografar CPF se fornecido
          const encryptedCPF = input.cpf ? encryptCPF(input.cpf) : undefined;

          const patientData: InsertPatient = {
            userId,
            externalCustomerId: input.customer_id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            birthDate: input.birth_date,
            cpf: encryptedCPF,
            address: input.address,
            occupation: input.occupation,
            mainComplaint: input.main_complaint,
            medicalHistory: input.medical_history,
            status: "active",
            leadSource: "direct_booking",
            leadStatus: "customer",
            interactionCount: 1,
            lastInteractionAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await createPatient(patientData);
          return { success: true };
        });

        // Log de sucesso
        await logWebhook(
          userId,
          "patient",
          input.customer_id,
          input,
          "success"
        );

        // LGPD: Registrar criação de paciente
        logLGPDEvent({
          userId,
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
        let userId = 0;
        try {
          if (input.token) {
            const apiToken = await validateApiToken(input.token);
            if (apiToken) userId = apiToken.userId;
          } else if (ctx.user) {
            userId = ctx.user.id;
          }
        } catch {}

        if (userId > 0) {
          await logWebhook(
            userId,
            "patient",
            input.customer_id,
            input,
            "failed",
            errorMessage
          );

          // LGPD: Registrar falha na sincronização
          logLGPDEvent({
            userId,
            eventType: LGPDEventType.WEBHOOK_SYNC_PATIENT,
            resourceType: "patient",
            resourceId: input.customer_id,
            action: "CREATE",
            dataClassification: "RESTRICTED",
            description: `Falha ao sincronizar paciente: ${errorMessage}`,
            status: "FAILED",
            errorMessage,
          });
        }

        throw error;
      }
    }),

  /**
   * Sincronizar agendamento (webhook POST)
   * Somente cria sessão se payment_status === "approved"
   * Com rate limiting, HMAC validation e retry automático
   */
  syncAppointment: publicProcedure
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
        // Validar token e obter userId
        let userId: number;

        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }
          userId = apiToken.userId;

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
            const isValid = verifyWebhookSignature(payload, signature, apiToken.token);
            if (!isValid) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Assinatura HMAC inválida",
              });
            }
          }
        } else if (ctx.user) {
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        // Validação de payment_status ANTES do retry
        if (input.payment_status !== "approved") {
          return {
            success: false,
            message: `Agendamento não confirmado. Status de pagamento: ${input.payment_status}`,
          };
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
          // Validar se customer_id existe
          const customerExists = await checkCustomerExists(userId, input.customer_id);
          if (!customerExists) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Cliente ${input.customer_id} não encontrado`,
            });
          }

          const sessionData: InsertSession = {
            userId,
            patientId: 0, // Será preenchido depois
            scheduledAt: new Date(input.appointment_date).getTime(),
            durationMinutes: input.duration_minutes || 50,
            status: "confirmed",
            sessionType: "individual",
            modality: "in_person",
            notes: input.notes,
            isPaid: "paid",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await createSession(sessionData);
          return { success: true };
        });

        // Log de sucesso
        await logWebhook(
          userId,
          "appointment",
          input.customer_id,
          input,
          "success"
        );

        return { success: true, message: "Agendamento sincronizado com sucesso" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userId = 0;
        try {
          if (input.token) {
            const apiToken = await validateApiToken(input.token);
            if (apiToken) userId = apiToken.userId;
          } else if (ctx.user) {
            userId = ctx.user.id;
          }
        } catch {}

        if (userId > 0) {
          await logWebhook(
            userId,
            "appointment",
            input.customer_id,
            input,
            "failed",
            errorMessage
          );
        }

        throw error;
      }
    }),

  /**
   * Sincronizar pagamento (webhook POST)
   */
  syncPayment: publicProcedure
    .input(
      z.object({
        transaction_id: z.string(),
        customer_id: z.string(),
        amount: z.number(),
        currency: z.string().default("BRL"),
        payment_status: z.enum(["pending", "approved", "failed"]),
        payment_method: z.string().optional(),
        signature: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Validar token e obter userId
        let userId: number;

        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }
          userId = apiToken.userId;

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
            const isValid = verifyWebhookSignature(payload, signature, apiToken.token);
            if (!isValid) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Assinatura HMAC inválida",
              });
            }
          }
        } else if (ctx.user) {
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
          const transactionData: InsertTransaction = {
            userId,
            patientId: 0, // Será preenchido depois
            type: "income",
            amount: input.amount.toString(),
            description: `Pagamento ${input.payment_status} - ${input.transaction_id}`,
            paymentMethod: (input.payment_method as any) || "other",
            status: input.payment_status === "approved" ? "paid" : "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await createTransaction(transactionData);
          return { success: true };
        });

        // Log de sucesso
        await logWebhook(
          userId,
          "payment",
          input.transaction_id,
          input,
          "success"
        );

        return { success: true, message: "Pagamento sincronizado com sucesso" };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let userId = 0;
        try {
          if (input.token) {
            const apiToken = await validateApiToken(input.token);
            if (apiToken) userId = apiToken.userId;
          } else if (ctx.user) {
            userId = ctx.user.id;
          }
        } catch {}

        if (userId > 0) {
          await logWebhook(
            userId,
            "payment",
            input.transaction_id,
            input,
            "failed",
            errorMessage
          );
        }

        throw error;
      }
    }),

  /**
   * Validar se customer_id existe no sistema
   */
  validateCustomer: publicProcedure
    .input(
      z.object({
        customer_id: z.string(),
        token: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        let userId: number;

        if (input.token) {
          const apiToken = await validateApiToken(input.token);
          if (!apiToken) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Token inválido ou expirado",
            });
          }
          userId = apiToken.userId;
        } else if (ctx.user) {
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        const exists = await checkCustomerExists(userId, input.customer_id);
        return { exists };
      } catch (error) {
        throw error;
      }
    }),

  /**

  /**
   * Sincronizar lead do ChatBot
   */
  syncChatbotLead: publicProcedure
    .input(
      z.object({
        token: z.string().optional(),
        customer_id: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        message: z.string(),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let userId: number | null = null;

      // Autenticação por Bearer token ou OAuth
      if (input.token) {
        const apiToken = await validateApiToken(input.token);
        if (!apiToken) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token inválido ou expirado",
          });
        }
        userId = apiToken.userId;
      } else if (ctx.user) {
        userId = ctx.user.id;
      } else {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token ou autenticação OAuth requerida",
        });
      }

      // Verificar se o cliente já existe
      const existingPatient = await getPatientByExternalId(userId, input.customer_id);

      let patientId: number;
      let isNew = false;

      if (existingPatient) {
        // Atualizar paciente existente
        patientId = existingPatient.id;
        await updatePatient(patientId, userId, {
          interactionCount: (existingPatient.interactionCount || 0) + 1,
          lastInteractionAt: new Date(),
          leadStatus: "prospect",
        });
      } else {
        // Criar novo paciente como lead do ChatBot
        isNew = true;
        patientId = await createPatient({
          userId,
          externalCustomerId: input.customer_id,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          mainComplaint: input.message,
          status: "active",
          leadSource: "chatbot",
          leadStatus: "lead",
          interactionCount: 1,
          lastInteractionAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Log LGPD
      if (isNew) {
        logLGPDEvent({
          userId,
          eventType: LGPDEventType.PATIENT_CREATED,
          resourceType: "patient",
          resourceId: patientId,
          action: "CREATE",
          dataClassification: "CONFIDENTIAL",
          description: `Lead do ChatBot: ${input.name} (${input.customer_id})`,
          status: "SUCCESS",
        });
      }

      // Log de webhook
      await logWebhook(userId, "chatbot_lead", "success", {
        customer_id: input.customer_id,
        patient_id: patientId,
      }).catch(() => {});

      return {
        success: true,
        patientId,
        message: existingPatient ? "Lead atualizado com sucesso" : "Lead criado com sucesso",
      };
    }),

  /**
   * Obter status da integracao
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const logs = await getWebhookLogs(ctx.user.id, 10);
    const rateLimitStatus = getRateLimitStatus("default");

    return {
      lastSync: logs[0]?.syncedAt || null,
      totalSyncs: logs.length,
      successCount: logs.filter((l) => l.status === "success").length,
      failureCount: logs.filter((l) => l.status === "failed").length,
      rateLimitStatus,
    };
  }),
});
