import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Download, RotateCcw, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Backups() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const listBackupsMutation = trpc.system.listBackups.useMutation();
  const triggerBackupMutation = trpc.system.triggerBackup.useMutation();
  const restoreBackupMutation = trpc.system.restoreBackup.useMutation();

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página. Apenas administradores podem gerenciar backups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const loadBackups = async () => {
    setLoading(true);
    try {
      const result = await listBackupsMutation.mutateAsync();
      setBackups(result || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar backups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      await triggerBackupMutation.mutateAsync();
      // Show success notification
      console.log("Backup iniciado com sucesso!");
      // Reload backups after a delay
      setTimeout(loadBackups, 2000);
    } catch (error) {
      // Show error notification
      console.error("Falha ao iniciar backup");
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    setRestoring(true);
    try {
      await restoreBackupMutation.mutateAsync({ fileId: selectedBackup.id });
      // Show success notification
      console.log("Backup restaurado com sucesso!");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      // Show error notification
      console.error("Falha ao restaurar backup");
    } finally {
      setRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backups</h1>
        <p className="text-gray-600 mt-2">Gerenciar backups automáticos dos dados da clínica</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações de Backup</CardTitle>
          <CardDescription>Realizar backup manual ou restaurar dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleTriggerBackup} disabled={triggerBackupMutation.isPending}>
              {triggerBackupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fazer Backup Agora
            </Button>
            <Button variant="outline" onClick={loadBackups} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Lista
            </Button>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Os backups são feitos automaticamente todos os dias às 2:00 AM. Você também pode fazer um backup manual a qualquer momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backups Disponíveis</CardTitle>
          <CardDescription>Últimos 30 backups armazenados no Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum backup disponível ainda
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{backup.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(backup.createdTime).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-sm text-gray-500">
                      Tamanho: {(parseInt(backup.size || "0") / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(backup.webViewLink, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setShowRestoreConfirm(true);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauração</DialogTitle>
            <DialogDescription>
              ⚠️ Esta ação irá sobrescrever TODOS os dados atuais com os dados do backup selecionado.
              Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBackup && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedBackup.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedBackup.createdTime).toLocaleString("pt-BR")}
                </p>
              </div>
            )}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowRestoreConfirm(false)}
                disabled={restoring}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Restaurar Backup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
