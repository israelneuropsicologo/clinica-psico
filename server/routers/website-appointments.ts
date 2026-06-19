// @ts-nocheck
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  validateApiToken,
  getPatientByExternalId,
  logWebhook,
} from "../db-webhooks";
import { createPatient, updatePatient, createSession, getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import { logLGPDEvent, LGPDEventType } from "../_core/lgpdLogger";
import type { InsertSession } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { syncSiteToESaude } from "../esaude-agent";

export const websiteAppointmentsRouter = router({
  /**
   * Sincronizar agendamento do site profissional (psicologo.manus.space)
   * Salva no banco local E cria tarefa de sincronização com E-SAÚDE
   */
  appointmentFromWebsite: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        consultationType: z.string(),
        observations: z.string().optional(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
        modality: z.enum(["presencial", "virtual"]).optional(),
        paymentStatus: z.enum(["pending", "approved", "failed"]).default("pending"),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let userId: number | null = null;

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

      try {
        const customer_id = `web_${input.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
        const existingPatient = await getPatientByExternalId(userId, customer_id);

        let patientId: number;
        let isNew = false;

        if (existingPatient) {
          patientId = existingPatient.id;
          await updatePatient(patientId, userId, {
            phone: input.phone || existingPatient.phone,
            mainComplaint: input.observations || existingPatient.mainComplaint,
            updatedAt: new Date(),
          });
        } else {
          isNew = true;
          patientId = await createPatient({
            userId,
            externalCustomerId: customer_id,
            name: input.name,
            email: input.email,
            phone: input.phone || null,
            mainComplaint: input.observations || input.consultationType,
            status: "active",
            isActive: 1,
            leadSource: "website",
            leadStatus: "lead",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        if (input.appointmentDate) {
          const dateStr = input.appointmentDate;
          const timeStr = input.appointmentTime || "10:00";
          const scheduledAtStr = `${dateStr}T${timeStr}:00`;
          const scheduledAt = new Date(scheduledAtStr).getTime();

          const sessionData: InsertSession = {
            userId,
            patientId,
            scheduledAt,
            durationMinutes: 50,
            status: "scheduled",
            sessionType: "individual",
            modality: input.modality === "virtual" ? "online" : "in_person",
            notes: `Agendamento do site profissional\nTipo: ${input.consultationType}\nObservações: ${input.observations || "Nenhuma"}`,
            isPaid: input.paymentStatus === "approved" ? "paid" : "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const sessionId = await createSession(sessionData);
          console.log(`[DEBUG] Agendamento criado: sessionId=${sessionId}, patientId=${patientId}`);
          
          // Sincronizar com E-SAÚDE IMEDIATAMENTE (sem delay)
          console.log(`[DEBUG] Iniciando sincronização para sessionId=${sessionId}`);
          try {
            const syncResult = await syncSiteToESaude(sessionId);
            console.log(`[DEBUG] Sincronização bem-sucedida: ${JSON.stringify(syncResult)}`);
          } catch (err) {
            console.error(`[Error] Falha ao sincronizar agendamento ${sessionId} com E-SAÚDE:`, err);
            // Continua mesmo se falhar - o agendamento foi criado no site
          }
        }

        if (isNew) {
          logLGPDEvent({
            userId,
            eventType: LGPDEventType.PATIENT_CREATED,
            resourceType: "patient",
            resourceId: patientId,
            action: "CREATE",
            dataClassification: "CONFIDENTIAL",
            description: `Agendamento do site: ${input.name} (${input.email})`,
            status: "SUCCESS",
          });
        }

        await logWebhook(userId, "website_appointment", customer_id, input, "success").catch(() => {});

        await notifyOwner({
          title: "Novo Agendamento do Site",
          content: `${input.name} (${input.email}) agendou uma consulta de ${input.consultationType}`,
        }).catch(() => {});

        return {
          success: true,
          patientId,
          message: isNew ? "Paciente criado e agendamento registrado" : "Agendamento registrado",
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (userId) {
          await logWebhook(
            userId,
            "website_appointment",
            input.email,
            input,
            "failed",
            errorMessage
          ).catch(() => {});
        }
        throw error;
      }
    }),
});
