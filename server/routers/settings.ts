import { z } from "zod";
import { protectedProcedure, router } from "../\_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { settings as settingsTable, InsertSettings } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { executeFullBackup, listBackupsFromGoogleDrive } from "../_core/backupService";

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
      // Se não existem configurações, criar com valores padrão
      const defaultSettings: InsertSettings = {
        userId: ctx.user.id,
        clinicName: "Consultório Israel Mendes",
        clinicEmail: ctx.user.email || "israelneuropsicologo@gmail.com",
        clinicPhone: "(21) 96402-6931",
        clinicAddress: "",
        clinicCity: "",
        clinicState: "",
        clinicZipCode: "",
        ownerName: ctx.user.name || "Israel Mendes",
        ownerEmail: ctx.user.email || "israelneuropsicologo@gmail.com",
        ownerPhone: "(21) 96402-6931",
        ownerCPF: "",
        ownerCRPNumber: "05/85230",
        ownerSpecialty: "Psicólogo Clínico | Especialista em Neuropsicologia",
        ownerBio: "Com sólida formação em Psicologia e especialização em Neuropsicologia, foco minha atuação no diagnóstico e acompanhamento de condições do neurodesenvolvimento. Meu trabalho é direcionado ao suporte de pacientes com TDAH e TEA, utilizando avaliações precisas e intervenções baseadas em evidências para promover autonomia e qualidade de vida.",
        ownerWhatsapp: "(21) 96402-6931",
        ownerInstagram: "",
        ownerLinkedin: "",
        ownerWebsite: "https://psicologo.manus.space",
        systemTitle: "E-Saúde | Gestão Clínica",
        systemSubtitle: "Sistema de Gestão para Psicólogos",
        sessionDefaultDuration: 60,
        sessionDefaultPrice: "200.00",
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
      };
      
      // Inserir configurações padrão no banco
      await db.insert(settingsTable).values(defaultSettings);
      
      // Retornar as configurações criadas
      const created = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.userId, ctx.user.id))
        .limit(1);
      
      return created[0] || { ...defaultSettings, id: 0, createdAt: new Date(), updatedAt: new Date() };
    }

    return result[0];
  }),

  // Atualizar configurações (apenas o proprietário)
  update: protectedProcedure
    .input(
      z.object({
        clinicName: z.string().optional(),
        clinicEmail: z.string().email().optional().or(z.literal("")),
        clinicPhone: z.string().optional(),
        clinicAddress: z.string().optional(),
        clinicCity: z.string().optional(),
        clinicState: z.string().optional(),
        clinicZipCode: z.string().optional(),
        ownerName: z.string().optional(),
        ownerEmail: z.string().email().optional().or(z.literal("")),
        ownerPhone: z.string().optional(),
        ownerCPF: z.string().optional(),
        ownerCRPNumber: z.string().optional(),
        ownerSpecialty: z.string().optional(),
        ownerBio: z.string().optional(),
        ownerWhatsapp: z.string().optional(),
        ownerInstagram: z.string().optional(),
        ownerLinkedin: z.string().optional(),
        ownerWebsite: z.string().optional(),
        systemTitle: z.string().optional(),
        systemSubtitle: z.string().optional(),
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

      // Filter out empty strings for email fields
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined && value !== "") {
          updateData[key] = value;
        } else if (value === "" && key !== "clinicEmail" && key !== "ownerEmail") {
          // Allow clearing non-email fields
          updateData[key] = value;
        }
      }

      if (existing.length) {
        // Atualizar configurações existentes
        await db
          .update(settingsTable)
          .set(updateData)
          .where(eq(settingsTable.userId, ctx.user.id));
      } else {
        const insertData: InsertSettings = {
          userId: ctx.user.id,
          clinicName: input.clinicName || "Consultório Israel Mendes",
          clinicEmail: input.clinicEmail || ctx.user.email || "",
          clinicPhone: input.clinicPhone || "(21) 96402-6931",
          clinicAddress: input.clinicAddress || "",
          clinicCity: input.clinicCity || "",
          clinicState: input.clinicState || "",
          clinicZipCode: input.clinicZipCode || "",
          ownerName: input.ownerName || ctx.user.name || "Israel Mendes",
          ownerEmail: input.ownerEmail || ctx.user.email || "",
          ownerPhone: input.ownerPhone || "(21) 96402-6931",
          ownerCPF: input.ownerCPF || "",
          ownerCRPNumber: input.ownerCRPNumber || "05/85230",
          ownerSpecialty: input.ownerSpecialty || "Psicólogo Clínico | Especialista em Neuropsicologia",
          ownerBio: input.ownerBio || "",
          ownerWhatsapp: input.ownerWhatsapp || "(21) 96402-6931",
          ownerInstagram: input.ownerInstagram || "",
          ownerLinkedin: input.ownerLinkedin || "",
          ownerWebsite: input.ownerWebsite || "https://psicologo.manus.space",
          systemTitle: input.systemTitle || "E-Saúde | Gestão Clínica",
          systemSubtitle: input.systemSubtitle || "Sistema de Gestão para Psicólogos",
          sessionDefaultDuration: input.sessionDefaultDuration || 60,
          sessionDefaultPrice: input.sessionDefaultPrice || "200.00",
          currency: input.currency || "BRL",
          timezone: input.timezone || "America/Sao_Paulo",
          language: input.language || "pt-BR",
        };
        await db.insert(settingsTable).values(insertData);
      }

      const updated = await db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.userId, ctx.user.id))
        .limit(1);

      return updated[0];
    }),

  triggerBackup: protectedProcedure.mutation(async () => {
    try {
      const result = await executeFullBackup();
      return { success: true, timestamp: result.timestamp, storageUrl: result.storageUrl };
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),

  listBackups: protectedProcedure.query(async () => {
    try {
      return await listBackupsFromGoogleDrive();
    } catch (error: any) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
  }),
});
