import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { technicalDocuments } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const technicalDocumentsRouter = router({
  // Listar documentos técnicos de um paciente
  list: protectedProcedure
    .input(z.object({ patientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const docs = await db
        .select()
        .from(technicalDocuments)
        .where(eq(technicalDocuments.patientId, input.patientId))
        .orderBy(desc(technicalDocuments.createdAt));
      return docs;
    }),

  // Criar novo documento técnico
  create: protectedProcedure
    .input(
      z.object({
        patientId: z.number(),
        documentType: z.enum(["certificate", "report", "opinion", "referral", "prescription", "evaluation"]),
        title: z.string(),
        content: z.string(),
        templateId: z.string().optional(),
        issuedDate: z.number(),
        expiryDate: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(technicalDocuments).values({
        patientId: input.patientId,
        userId: ctx.user.id,
        documentType: input.documentType,
        title: input.title,
        content: input.content,
        templateId: input.templateId,
        status: "draft",
        issuedDate: input.issuedDate,
        expiryDate: input.expiryDate,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      });
      return { success: true };
    }),

  // Atualizar documento
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "pending_review", "approved", "signed", "archived"]).optional(),
        pdfUrl: z.string().optional(),
        pdfKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updates } = input;
      await db
        .update(technicalDocuments)
        .set(updates)
        .where(eq(technicalDocuments.id, id));
      return { success: true };
    }),

  // Assinar documento
  sign: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(technicalDocuments)
        .set({
          status: "signed",
          signatureDate: Date.now(),
        })
        .where(eq(technicalDocuments.id, input.id));
      return { success: true };
    }),

  // Deletar documento
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(technicalDocuments)
        .where(eq(technicalDocuments.id, input.id));
      return { success: true };
    }),

  // Gerar PDF (placeholder para integração com gerador de PDF)
  generatePdf: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Aqui você integraria com o gerador de PDF
      // Por enquanto, retornamos um placeholder
      const pdfUrl = `/manus-storage/document_${input.id}_${Date.now()}.pdf`;
      const pdfKey = `documents/document_${input.id}_${Date.now()}.pdf`;
      
      await db
        .update(technicalDocuments)
        .set({
          pdfUrl,
          pdfKey,
          status: "approved",
        })
        .where(eq(technicalDocuments.id, input.id));
      
      return { pdfUrl, pdfKey };
    }),
});
