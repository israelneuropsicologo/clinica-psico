import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function AdminEmailAliases() {
  const [newAlias, setNewAlias] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Queries - myAliases retorna array de strings
  const { data: myAliasesData, refetch: refetchMyAliases } =
    trpc.emailAliases.myAliases.useQuery();
  const myAliases = myAliasesData?.aliases || [];

  // Mutations
  const addAliasMutation = trpc.emailAliases.addAlias.useMutation({
    onSuccess: () => {
      setSuccessMessage("✅ Alias adicionado com sucesso!");
      setNewAlias("");
      setIsDialogOpen(false);
      refetchMyAliases();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(`❌ Erro: ${error.message || "Erro ao adicionar alias"}`);
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const removeAliasMutation = trpc.emailAliases.removeAlias.useMutation({
    onSuccess: () => {
      setSuccessMessage("✅ Alias removido com sucesso!");
      refetchMyAliases();
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (error) => {
      setErrorMessage(`❌ Erro: ${error.message || "Erro ao remover alias"}`);
      setTimeout(() => setErrorMessage(""), 3000);
    },
  });

  const handleAddAlias = async () => {
    if (!newAlias.trim()) {
      setErrorMessage("❌ Digite um email válido");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAlias.trim())) {
      setErrorMessage("❌ Email inválido");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Obter userId do contexto (será implementado no backend)
    const currentUserId = 1; // Será substituído por ctx.user.id no backend

    await addAliasMutation.mutateAsync({
      email: newAlias.trim(),
      userId: currentUserId,
    });
  };

  const handleRemoveAlias = async (email: string) => {
    if (confirm(`Tem certeza que deseja remover ${email}?`)) {
      await removeAliasMutation.mutateAsync({
        email,
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Email Aliases</h1>
        <p className="text-gray-600 mt-2">
          Adicione emails alternativos para receber agendamentos e notificações
        </p>
      </div>

      {/* Mensagens de Sucesso/Erro */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{errorMessage}</span>
        </div>
      )}

      {/* Seção de Meus Aliases */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-3">Meus Aliases</h2>
        {myAliases && myAliases.length > 0 ? (
          <div className="space-y-2">
            {myAliases.map((email: string) => (
              <div
                key={email}
                className="bg-white px-3 py-2 rounded border border-blue-100 flex justify-between items-center"
              >
                <span className="text-sm">{email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAlias(email)}
                  disabled={removeAliasMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Nenhum alias configurado ainda</p>
        )}
      </div>

      {/* Botão para Adicionar Alias */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Novo Alias
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Email Alias</DialogTitle>
            <DialogDescription>
              Digite um email alternativo para receber agendamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="exemplo@email.com"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddAlias();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddAlias}
                disabled={addAliasMutation.isPending}
              >
                {addAliasMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Informações Úteis */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">ℹ️ Como Funciona</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Adicione emails alternativos para receber notificações</li>
          <li>• Todos os aliases recebem agendamentos do Chatbot</li>
          <li>• Use para distribuir entre secretária, financeiro, etc</li>
          <li>• Remova aliases que não são mais necessários</li>
        </ul>
      </div>
    </div>
  );
}
