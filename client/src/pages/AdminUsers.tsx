import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, MoreHorizontal, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatDateSaoPaulo } from "@/lib/timezone";

import DashboardLayout from "@/components/DashboardLayout";

export default function AdminUsers() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("1");
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState<{ email: string; password: string } | null>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Módulos do menu (mesmo que no sidebar)
  const modules = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "pacientes", label: "Pacientes", path: "/patients" },
    { id: "leads", label: "Leads", path: "/leads" },
    { id: "agendamentos", label: "Agendamentos Diretos", path: "/direct-bookings" },
    { id: "sessoes", label: "Sessões", path: "/sessions" },
    { id: "agenda", label: "Agenda", path: "/calendar" },
    { id: "pistas", label: "Pistas de IA", path: "/pistas" },
    { id: "ia", label: "Dashboard de IA", path: "/ai-analytics" },
    { id: "financeiro", label: "Financeiro", path: "/financial" },
    { id: "documentos", label: "Documentos", path: "/documents" },
    { id: "configuracoes", label: "Configurações", path: "/settings" },
    { id: "integracao", label: "Integração", path: "/webhooks" },
    { id: "backups", label: "Backups", path: "/backups" },
    { id: "relatorios", label: "Relatórios Gerenciais", path: "/admin/reports" },
  ];

  // Presets de roles
  const rolePresets: Record<number, string[]> = {
    1: ["dashboard", "pacientes", "sessoes", "agenda", "documentos"], // Secretária
    2: ["dashboard", "financeiro", "relatorios"], // Financeiro
    3: ["dashboard", "leads", "agendamentos"], // Marketing
    4: ["dashboard", "pacientes", "sessoes"], // Assistente
  };

  const { data: users, isLoading, refetch } = trpc.internalUsers.list.useQuery();
  const { data: activeCount } = trpc.internalUsers.countActive.useQuery();

  const createUserMutation = trpc.internalAuth.createUser.useMutation({
    onSuccess: () => {
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserRoleId("1");
      setIsCreateDialogOpen(false);
      refetch();
    },
  });

  const deactivateMutation = trpc.internalUsers.deactivate.useMutation({
    onSuccess: () => refetch(),
  });

  const activateMutation = trpc.internalUsers.activate.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.internalUsers.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const resetPasswordMutation = trpc.internalUsers.resetPassword.useMutation({
    onSuccess: (data, variables) => {
      const user = users?.find(u => u.id === variables.userId);
      if (user) {
        setResetPasswordData({ email: user.email, password: data.newPassword });
        setShowResetPasswordDialog(true);
      }
    },
  });

  const handleOpenPermissionsDialog = (user: any) => {
    setSelectedUserForPermissions(user);
    // Usar preset da role ou lista vazia
    setSelectedModules(rolePresets[user.roleId] || []);
    setShowPermissionsDialog(true);
  };

  const sendLoginEmailMutation = trpc.internalAuth.sendLoginEmail.useMutation({
    onSuccess: () => {
      alert("✅ Email enviado com sucesso! O link de login foi enviado para o usuário.");
    },
    onError: (error: any) => {
      alert(`❌ Erro ao enviar email: ${error.message || "Tente novamente mais tarde."}`);
    },
  });

  const handleSendLoginEmail = (user: any) => {
    const loginUrl = `${window.location.origin}/internal-login`;
    // Gerar senha com apenas números (6 dígitos)
    const password = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    sendLoginEmailMutation.mutate({
      email: user.email,
      name: user.name,
      password,
      loginUrl,
    });
  };

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: newUserEmail,
        password: newUserPassword,
        name: newUserName,
        clinicId: 2, // TODO: Obter clinicId do contexto
        roleId: parseInt(newUserRoleId),
      });
      
      // Mostrar senha em um Dialog bonito
      setGeneratedPassword(newUserPassword);
      setShowPasswordAlert(true);
    } catch (error: any) {
      alert(error.message || "Erro ao criar usuário");
    }
  };

  const handleClosePasswordAlert = () => {
    setShowPasswordAlert(false);
    setGeneratedPassword("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserName("");
    setNewUserRoleId("1");
    setIsCreateDialogOpen(false);
    refetch();
  };



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="px-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários Internos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie a equipe interna (secretária, financeiro, etc)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>+ Novo Usuário</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo membro da equipe ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Função</label>
                <select
                  value={newUserRoleId}
                  onChange={(e) => setNewUserRoleId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="1">Secretária</option>
                  <option value="2">Financeiro</option>
                  <option value="3">Marketing</option>
                  <option value="4">Assistente</option>
                </select>
              </div>
              <Button
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
                className="w-full"
              >
                {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount?.count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users ? users.filter((u) => !u.isActive).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para mostrar senha com formatação bonita */}
      <Dialog open={showPasswordAlert} onOpenChange={setShowPasswordAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Usuário Criado com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                O usuário foi criado e está pronto para usar.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Dados de Acesso:</p>
              <div className="bg-gray-100 p-4 rounded-lg space-y-3 border border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email:</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{newUserEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Senha:</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{generatedPassword}</p>
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                ⚠️ Guarde esta senha com segurança. Ela não será mostrada novamente.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleClosePasswordAlert}
              className="w-full"
            >
              Entendi, Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para mostrar nova senha após reset */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Senha Resetada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A senha foi resetada e está pronta para usar.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Nova Senha:</p>
              <div className="bg-gray-100 p-4 rounded-lg space-y-3 border border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email:</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{resetPasswordData?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Senha:</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{resetPasswordData?.password}</p>
                </div>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                ⚠️ Guarde esta senha com segurança. Ela não será mostrada novamente.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => setShowResetPasswordDialog(false)}
              className="w-full"
            >
              Entendi, Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Todos os usuários internos da clínica</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.roleId === 1 && "Secretária"}
                      {user.roleId === 2 && "Financeiro"}
                      {user.roleId === 3 && "Marketing"}
                      {user.roleId === 4 && "Assistente"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? formatDateSaoPaulo(typeof user.lastLogin === 'string' ? new Date(user.lastLogin).getTime() : (user.lastLogin instanceof Date ? user.lastLogin.getTime() : user.lastLogin))
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.isActive ? (
                            <DropdownMenuItem
                              onClick={() =>
                                deactivateMutation.mutate({ userId: user.id })
                              }
                              disabled={deactivateMutation.isPending}
                            >
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                activateMutation.mutate({ userId: user.id })
                              }
                              disabled={activateMutation.isPending}
                            >
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              resetPasswordMutation.mutate({ userId: user.id })
                            }
                            disabled={resetPasswordMutation.isPending}
                          >
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenPermissionsDialog(user)}
                          >
                            Editar Permissões
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleSendLoginEmail(user)}
                          >
                            Enviar Link de Login
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              if (
                                confirm(
                                  "Tem certeza que deseja deletar este usuário?"
                                )
                              ) {
                                deleteMutation.mutate({ userId: user.id });
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-destructive"
                          >
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário interno criado ainda
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar permissões */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Editar Permissões - {selectedUserForPermissions?.name}
            </DialogTitle>
            <DialogDescription>
              Selecione quais módulos este usuário pode acessar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <Checkbox
                    id={`module-${module.id}`}
                    checked={selectedModules.includes(module.id)}
                    onCheckedChange={() => handleToggleModule(module.id)}
                  />
                  <label
                    htmlFor={`module-${module.id}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {module.label}
                  </label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPermissionsDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // TODO: Salvar permissões no backend
                  setShowPermissionsDialog(false);
                }}
              >
                Salvar Permissões
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
