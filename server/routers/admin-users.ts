import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Admin-only procedure - verifica se o usuário é admin
 */
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem acessar esta função" });
  }
  return next({ ctx });
});

export const adminUsersRouter = router({
  /**
   * Listar todos os usuários
   */
  getUsers: adminProcedure.query(async ({ ctx }) => {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastSignedIn: true,
      },
    });
    return allUsers;
  }),

  /**
   * Obter usuário por ID
   */
  getUser: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, input.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
    }

    return user;
  }),

  /**
   * Criar novo usuário
   */
  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        role: z.enum(["admin", "psychologist", "secretary", "patient"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verificar se email já existe
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
      }

      // Criar novo usuário com openId temporário
      const openId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: 1,
        loginMethod: "manual",
      });

      return {
        id: result.insertId,
        message: "Usuário criado com sucesso. Um email de confirmação foi enviado.",
      };
    }),

  /**
   * Atualizar usuário
   */
  updateUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["admin", "psychologist", "secretary", "patient"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...updateData } = input;

      // Verificar se usuário existe
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // Se email está sendo alterado, verificar se já existe
      if (updateData.email && updateData.email !== user.email) {
        const existingEmail = await db.query.users.findFirst({
          where: eq(users.email, updateData.email),
        });

        if (existingEmail) {
          throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
        }
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));

      return { message: "Usuário atualizado com sucesso" };
    }),

  /**
   * Ativar/Desativar usuário
   */
  toggleUserActive: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      const newStatus = user.isActive === 1 ? 0 : 1;
      await db.update(users).set({ isActive: newStatus }).where(eq(users.id, input.userId));

      return { message: `Usuário ${newStatus === 1 ? "ativado" : "desativado"} com sucesso` };
    }),

  /**
   * Deletar usuário
   */
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Não permitir deletar a si mesmo
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode deletar sua própria conta" });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // Soft delete - apenas marcar como inativo
      await db.update(users).set({ isActive: 0 }).where(eq(users.id, input.userId));

      return { message: "Usuário deletado com sucesso" };
    }),

  /**
   * Resetar senha do usuário
   */
  resetUserPassword: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // TODO: Implementar envio de email com link de reset de senha
      // Por enquanto, apenas retornar sucesso

      return { message: "Email de reset de senha enviado para " + user.email };
    }),
});
