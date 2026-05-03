import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { triggerManualBackup, listBackupsFromGoogleDrive, restoreBackupFromGoogleDrive, extractAndImportBackup } from "../_core/backupService";
import { notifyOwner } from "../_core/notification";

export const systemRouter = router({
  // Trigger manual backup (admin only)
  triggerBackup: adminProcedure.mutation(async () => {
    try {
      const result = await triggerManualBackup();
      
      // Notify owner
      await notifyOwner({
        title: "Backup Manual Iniciado",
        content: `Backup manual foi iniciado com sucesso às ${new Date().toLocaleString("pt-BR")}`,
      });

      return result;
    } catch (error) {
      console.error("[System] Backup trigger error:", error);
      throw new Error("Falha ao iniciar backup");
    }
  }),

  // List available backups (admin only)
  listBackups: adminProcedure.query(async () => {
    try {
      const backups = await listBackupsFromGoogleDrive();
      return backups;
    } catch (error) {
      console.error("[System] List backups error:", error);
      throw new Error("Falha ao listar backups");
    }
  }),

  // Restore backup (admin only)
  restoreBackup: adminProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const zipPath = await restoreBackupFromGoogleDrive(input.fileId);
        
        // Extract and import data from ZIP
        const result = await extractAndImportBackup(zipPath);
        
        await notifyOwner({
          title: "Backup Restaurado",
          content: `Backup foi restaurado com sucesso às ${new Date().toLocaleString("pt-BR")}`,
        });

        return result;
      } catch (error) {
        console.error("[System] Restore backup error:", error);
        throw new Error("Falha ao restaurar backup");
      }
    }),

  // Notify owner (protected)
  notifyOwner: protectedProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await notifyOwner(input);
        return { success: result };
      } catch (error) {
        console.error("[System] Notify owner error:", error);
        throw new Error("Falha ao enviar notificação");
      }
    }),
});
