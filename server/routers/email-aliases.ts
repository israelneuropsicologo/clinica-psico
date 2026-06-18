import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { addEmailAlias, removeEmailAlias, getUserEmailAliases } from "../db/email-aliases";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Router para gerenciar email aliases (Admin Only)
 * Permite que administradores adicionem/removam aliases de email para usuários
 */
export const emailAliasesRouter = router({
  /**
   * Adicionar um novo email alias a um usuário
   * Apenas administradores podem fazer isso
   */
  addAlias: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        email: z.string().email(),
        isPrimary: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o usuário é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem gerenciar email aliases",
          });
        }

        // Verificar se o email já está em uso
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser && existingUser.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Este email já está em uso por outro usuário",
          });
        }

        // Adicionar alias
        await addEmailAlias(input.userId, input.email, input.isPrimary);

        return {
          success: true,
          message: `Email alias ${input.email} adicionado com sucesso`,
        };
      } catch (error) {
        console.error("[Email Aliases] Error adding alias:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao adicionar email alias",
        });
      }
    }),

  /**
   * Remover um email alias
   * Apenas administradores podem fazer isso
   */
  removeAlias: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Verificar se o usuário é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem gerenciar email aliases",
          });
        }

        // Remover alias
        await removeEmailAlias(input.email);

        return {
          success: true,
          message: `Email alias ${input.email} removido com sucesso`,
        };
      } catch (error) {
        console.error("[Email Aliases] Error removing alias:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao remover email alias",
        });
      }
    }),

  /**
   * Listar todos os aliases de um usuário
   * Apenas administradores podem fazer isso
   */
  listAliases: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verificar se o usuário é admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem gerenciar email aliases",
          });
        }

        // Listar aliases
        const aliases = await getUserEmailAliases(input.userId);

        return {
          success: true,
          aliases,
        };
      } catch (error) {
        console.error("[Email Aliases] Error listing aliases:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Erro ao listar email aliases",
        });
      }
    }),

  /**
   * Listar todos os aliases do usuário autenticado
   * Qualquer usuário autenticado pode ver seus próprios aliases
   */
  myAliases: protectedProcedure.query(async ({ ctx }) => {
    try {
      const aliases = await getUserEmailAliases(ctx.user.id);

      return {
        success: true,
        aliases,
      };
    } catch (error) {
      console.error("[Email Aliases] Error listing my aliases:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Erro ao listar seus email aliases",
      });
    }
  }),
});
