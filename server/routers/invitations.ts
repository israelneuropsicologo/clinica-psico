import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createInvitation,
  validateInvitationToken,
  getPatientByInvitationToken,
  updatePatientFromInvitation,
  listInvitationsByUser,
  revokeInvitation,
} from "../db/invitations";
import { notifyOwner } from "../_core/notification";

/**
 * Campos que apenas o psicólogo pode preencher
 */
const PSYCHOLOGIST_ONLY_FIELDS = [
  "medicalHistory",
  "medications",
  "mainComplaint",
  "notes",
  "referredBy",
  "status",
  "leadSource",
  "leadStatus",
  "sessionValue",
  "interactionCount",
  "lastInteractionAt",
];

/**
 * Campos que o paciente pode preencher
 */
const PATIENT_EDITABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "birthDate",
  "cpf",
  "address",
  "addressNumber",
  "addressComplement",
  "neighborhood",
  "city",
  "state",
  "zipCode",
  "phone2",
  "emergencyContact",
  "emergencyPhone",
  "insuranceName",
  "insuranceNumber",
  "insurancePlan",
  "insuranceExpiry",
  "gender",
  "maritalStatus",
  "schooling",
  "religion",
  "occupation",
];

export const invitationsRouter = router({
  /**
   * Gera um novo link de convite para um paciente
   * Apenas psicólogos autenticados podem gerar
   */
  generateLink: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int().positive(),
        expiresInDays: z.number().int().positive().default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const invitation = await createInvitation(
          input.patientId,
          ctx.user.id,
          input.expiresInDays
        );

        // Construir URL do convite
        const baseUrl = process.env.VITE_FRONTEND_URL || "https://clinicaapp-p4nfwoum.manus.space";
        const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

        return {
          success: true,
          inviteUrl,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        };
      } catch (error) {
        console.error("[Invitations] Error generating link:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao gerar link de convite",
        });
      }
    }),

  /**
   * Valida um token de convite (sem autenticação)
   * Retorna informações sobre o convite
   */
  validateToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const validation = await validateInvitationToken(input.token);

        if (!validation.valid) {
          return {
            valid: false,
            error: validation.error,
          };
        }

        return {
          valid: true,
          expiresAt: validation.invitation!.expiresAt,
          status: validation.invitation!.status,
        };
      } catch (error) {
        console.error("[Invitations] Error validating token:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao validar token",
        });
      }
    }),

  /**
   * Obtém dados do paciente para preenchimento via convite
   * Sem autenticação - apenas token necessário
   */
  getPatientData: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await getPatientByInvitationToken(input.token);

        if ("error" in result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error,
          });
        }

        const { patient, invitation } = result;

        // Retornar apenas campos editáveis pelo paciente
        const editableData: Record<string, any> = {};
        PATIENT_EDITABLE_FIELDS.forEach((field) => {
          editableData[field] = (patient as any)[field] || null;
        });

        return {
          patient: editableData,
          invitation: {
            id: invitation!.id,
            status: invitation!.status,
            expiresAt: invitation!.expiresAt,
            completedAt: invitation!.completedAt,
          },
        };
      } catch (error) {
        console.error("[Invitations] Error getting patient data:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter dados do paciente",
        });
      }
    }),

  /**
   * Atualiza dados do paciente via convite
   * Valida que apenas campos editáveis sejam atualizados
   */
  updatePatientData: publicProcedure
    .input(
      z.object({
        token: z.string(),
        data: z.record(z.string(), z.any()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validar que apenas campos editáveis estão sendo atualizados
        const updateData: Record<string, any> = {};

        for (const [key, value] of Object.entries(input.data)) {
          if (!PATIENT_EDITABLE_FIELDS.includes(key)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Campo não permitido: ${key}`,
            });
          }
          updateData[key] = value;
        }

        const result = await updatePatientFromInvitation(input.token, updateData);

        if ("error" in result) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.error,
          });
        }

        // Notificar psicólogo que paciente completou
        const { patientId } = result as { patientId: number };
        notifyOwner({
          title: "Cadastro de Paciente Preenchido",
          content: `O paciente preencheu seus dados de cadastro (ID: ${patientId})`,
        }).catch(() => {
          // Falha silenciosa se notificação não funcionar
          console.warn("[Invitations] Failed to notify owner");
        });

        return {
          success: true,
          message: "Dados atualizados com sucesso",
        };
      } catch (error) {
        console.error("[Invitations] Error updating patient data:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar dados",
        });
      }
    }),

  /**
   * Lista convites de um psicólogo
   * Apenas autenticados podem acessar
   */
  listByUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      const invitations = await listInvitationsByUser(ctx.user.id);
      return invitations;
    } catch (error) {
      console.error("[Invitations] Error listing invitations:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar convites",
      });
    }
  }),

  /**
   * Revoga um convite (marca como expirado)
   * Apenas o psicólogo que criou pode revogar
   */
  revoke: protectedProcedure
    .input(z.object({ invitationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // TODO: Validar que o convite pertence ao usuário autenticado
        await revokeInvitation(input.invitationId);

        return {
          success: true,
          message: "Convite revogado com sucesso",
        };
      } catch (error) {
        console.error("[Invitations] Error revoking invitation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao revogar convite",
        });
      }
    }),
});
