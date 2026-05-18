/**
 * Admin Panel Page
 * Comprehensive administration dashboard for system management
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BarChart3, Settings, Users, Database, Activity, Shield, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function AdminPanel() {
  const { data: user } = trpc.auth.me.useQuery();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Você não tem permissão para acessar o painel administrativo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2">Gerenciamento centralizado do sistema Clínica App</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessões Realizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5,678</div>
                <p className="text-xs text-muted-foreground">+8% em relação ao mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Análises de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">17,034</div>
                <p className="text-xs text-muted-foreground">Confiança média: 87%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">23</div>
                <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>Saúde dos componentes principais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Banco de Dados</span>
                <Badge className="bg-green-600">Operacional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API</span>
                <Badge className="bg-green-600">Operacional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Autenticação</span>
                <Badge className="bg-green-600">Operacional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Criptografia</span>
                <Badge className="bg-green-600">Operacional</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie todos os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">1,234</div>
                      <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">156</div>
                      <p className="text-sm text-muted-foreground">Usuários Inativos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">1</div>
                      <p className="text-sm text-muted-foreground">Administradores</p>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full">Adicionar Novo Usuário</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Personalize o comportamento do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Aplicação</label>
                <input type="text" defaultValue="Clínica App" className="w-full rounded border px-3 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fuso Horário</label>
                <select className="w-full rounded border px-3 py-2">
                  <option>America/Sao_Paulo (GMT-3)</option>
                  <option>America/New_York (GMT-5)</option>
                  <option>Europe/London (GMT+0)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Idioma</label>
                <select className="w-full rounded border px-3 py-2">
                  <option>Português (Brasil)</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
              <Button className="w-full">Salvar Configurações</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de IA</CardTitle>
              <CardDescription>Ajuste os modelos e parâmetros de IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Análise de Sentimento</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Detecção de Risco</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recomendações</span>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Limiar de Confiança Mínimo</label>
                <input type="number" min="0" max="1" step="0.1" defaultValue="0.7" className="w-full rounded border px-3 py-2" />
              </div>
              <Button className="w-full">Salvar Configurações de IA</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança e Conformidade</CardTitle>
              <CardDescription>Gerencie políticas de segurança e conformidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">Criptografia de Dados</p>
                    <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                  </div>
                  <Badge className="bg-green-600">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">Auditoria de Acesso</p>
                    <p className="text-xs text-muted-foreground">Todos os eventos registrados</p>
                  </div>
                  <Badge className="bg-green-600">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">Autenticação de Dois Fatores</p>
                    <p className="text-xs text-muted-foreground">Opcional para usuários</p>
                  </div>
                  <Badge variant="outline">Inativo</Badge>
                </div>
              </div>
              <Button className="w-full">Exportar Logs de Auditoria</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>Detalhes técnicos e de infraestrutura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ambiente</span>
                <span className="font-medium">Production</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">99.95%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Última Atualização</span>
                <span className="font-medium">2026-05-18</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup e Recuperação</CardTitle>
              <CardDescription>Gerencie backups do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium">Último Backup</p>
                <p className="text-xs text-muted-foreground">17 de maio de 2026 às 03:00 UTC</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Fazer Backup Agora</Button>
                <Button variant="outline" className="flex-1">
                  Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPanel;
