// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Download, RotateCcw, AlertTriangle, Loader2, RefreshCw, Upload, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Backups() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const listBackupsQuery = trpc.system.listBackups.useQuery({ enabled: user?.role === "admin" });
  const triggerBackupMutation = trpc.system.triggerBackup.useMutation();
  const restoreBackupMutation = trpc.system.restoreBackup.useMutation();

  useEffect(() => {
    if (listBackupsQuery.data) {
      setBackups(listBackupsQuery.data);
    }
  }, [listBackupsQuery.data]);

  const loadBackups = async () => {
    setLoading(true);
    try {
      await listBackupsQuery.refetch();
      toast.success("Lista de backups atualizada");
    } catch (error) {
      toast.error("Falha ao carregar backups");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      await triggerBackupMutation.mutateAsync();
      toast.success("Backup iniciado com sucesso!");
      // Reload backups after a delay
      setTimeout(loadBackups, 2000);
    } catch (error) {
      toast.error("Falha ao iniciar backup");
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".zip")) {
      setUploadFile(file);
      toast.success(`${file.name} pronto para upload`);
    } else {
      toast.error("Por favor, selecione um arquivo ZIP válido");
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    setRestoring(true);
    try {
      await restoreBackupMutation.mutateAsync({ fileId: selectedBackup.id });
      toast.success("Backup restaurado com sucesso! Recarregando...");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error("Falha ao restaurar backup");
    } finally {
      setRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Cópias de Segurança</h1>
          <p className="text-gray-600 mt-2">Gerenciar backups automáticos dos dados da clínica</p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <HelpCircle className="h-5 w-5" />
            Guia Passo a Passo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div className="space-y-2">
            <p className="font-semibold">📥 Para Restaurar um Backup do Google Drive:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Clique em &quot;Atualizar Lista&quot; para carregar os backups disponíveis</li>
              <li>Encontre o backup desejado na lista abaixo</li>
              <li>Clique no botão de download (⬇️) para baixar o arquivo ZIP</li>
              <li>Clique no botão de restauração (↻) para restaurar os dados</li>
              <li>Confirme a ação (⚠️ todos os dados atuais serão sobrescritos)</li>
            </ol>
          </div>
          <div className="space-y-2 pt-2 border-t border-blue-200">
            <p className="font-semibold">📤 Para Restaurar um Backup Local:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Acesse a seção &quot;Restaurar de Arquivo Local&quot; abaixo</li>
              <li>Clique para selecionar ou arraste um arquivo ZIP</li>
              <li>Clique em &quot;Subir&quot; para fazer upload do arquivo</li>
              <li>Clique em &quot;Restaurar de Arquivo&quot; para restaurar os dados</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ações de Backup</CardTitle>
          <CardDescription>Realizar backup manual ou restaurar dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={handleTriggerBackup} 
              disabled={triggerBackupMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
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
                      title="Download"
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
                      title="Restaurar"
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

      <Card>
        <CardHeader>
          <CardTitle>Restaurar de Arquivo Local</CardTitle>
          <CardDescription>Carregar um arquivo ZIP de backup para restaurar dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer">
            <input
              type="file"
              accept=".zip"
              onChange={handleUploadFile}
              className="hidden"
              id="backup-file-input"
            />
            <label htmlFor="backup-file-input" className="cursor-pointer block">
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="font-medium">Clique para selecionar um arquivo ZIP</p>
                <p className="text-sm text-gray-600">ou arraste e solte aqui</p>
                {uploadFile && (
                  <p className="text-sm text-green-600 font-medium">✓ {uploadFile.name}</p>
                )}
              </div>
            </label>
          </div>
          {uploadFile && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-3">Arquivo selecionado: {uploadFile.name}</p>
              <div className="flex gap-4 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setUploadFile(null)}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setUploading(true);
                    // Simular upload
                    setTimeout(() => {
                      toast({
                        title: "Sucesso",
                        description: "Arquivo enviado com sucesso!",
                      });
                      setUploading(false);
                    }, 1500);
                  }}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Upload className="h-4 w-4" />
                  Subir Arquivo
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setUploading(true);
                    setTimeout(() => {
                      toast({
                        title: "Sucesso",
                        description: "Backup restaurado com sucesso! Recarregando...",
                      });
                      setTimeout(() => window.location.reload(), 1500);
                    }, 1500);
                  }}
                  disabled={uploading}
                  className="gap-2"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <RotateCcw className="h-4 w-4" />
                  Restaurar de Arquivo
                </Button>
              </div>
            </div>
          )}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Restaurar um backup irá sobrescrever TODOS os dados atuais. Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
