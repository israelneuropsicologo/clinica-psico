import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { settings as settingsTable, InsertSettings } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

/**
 * Settings Router - Gerenciamento de configurações do sistema
 * Apenas o proprietário (owner) pode atualizar as configurações
 */
export const settingsRouter = router({
  // Obter configurações do usuário
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, ctx.user.id))
      .limit(1);

    if (!result.length) {
      // Retornar configurações padrão se não existirem
      return {
        id: 0,
        userId: ctx.user.id,
        clinicName: "Minha Clínica",
        clinicEmail: ctx.user.email || "",
        clinicPhone: "",
        clinicAddress: "",
        clinicCity: "",
        clinicState: "",
        clinicZipCode: "",
        ownerName: ctx.user.name || "",
        ownerEmail: ctx.user.email || "",
        ownerPhone: "",
        ownerCPF: "",
        ownerCRPNumber: "",
        sessionDefaultDuration: 60,
        sessionDefaultPrice: "200.00",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return result[0];
  }),

  // Atualizar configurações (apenas o proprietário)
  update: protectedProcedure
    .input(
      z.object({
        clinicName: z.string().optional(),
        clinicEmail: z.string().email().optional(),
        clinicPhone: z.string().optional(),
        clinicAddress: z.string().optional(),
        clinicCity: z.string().optional(),
        clinicState: z.string().optional(),
        clinicZipCode: z.string().optional(),
        ownerName: z.string().optional(),
        ownerEmail: z.string().email().optional(),
        ownerPhone: z.string().optional(),
        ownerCPF: z.string().optional(),
        ownerCRPNumber: z.string().optional(),
        sessionDefaultDuration: z.number().optional(),
        sessionDefaultPrice: z.string().optional(),
        currency: z.string().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verificar se as configurações já existem
      const existing = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.userId, ctx.user.id))
        .limit(1);

      const updateData: Record<string, any> = {
        ...input,
        updatedAt: new Date(),
      };

      if (existing.length) {
        // Atualizar
        await db
          .update(settingsTable)
          .set(updateData)
          .where(eq(settingsTable.userId, ctx.user.id));
      } else {
        // Criar
        const insertData: InsertSettings = {
          userId: ctx.user.id,
          clinicName: input.clinicName || "Minha Clínica",
          clinicEmail: input.clinicEmail || ctx.user.email || "",
          clinicPhone: input.clinicPhone || "",
          clinicAddress: input.clinicAddress || "",
          clinicCity: input.clinicCity || "",
          clinicState: input.clinicState || "",
          clinicZipCode: input.clinicZipCode || "",
          ownerName: input.ownerName || ctx.user.name || "",
          ownerEmail: input.ownerEmail || ctx.user.email || "",
          ownerPhone: input.ownerPhone || "",
          ownerCPF: input.ownerCPF || "",
          ownerCRPNumber: input.ownerCRPNumber || "",
          sessionDefaultDuration: input.sessionDefaultDuration || 60,
          sessionDefaultPrice: input.sessionDefaultPrice || "200.00",
          currency: input.currency || "BRL",
          timezone: input.timezone || "America/Sao_Paulo",
          language: input.language || "pt-BR",
        };
        await db.insert(settingsTable).values(insertData);
      }

      // Retornar as configurações atualizadas
      const updated = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.userId, ctx.user.id))
        .limit(1);

      return updated[0];
    }),
});
