import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import {
  getInternalUsersByClinic,
  updateInternalUser,
  deactivateInternalUser,
  activateInternalUser,
  deleteInternalUserPermanently,
  countActiveInternalUsers,
} from "../db/internal-users-management.js";
import { TRPCError } from "@trpc/server";
import { getClinicIdForUser, getDb } from "../db.js";
import { eq } from "drizzle-orm";
import { internalUsers } from "../../drizzle/schema";

/**
 * Router para gerenciar usuários internos (admin only)
 */
export const internalUsersRouter = router({
  /**
   * Lista usuários internos da clínica do admin
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar usuários internos",
        });
      }

      // Obter clinicId do usuário
      const clinicId = await getClinicIdForUser(ctx.user.id);
      if (!clinicId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clínica não encontrada",
        });
      }

      const users = await getInternalUsersByClinic(clinicId);
      return users;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar usuários internos",
      });
    }
  }),

  /**
   * Atualiza um usuário interno
   */
  update: protectedProcedure
    .input(
      z.object({
        userId: z.number().positive(),
        name: z.string().min(2).optional(),
        roleId: z.number().positive().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem atualizar usuários internos",
          });
        }

        const result = await updateInternalUser(input.userId, {
          name: input.name,
          roleId: input.roleId,
          isActive: input.isActive,
        });

        return { success: true, message: "Usuário atualizado com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar usuário",
        });
      }
    }),

  /**
   * Desativa um usuário interno (soft delete)
   */
  deactivate: protectedProcedure
    .input(z.object({ userId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem desativar usuários",
          });
        }

        await deactivateInternalUser(input.userId);
        return { success: true, message: "Usuário desativado com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao desativar usuário",
        });
      }
    }),

  /**
   * Ativa um usuário interno
   */
  activate: protectedProcedure
    .input(z.object({ userId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem ativar usuários",
          });
        }

        await activateInternalUser(input.userId);
        return { success: true, message: "Usuário ativado com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao ativar usuário",
        });
      }
    }),

  /**
   * Deleta um usuário interno permanentemente
   */
  delete: protectedProcedure
    .input(z.object({ userId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem deletar usuários",
          });
        }

        await deleteInternalUserPermanently(input.userId);
        return { success: true, message: "Usuário deletado com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar usuário",
        });
      }
    }),

  /**
   * Conta usuários ativos
   */
  countActive: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Verificar se é admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem contar usuários",
        });
      }

      const clinicId = await getClinicIdForUser(ctx.user.id);
      if (!clinicId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clínica não encontrada",
        });
      }

      const count = await countActiveInternalUsers(clinicId);
      return { count };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao contar usuários",
      });
    }
  }),

  /**
   * Resetar senha de um usuário
   */
  resetPassword: protectedProcedure
    .input(z.object({ userId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem resetar senhas",
          });
        }

        // Gerar nova senha aleatória
        const newPassword = Math.random().toString(36).slice(-12);
        
        // Atualizar senha no banco
        const { hashPassword } = await import("../db/internal-auth.js");
        const hashedPassword = await hashPassword(newPassword);
        
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        
        await db.update(internalUsers)
          .set({ passwordHash: hashedPassword })
          .where(eq(internalUsers.id, input.userId));
        
        return { success: true, newPassword };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao resetar senha",
        });
      }
    }),
});
