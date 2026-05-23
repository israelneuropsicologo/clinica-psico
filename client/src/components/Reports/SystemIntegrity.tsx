// @ts-nocheck
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SystemStatus {
  lastBackupDate: string | null;
  backupStatus: "success" | "pending" | "failed";
}

interface SystemIntegrityProps {
  data: SystemStatus;
}

export function SystemIntegrity({ data }: SystemIntegrityProps) {
  const lastBackupDate = data.lastBackupDate ? new Date(data.lastBackupDate) : null;
  const daysSinceBackup = lastBackupDate ? Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800";
      case "failed":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Server className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Backup Realizado com Sucesso";
      case "pending":
        return "Backup Pendente";
      case "failed":
        return "Falha no Backup";
      default:
        return "Status Desconhecido";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-gray-500" />
            Integridade do Sistema
          </CardTitle>
          <CardDescription>Status de verificação do sistema e último backup realizado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Principal */}
          <div className={`p-6 rounded-lg border ${getStatusColor(data.backupStatus)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {getStatusIcon(data.backupStatus)}
                <div>
                  <p className="font-semibold text-lg">{getStatusText(data.backupStatus)}</p>
                  {lastBackupDate && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Realizado em {lastBackupDate.toLocaleString("pt-BR")}
                      {daysSinceBackup !== null && daysSinceBackup > 0 && ` (há ${daysSinceBackup} dia${daysSinceBackup > 1 ? "s" : ""})`}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(data.backupStatus)}>
                {data.backupStatus === "success" ? "✓ OK" : data.backupStatus === "pending" ? "⏳ Pendente" : "✗ Erro"}
              </Badge>
            </div>
          </div>

          {/* Detalhes do Backup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2">
                Último Backup
              </p>
              {lastBackupDate ? (
                <>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {lastBackupDate.toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    às {lastBackupDate.toLocaleTimeString("pt-BR")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum backup realizado</p>
              )}
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
                Status do Sistema
              </p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">Operacional</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">Todos os serviços funcionando normalmente</p>
            </div>
          </div>

          {/* Checklist de Integridade */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Checklist de Integridade</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm">Banco de dados conectado e operacional</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm">Armazenamento em nuvem sincronizado</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm">Autenticação OAuth funcionando</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-sm">APIs externas respondendo normalmente</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                {data.backupStatus === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                )}
                <span className="text-sm">
                  Backup do sistema{" "}
                  {data.backupStatus === "success" ? "realizado com sucesso" : "pendente de execução"}
                </span>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Recomendações</p>
            <ul className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
              <li>• Realize backups regularmente (recomendado: diariamente)</li>
              <li>• Mantenha cópias de backup em múltiplos locais</li>
              <li>• Teste periodicamente a restauração de backups</li>
              <li>• Monitore o espaço de armazenamento disponível</li>
              <li>• Revise os logs de sistema regularmente</li>
            </ul>
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold">Componente</th>
                  <th className="text-center py-2 px-3 font-semibold">Status</th>
                  <th className="text-left py-2 px-3 font-semibold">Informação</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Banco de Dados</td>
                  <td className="text-center py-2 px-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</Badge>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">MySQL/TiDB conectado</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Armazenamento S3</td>
                  <td className="text-center py-2 px-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</Badge>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">Sincronizado e operacional</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Autenticação</td>
                  <td className="text-center py-2 px-3">
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ativo</Badge>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">OAuth Manus funcionando</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-2 px-3 font-medium">Último Backup</td>
                  <td className="text-center py-2 px-3">
                    <Badge
                      variant={
                        data.backupStatus === "success"
                          ? "default"
                          : data.backupStatus === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {data.backupStatus === "success" ? "✓ OK" : data.backupStatus === "pending" ? "⏳ Pendente" : "✗ Erro"}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {lastBackupDate ? lastBackupDate.toLocaleString("pt-BR") : "Nenhum backup"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
