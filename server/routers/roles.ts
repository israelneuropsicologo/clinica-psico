import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db.js";
import { roles, permissions, rolePermissions } from "../../drizzle/schema.js";
import { eq, and } from "drizzle-orm";

export const rolesRouter = router({
  /**
   * Listar roles da clínica
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar roles",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allRoles = await db.select().from(roles).where(eq(roles.clinicId, 1));

      return allRoles;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar roles",
      });
    }
  }),

  /**
   * Criar nova role
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem criar roles",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const result = await db.insert(roles).values({
          name: input.name,
          description: input.description,
          clinicId: 1, // TODO: usar clinicId do usuário
        });

        return { success: true, message: "Role criada com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar role",
        });
      }
    }),

  /**
   * Atualizar role
   */
  update: protectedProcedure
    .input(
      z.object({
        roleId: z.number().positive(),
        name: z.string().min(2).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem atualizar roles",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db
          .update(roles)
          .set({
            name: input.name,
            description: input.description,
          })
          .where(eq(roles.id, input.roleId));

        return { success: true, message: "Role atualizada com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar role",
        });
      }
    }),

  /**
   * Deletar role
   */
  delete: protectedProcedure
    .input(z.object({ roleId: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem deletar roles",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Deletar permissions vinculadas
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));

        // Deletar role
        await db.delete(roles).where(eq(roles.id, input.roleId));

        return { success: true, message: "Role deletada com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar role",
        });
      }
    }),

  /**
   * Listar permissions de uma role
   */
  getPermissions: protectedProcedure
    .input(z.object({ roleId: z.number().positive() }))
    .query(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem visualizar permissions",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

      const perms = await db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, input.roleId));

      return perms.map((p) => p.permission);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar permissions",
        });
      }
    }),

  /**
   * Adicionar permission a uma role
   */
  addPermission: protectedProcedure
    .input(
      z.object({
        roleId: z.number().positive(),
        permissionId: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem adicionar permissions",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db.insert(rolePermissions).values({
          roleId: input.roleId,
          permissionId: input.permissionId,
        });

        return { success: true, message: "Permission adicionada com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao adicionar permission",
        });
      }
    }),

  /**
   * Remover permission de uma role
   */
  removePermission: protectedProcedure
    .input(
      z.object({
        roleId: z.number().positive(),
        permissionId: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem remover permissions",
          });
        }

        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        await db
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, input.roleId),
              eq(rolePermissions.permissionId, input.permissionId)
            )
          );

        return { success: true, message: "Permission removida com sucesso" };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao remover permission",
        });
      }
    }),

  /**
   * Listar todas as permissions disponíveis
   */
  listAllPermissions: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem listar permissions",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const allPermissions = await db.select().from(permissions);
      return allPermissions;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar permissions",
      });
    }
  }),
});
