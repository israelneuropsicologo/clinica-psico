import { TRPCError } from "@trpc/server";
import { hasPermission } from "../db/permissions-check.js";

/**
 * Middleware para verificar permissão de usuário interno
 * Uso: .use(requirePermission("patients.view"))
 */
export const requirePermission = (permissionName: string) => {
  return async ({ ctx, next }: any) => {
    // Se for usuário OAuth (psicólogo), permitir tudo
    if (ctx.user && ctx.user.loginMethod === "oauth") {
      return next({ ctx });
    }

    // Se for usuário interno, verificar permissão
    if (ctx.internalUser) {
      const hasAccess = await hasPermission(ctx.internalUser.id, permissionName);
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Você não tem permissão para: ${permissionName}`,
        });
      }
      return next({ ctx });
    }

    // Se não for nenhum dos dois, negar
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Autenticação necessária",
    });
  };
};

/**
 * Middleware para permitir apenas usuários internos
 */
export const internalUserOnly = async ({ ctx, next }: any) => {
  if (!ctx.internalUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas usuários internos podem acessar",
    });
  }
  return next({ ctx });
};

/**
 * Middleware para permitir apenas psicólogos (OAuth)
 */
export const psychologistOnly = async ({ ctx, next }: any) => {
  if (!ctx.user || ctx.user.loginMethod !== "oauth") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Apenas psicólogos podem acessar",
    });
  }
  return next({ ctx });
};
