// @ts-nocheck
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
import { createPatient, updatePatient, createSession, createTransaction, getDb, checkDuplicateSession } from "../db";
import { sessions, patients } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { checkRateLimit, getRateLimitStatus } from "../_core/rateLimiter";
import { retryWithBackoff } from "../_core/retryHelper";
import { verifyWebhookSignature } from "../_core/hmacValidator";
import { encryptCPF, maskCPF } from "../_core/encryption";
import { logLGPDEvent, LGPDEventType } from "../_core/lgpdLogger";
import { normalizeIsPaid } from "../_core/dataSanitizer";
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
            return { success: true, message: "Paciente já existe. Não foi criada duplicata." };
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
          return { success: true, message: "Paciente sincronizado com sucesso" };
        });

        // Log de sucesso
        await logWebhook(
          userId,
          "patient",
          input.customer_id,
          input,
          "success"
        );

        // LGPD e notificação apenas se foi criado novo paciente
        if (!result.message?.includes("já existe")) {
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
        }

        return result;
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

        // Permitir agendamentos com qualquer status de pagamento
        // O status será refletido no campo isPaid da sessão
        const isPaidStatus = input.payment_status === "approved" ? "paid" : "pending";

        // Executar com retry automático
        const result = await retryWithBackoff(async () => {
          // Validar se customer_id existe e obter paciente
          const patient = await getPatientByExternalId(userId, input.customer_id);
          if (!patient) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Cliente ${input.customer_id} não encontrado`,
            });
          }

          const sessionData: InsertSession = {
            userId,
            patientId: patient.id, // Usar ID real do paciente
            scheduledAt: new Date(input.appointment_date).getTime(),
            durationMinutes: input.duration_minutes || 50,
            status: "scheduled", // ✅ Usar "scheduled" para aparecer no painel de agendamentos diretos
            sessionType: "individual",
            modality: "in_person",
            notes: input.notes,
            isPaid: isPaidStatus,
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
          // Validar se customer_id existe e obter paciente
          const patient = await getPatientByExternalId(userId, input.customer_id);
          if (!patient) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Cliente ${input.customer_id} não encontrado`,
            });
          }

          const transactionData: InsertTransaction = {
            userId,
            patientId: patient.id, // Usar ID real do paciente
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
   * Sincronizar agendamento do ChatBot (webhook POST)
   * Cria automaticamente uma sessão quando o cliente agenda via ChatBot
   */
  syncChatbotAppointment: publicProcedure
    .input(
      z.object({
        customer_id: z.string(),
        customer_name: z.string(),
        customer_email: z.string().email(),
        customer_phone: z.string().optional(),
        appointment_date: z.string(), // ISO 8601 format
        appointment_time: z.string(), // HH:mm format
        service_type: z.string().default("consultation"),
        notes: z.string().optional(),
        session_type: z.enum(["presencial", "online"]).default("presencial"),
        token: z.string().optional(),
        signature: z.string().optional(),
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
        } else if (ctx.user) {
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        // Verificar rate limit
        const rateLimitKey = `chatbot-appointment-${userId}`;
        if (!checkRateLimit(rateLimitKey, 100, 60)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Limite de requisições excedido",
          });
        }

        // Buscar ou criar paciente
        let patientId: number;
        const existingPatient = await getPatientByExternalId(userId, input.customer_id);

        if (existingPatient) {
          patientId = existingPatient.id;
          // Atualizar status para customer se era apenas lead
          if (existingPatient.leadStatus === "lead") {
            await updatePatient(patientId, userId, {
              leadStatus: "customer",
              interactionCount: (existingPatient.interactionCount || 0) + 1,
              lastInteractionAt: new Date(),
            });
          }
        } else {
          // Criar novo paciente como customer (agendamento confirmado)
          patientId = await createPatient({
            userId,
            externalCustomerId: input.customer_id,
            name: input.customer_name,
            email: input.customer_email,
            phone: input.customer_phone || null,
            status: "active",
            leadSource: "chatbot",
            leadStatus: "customer",
            interactionCount: 1,
            lastInteractionAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // Parsear data e hora
        const appointmentDateTime = new Date(`${input.appointment_date}T${input.appointment_time}`);
        if (isNaN(appointmentDateTime.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Data ou hora inválida",
          });
        }

        // Mapear session_type para modality
        const modality = input.session_type === "online" ? "online" : "in_person";

        // Criar sessão
        const sessionData: InsertSession = {
          userId,
          patientId,
          scheduledAt: appointmentDateTime.getTime(), // Converter para timestamp em ms
          status: "scheduled", // ✅ Usar "scheduled" para aparecer no painel de agendamentos diretos
          sessionType: "individual",
          modality: modality as "in_person" | "online",
          notes: input.notes || `Agendamento via ChatBot - ${input.service_type}`,
          isPaid: normalizeIsPaid("pending"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const sessionId = await createSession(sessionData);

        // Log LGPD
        logLGPDEvent({
          userId,
          eventType: LGPDEventType.PATIENT_CREATED,
          resourceType: "session",
          resourceId: sessionId,
          action: "CREATE",
          dataClassification: "CONFIDENTIAL",
          description: `Agendamento via ChatBot: ${input.customer_name} em ${input.appointment_date} às ${input.appointment_time}`,
          status: "SUCCESS",
        });

        // Notificar proprietário
        await notifyOwner({
          title: "Nova Consulta Agendada via ChatBot",
          content: `${input.customer_name} agendou uma consulta para ${input.appointment_date} às ${input.appointment_time} (${input.session_type})`,
        });

        // Sincronizar com E-SAÚDE
        try {
          await syncSiteToESaude({
            sessionId,
            patientId,
            userId,
            patientName: input.customer_name,
            patientEmail: input.customer_email,
            patientPhone: input.customer_phone || "",
            appointmentDate: input.appointment_date,
            appointmentTime: input.appointment_time,
            modality,
            source: "chatbot",
          });
        } catch (esaudeError) {
          console.error("Erro ao sincronizar com E-SAÚDE:", esaudeError);
          await notifyOwner({
            title: "⚠️ Erro ao Sincronizar com E-SAÚDE",
            content: `Agendamento de ${input.customer_name} foi criado localmente, mas houve erro ao sincronizar com E-SAÚDE.`,
          });
        }

        // Log de webhook
        await logWebhook(userId, "chatbot_appointment", input.customer_id, input, "success");

        return {
          success: true,
          sessionId,
          patientId,
          message: "Agendamento sincronizado com sucesso",
        };
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
            "chatbot_appointment",
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
   * DEBUG: Validar formato dos dados do chatbot
   */
  debugChatbotAppointment: publicProcedure
    .input(
      z.object({
        customer_id: z.string(),
        customer_name: z.string(),
        customer_email: z.string(),
        customer_phone: z.string().optional(),
        appointment_date: z.string(),
        appointment_time: z.string(),
        service_type: z.string().optional(),
        notes: z.string().optional(),
        session_type: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const errors: string[] = [];

      // Validar cada campo
      if (!input.customer_id) errors.push("customer_id: obrigatório");
      if (!input.customer_name) errors.push("customer_name: obrigatório");
      if (!input.customer_email) errors.push("customer_email: obrigatório");
      if (!input.appointment_date) errors.push("appointment_date: obrigatório");
      if (!input.appointment_time) errors.push("appointment_time: obrigatório");

      // Validar email
      if (input.customer_email && !input.customer_email.includes("@")) {
        errors.push("customer_email: deve ser um email válido (conter @)");
      }

      // Validar data (YYYY-MM-DD)
      if (input.appointment_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.appointment_date)) {
        errors.push("appointment_date: deve estar no formato YYYY-MM-DD (ex: 2026-06-10)");
      }

      // Validar hora (HH:mm)
      if (input.appointment_time && !/^\d{2}:\d{2}$/.test(input.appointment_time)) {
        errors.push("appointment_time: deve estar no formato HH:mm (ex: 14:00)");
      }

      // Validar session_type
      if (input.session_type && !["presencial", "online"].includes(input.session_type)) {
        errors.push("session_type: deve ser 'presencial' ou 'online'");
      }

      return {
        success: errors.length === 0,
        errors,
        received_data: input,
        message: errors.length === 0 ? "✅ Dados válidos! Pode enviar para syncChatbotAppointment" : "❌ Erros encontrados",
      };
    }),

  /**
   * Criar lead do chatbot (webhook)
   */
  createChatbotLead: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

          const rateLimitCheck = checkRateLimit(input.token);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit excedido. Máximo 100 requisições por minuto.`,
            });
          }
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token requerido",
          });
        }

        // Verificar se paciente já existe
        const existingPatient = await checkCustomerExists(userId, input.email);
        if (existingPatient) {
          await logWebhook(userId, "chatbot_lead", input.email, input, "success", "Lead já existente");
          return {
            success: true,
            patientId: existingPatient.id,
            isNew: false,
            message: "Paciente já existe no sistema",
          };
        }

        // Criar novo lead
        const patientData: InsertPatient = {
          userId,
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          leadSource: "chatbot",
          leadStatus: "lead",
          status: "active",
          interactionCount: 1,
          lastInteractionAt: new Date(),
        };

        const patient = await createPatient(patientData);
        await logWebhook(userId, "chatbot_lead", input.email, input, "success", "Lead criado com sucesso");

        return {
          success: true,
          patientId: patient.id,
          isNew: true,
          message: "Lead criado com sucesso",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw error;
      }
    }),

  /**
   * Criar agendamento direto do site (webhook)
   * Cria paciente com leadSource="direct_booking" e sessão com status="scheduled"
   * Recebe dados do site psicologo.manus.space
   */
  createDirectBooking: publicProcedure
    .input(
      z.object({
        token: z.string().optional(),
        customer_id: z.string(),
        customer_name: z.string(),
        customer_email: z.string().email(),
        customer_phone: z.string().optional(),
        appointment_date: z.string(), // YYYY-MM-DD
        appointment_time: z.string(), // HH:mm
        sessionValue: z.number().optional(),
        service_type: z.string().default("consultation"),
        notes: z.string().optional(),
        session_type: z.enum(["presencial", "online"]).default("presencial"),
        signature: z.string().optional(),
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

          const rateLimitCheck = checkRateLimit(input.token);
          if (!rateLimitCheck.allowed) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limit excedido. Máximo 100 requisições por minuto.`,
            });
          }
        } else if (ctx.user) {
          userId = ctx.user.id;
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token ou autenticação OAuth requerida",
          });
        }

        // ✅ FIX 1: Usar getPatientByExternalId em vez de checkCustomerExists
        // checkCustomerExists retorna boolean, getPatientByExternalId retorna objeto
        let existingPatient = await getPatientByExternalId(userId, input.customer_id);
        let patientId: number;
        
        if (!existingPatient) {
          // Criar novo paciente com leadSource="direct_booking"
          const patientData: InsertPatient = {
            userId,
            externalCustomerId: input.customer_id,
            name: input.customer_name,
            email: input.customer_email,
            phone: input.customer_phone || null,
            leadSource: "direct_booking",
            leadStatus: "customer",
            status: "active",
            interactionCount: 1,
            lastInteractionAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          patientId = await createPatient(patientData);
        } else {
          // ✅ FIX 2: Passar userId como segundo argumento para updatePatient
          // Assinatura correta: updatePatient(id, userId, data)
          patientId = existingPatient.id;
          if (existingPatient.leadStatus === "lead") {
            await updatePatient(patientId, userId, {
              leadStatus: "customer",
              interactionCount: (existingPatient.interactionCount || 0) + 1,
              lastInteractionAt: new Date(),
            });
          }
        }

        // Parsear data e hora
        const appointmentDateTime = new Date(`${input.appointment_date}T${input.appointment_time}`);
        if (isNaN(appointmentDateTime.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Data ou hora inválida",
          });
        }

        // Mapear session_type para modality
        const modality = input.session_type === "online" ? "online" : "in_person";

        // ✅ FIX 3: Gerar externalBookingId único para evitar duplicatas
        const externalBookingId = `${input.customer_id}_${input.appointment_date}_${input.appointment_time}`;
        
        // Verificar se já existe sessão com este externalBookingId
        const db = await getDb();
        const existingSessionList = await db
          .select()
          .from(sessions)
          .where(
            and(
              eq(sessions.userId, userId),
              eq(sessions.externalBookingId, externalBookingId)
            )
          )
          .limit(1);

        const existingSession = existingSessionList?.[0];
        if (existingSession) {
          // Sessão já existe - retornar sucesso
          return {
            success: true,
            sessionId: existingSession.id,
            patientId,
            message: "Agendamento já existe",
          };
        }

        // ✅ FIX 4: Usar status="scheduled" (não "pending")
        // O schema não permite status="pending" em sessions
        // getDirectBookings filtra por status="scheduled"
        const sessionData: InsertSession = {
          userId,
          patientId,
          externalBookingId,
          scheduledAt: appointmentDateTime.getTime(),
          status: "scheduled", // ✅ Correto: "scheduled" em vez de "pending"
          sessionType: "individual",
          modality: modality as "in_person" | "online",
          notes: input.notes || `Agendamento direto do site - ${input.service_type}`,
          sessionValue: input.sessionValue ? parseFloat(String(input.sessionValue)) : null,
          isPaid: normalizeIsPaid("pending"),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const sessionId = await createSession(sessionData);

        // Log LGPD
        logLGPDEvent({
          userId,
          eventType: LGPDEventType.PATIENT_CREATED,
          resourceType: "session",
          resourceId: String(sessionId),
          action: "CREATE",
          dataClassification: "CONFIDENTIAL",
          description: `Agendamento direto do site: ${input.customer_name} em ${input.appointment_date} às ${input.appointment_time}`,
          status: "SUCCESS",
        });

        // Notificar proprietário
        await notifyOwner({
          title: "Novo Agendamento Direto do Site",
          content: `${input.customer_name} agendou uma consulta para ${input.appointment_date} às ${input.appointment_time} (${input.session_type})`,
        });

        // Log de webhook
        await logWebhook(userId, "direct_booking", input.customer_id, input, "success");

        // ✅ FIX 4: Retornar patientId (não patient.id)
        return {
          success: true,
          sessionId,
          patientId,
          message: "Agendamento sincronizado com sucesso",
        }; 
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
            "direct_booking",
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
   * Listar leads do chatbot
   */
  getLeads: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      const leads = await db
        .select()
        .from(patients)
        .where(and(eq(patients.leadSource, "chatbot")))
        .limit(input.limit);

      return leads;
    }),

  /**
   * Listar agendamentos diretos do site
   * Retorna sessões com status="scheduled" que foram criadas por agendamentos diretos
   */
  getDirectBookings: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível" });

      // ✅ FIX: Filtrar por status="scheduled" (não "pending")
      // O schema não permite status="pending" em sessions
      const bookings = await db
        .select({
          id: sessions.id,
          patientId: sessions.patientId,
          scheduledAt: sessions.scheduledAt,
          status: sessions.status,
          sessionValue: sessions.sessionValue,
          isPaid: sessions.isPaid,
          patient: {
            id: patients.id,
            name: patients.name,
            email: patients.email,
            phone: patients.phone,
          },
        })
        .from(sessions)
        .innerJoin(patients, eq(sessions.patientId, patients.id))
        .where(
          and(
            eq(sessions.userId, ctx.user.id),
            eq(patients.leadSource, "direct_booking"),
            eq(sessions.status, "scheduled") // ✅ Correto: "scheduled" em vez de "pending"
          )
        )
        .limit(input.limit);

      return bookings;
    }),



  /**
   * Receber agendamento confirmado por Amanda
   */
  appointmentFromAmanda: publicProcedure
    .input(
      z.object({
        customer_name: z.string(),
        customer_email: z.string(),
        customer_phone: z.string().optional(),
        appointment_date: z.string(),
        appointment_time: z.string(),
        session_type: z.enum(["virtual", "presencial"]),
        service_type: z.string(),
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isValid = await validateApiToken(input.token);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        const patientId = await createPatient({
          name: input.customer_name,
          email: input.customer_email,
          phone: input.customer_phone,
          leadSource: "website",
        });

        const scheduledAt = new Date(`${input.appointment_date}T${input.appointment_time}`);
        const sessionId = await createSession({
          userId: 1,
          patientId,
          scheduledAt,
          durationMinutes: 50,
          status: "scheduled",
          sessionType: "individual",
          modality: input.session_type === "virtual" ? "online" : "in_person",
          notes: `Agendamento confirmado por Amanda\nServico: ${input.service_type}`,
          isPaid: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await logLGPDEvent({
          eventType: "PATIENT_CREATED" as LGPDEventType,
          patientId,
          action: "CREATE",
          status: "SUCCESS",
          description: `Paciente criado via agendamento Amanda: ${input.customer_name}`,
        });

        await notifyOwner({
          title: "Novo Agendamento de Amanda",
          content: `${input.customer_name} agendou uma ${input.service_type} para ${input.appointment_date} as ${input.appointment_time}`,
        });

        return {
          success: true,
          patientId,
          sessionId,
          message: "Agendamento criado com sucesso",
        };
      } catch (error: any) {
        console.error("[Amanda Appointment] Erro:", error);
        throw error;
      }
    }),

  /**
   * Forçar sincronização de todos os agendamentos pendentes
   */
  forceSyncPending: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      const pendingAppointments = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.userId, ctx.user.id),
            eq(sessions.status, "scheduled")
          )
        );

      let syncedCount = 0;
      for (const appointment of pendingAppointments) {
        try {
          const patient = await db
            .select()
            .from(patients)
            .where(eq(patients.id, appointment.patientId))
            .limit(1);

          if (patient.length > 0 && patient[0].phone) {
            await db
              .update(sessions)
              .set({ notes: `Sincronizado - ${new Date().toISOString()}` })
              .where(eq(sessions.id, appointment.id));
            syncedCount++;
          }
        } catch (e) {
          console.error(`Erro ao sincronizar ${appointment.id}:`, e);
        }
      }

      return {
        success: true,
        totalPending: pendingAppointments.length,
        syncedCount,
        message: `${syncedCount} de ${pendingAppointments.length} sincronizados`,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao sincronizar",
      });
    }
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
