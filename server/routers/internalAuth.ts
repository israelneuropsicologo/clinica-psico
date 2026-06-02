import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import {
  loginInternalUser,
  createInternalUser,
  getInternalUserById,
} from "../db/internal-auth.js";
import { TRPCError } from "@trpc/server";

/**
 * Router para autenticação interna (email/senha)
 * Usuários internos: secretária, financeiro, etc
 */
export const internalAuthRouter = router({
  /**
   * Login com email e senha
   * Cria session cookie automaticamente
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await loginInternalUser(input.email, input.password);

        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha incorretos",
          });
        }

        // Criar session cookie
        // O contexto já tem acesso a req/res do Express
        if (ctx.req && ctx.res) {
          // Serializar usuário para session
          const sessionData = JSON.stringify({
            internalUserId: user.id,
            email: user.email,
            name: user.name,
            clinicId: user.clinicId,
            roleId: user.roleId,
            type: "internal", // Diferencia de OAuth
          });

          // Armazenar em session (Express)
          (ctx.req as any).session = {
            internalUser: {
              id: user.id,
              email: user.email,
              name: user.name,
              clinicId: user.clinicId,
              roleId: user.roleId,
            },
          };

          // Cookie será criado automaticamente pelo Express session middleware
        }

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            clinicId: user.clinicId,
            roleId: user.roleId,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao fazer login",
        });
      }
    }),

  /**
   * Logout - Limpa session
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.req && ctx.res) {
      // Limpar session
      (ctx.req as any).session = null;

      // Express session middleware vai limpar o cookie automaticamente
    }

    return { success: true };
  }),

  /**
   * Retorna usuário interno atual (se logado)
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const session = (ctx.req as any)?.session;

    if (!session?.internalUser) {
      return null; // Não está logado como usuário interno
    }

    const user = await getInternalUserById(session.internalUser.id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      clinicId: user.clinicId,
      roleId: user.roleId,
      type: "internal",
    };
  }),

  /**
   * Criar novo usuário interno (admin only)
   * Será protegido depois com permissões
   */
  createUser: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
        clinicId: z.number().positive(),
        roleId: z.number().positive(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // TODO: Verificar se usuário é admin antes de permitir

        const result = await createInternalUser(
          input.clinicId,
          input.email,
          input.password,
          input.name,
          input.roleId
        );

        return {
          success: true,
          message: "Usuário criado com sucesso",
        };
      } catch (error: any) {
        if (error.message.includes("Email já cadastrado")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email já cadastrado",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao criar usuário",
        });
      }
    }),
});
