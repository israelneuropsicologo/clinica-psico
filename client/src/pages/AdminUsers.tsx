import { useState } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários Internos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie a equipe interna (secretária, financeiro, etc)
          </p>
        </div>
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
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
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

      <div className="grid grid-cols-3 gap-4">
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
                    <TableCell className="space-x-2">
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            deactivateMutation.mutate({ userId: user.id })
                          }
                          disabled={deactivateMutation.isPending}
                        >
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            activateMutation.mutate({ userId: user.id })
                          }
                          disabled={activateMutation.isPending}
                        >
                          Ativar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          resetPasswordMutation.mutate({ userId: user.id })
                        }
                        disabled={resetPasswordMutation.isPending}
                      >
                        Resetar Senha
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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
                      >
                        Deletar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum usuário interno criado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
