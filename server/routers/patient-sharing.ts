import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  sharePatient,
  unsharePatient,
  getSharedWith,
  getSharedPatients,
  getSharePermission,
  canAccessPatient,
  getPatientById,
} from "../db";

/**
 * Router para compartilhamento de pacientes entre psicólogos
 * Permite que um psicólogo compartilhe seus pacientes com outros psicólogos
 */
export const patientSharingRouter = router({
  /**
   * Compartilhar um paciente com outro psicólogo
   * Apenas o proprietário do paciente pode compartilhar
   */
  sharePatient: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int().positive(),
        toUserId: z.number().int().positive(),
        permission: z.enum(["view", "edit", "admin"]).default("view"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o paciente pertence ao usuário autenticado
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Paciente não encontrado ou você não tem permissão para compartilhá-lo",
          });
        }

        // Não permitir compartilhar com a mesma pessoa
        if (input.toUserId === ctx.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Você não pode compartilhar um paciente consigo mesmo",
          });
        }

        // Compartilhar o paciente
        const shareId = await sharePatient(
          ctx.user.id,
          input.toUserId,
          input.patientId,
          input.permission
        );

        return {
          success: true,
          shareId,
          message: `Paciente compartilhado com sucesso (permissão: ${input.permission})`,
        };
      } catch (error) {
        console.error("[Patient Sharing] Error sharing patient:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao compartilhar paciente",
        });
      }
    }),

  /**
   * Remover compartilhamento de um paciente
   * Apenas o proprietário pode remover
   */
  unsharePatient: protectedProcedure
    .input(
      z.object({
        patientId: z.number().int().positive(),
        toUserId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o paciente pertence ao usuário autenticado
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Paciente não encontrado ou você não tem permissão",
          });
        }

        // Remover compartilhamento
        const removed = await unsharePatient(ctx.user.id, input.toUserId, input.patientId);

        if (!removed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Compartilhamento não encontrado",
          });
        }

        return {
          success: true,
          message: "Compartilhamento removido com sucesso",
        };
      } catch (error) {
        console.error("[Patient Sharing] Error unsharing patient:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover compartilhamento",
        });
      }
    }),

  /**
   * Listar usuários com quem um paciente foi compartilhado
   * Apenas o proprietário pode listar
   */
  getSharedWith: protectedProcedure
    .input(z.object({ patientId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verificar se o paciente pertence ao usuário autenticado
        const patient = await getPatientById(input.patientId, ctx.user.id);
        if (!patient) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Paciente não encontrado",
          });
        }

        // Listar compartilhamentos
        const shares = await getSharedWith(input.patientId, ctx.user.id);

        return {
          success: true,
          shares: shares.map((share) => ({
            id: share.id,
            toUserId: share.toUserId,
            permission: share.permission,
            createdAt: share.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Patient Sharing] Error getting shares:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar compartilhamentos",
        });
      }
    }),

  /**
   * Listar pacientes compartilhados COM o usuário (que ele recebeu acesso)
   */
  listSharedPatients: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["all", "active", "inactive", "discharged"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const patients = await getSharedPatients(ctx.user.id, input.search, input.status);

        return {
          success: true,
          patients: patients.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            status: p.status,
            createdAt: p.createdAt,
          })),
        };
      } catch (error) {
        console.error("[Patient Sharing] Error listing shared patients:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar pacientes compartilhados",
        });
      }
    }),

  /**
   * Verificar permissão de um usuário para um paciente
   */
  checkPermission: protectedProcedure
    .input(z.object({ patientId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verificar se é o proprietário
        const owned = await getPatientById(input.patientId, ctx.user.id);
        if (owned) {
          return {
            success: true,
            hasAccess: true,
            isOwner: true,
            permission: "admin" as const,
          };
        }

        // Verificar se tem acesso compartilhado
        const permission = await getSharePermission(ctx.user.id, input.patientId);
        if (permission) {
          return {
            success: true,
            hasAccess: true,
            isOwner: false,
            permission,
          };
        }

        return {
          success: true,
          hasAccess: false,
          isOwner: false,
          permission: null,
        };
      } catch (error) {
        console.error("[Patient Sharing] Error checking permission:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao verificar permissão",
        });
      }
    }),

  /**
   * Verificar se o usuário pode acessar um paciente (próprio ou compartilhado)
   */
  canAccess: protectedProcedure
    .input(z.object({ patientId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        const hasAccess = await canAccessPatient(ctx.user.id, input.patientId);

        return {
          success: true,
          canAccess: hasAccess,
        };
      } catch (error) {
        console.error("[Patient Sharing] Error checking access:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao verificar acesso",
        });
      }
    }),
});
