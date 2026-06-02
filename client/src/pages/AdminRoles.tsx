import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export function AdminRoles() {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Queries
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = trpc.roles.list.useQuery();
  const { data: allPermissions, isLoading: permissionsLoading } = trpc.roles.listAllPermissions.useQuery();
  const { data: rolePermissions, refetch: refetchRolePermissions } = trpc.roles.getPermissions.useQuery(
    { roleId: selectedRoleId! },
    { enabled: !!selectedRoleId }
  );

  // Mutations
  const createRoleMutation = trpc.roles.create.useMutation({
    onSuccess: () => {
      toast.success("Role criada com sucesso!");
      setNewRoleName("");
      setNewRoleDescription("");
      refetchRoles();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteRoleMutation = trpc.roles.delete.useMutation({
    onSuccess: () => {
      toast.success("Role deletada com sucesso!");
      refetchRoles();
      setSelectedRoleId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addPermissionMutation = trpc.roles.addPermission.useMutation({
    onSuccess: () => {
      toast.success("Permission adicionada!");
      refetchRolePermissions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removePermissionMutation = trpc.roles.removePermission.useMutation({
    onSuccess: () => {
      toast.success("Permission removida!");
      refetchRolePermissions();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Nome da role é obrigatório");
      return;
    }
    await createRoleMutation.mutateAsync({
      name: newRoleName,
      description: newRoleDescription,
    });
  };

  const handleTogglePermission = async (permissionId: number, isSelected: boolean) => {
    if (!selectedRoleId) return;

    if (isSelected) {
      await removePermissionMutation.mutateAsync({
        roleId: selectedRoleId,
        permissionId,
      });
    } else {
      await addPermissionMutation.mutateAsync({
        roleId: selectedRoleId,
        permissionId,
      });
    }
  };

  const rolePermissionIds = rolePermissions?.map((p) => p.id) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Roles</h1>
          <p className="text-muted-foreground">Defina roles e permissões para sua clínica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criar Nova Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nova Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome da Role</Label>
              <Input
                placeholder="Ex: Secretária"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição da role..."
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleCreateRole}
              disabled={createRoleMutation.isPending}
              className="w-full"
            >
              {createRoleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Role
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Roles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Roles Existentes</CardTitle>
            <CardDescription>Clique em uma role para gerenciar permissões</CardDescription>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : roles && roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoleId === role.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoleMutation.mutate({ roleId: role.id });
                        }}
                        disabled={deleteRoleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma role criada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gerenciar Permissões */}
      {selectedRoleId && (
        <Card>
          <CardHeader>
            <CardTitle>Permissões da Role</CardTitle>
            <CardDescription>
              Selecione as permissões para a role selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : allPermissions && allPermissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPermissions.map((permission) => {
                  const isSelected = rolePermissionIds.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleTogglePermission(permission.id, isSelected)}
                        disabled={addPermissionMutation.isPending || removePermissionMutation.isPending}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`perm-${permission.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.name}
                        </label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma permission disponível</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
