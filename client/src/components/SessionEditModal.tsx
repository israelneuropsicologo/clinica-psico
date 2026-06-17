import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Session {
  id: number;
  patient?: { name: string };
  scheduledAt: number;
  sessionType: string;
  notes?: string | null;
  status: string;
}

interface SessionEditModalProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SessionEditModal({
  session,
  open,
  onOpenChange,
  onSuccess,
}: SessionEditModalProps) {
  const [editData, setEditData] = useState<any>({});
  const trpcUtils = trpc.useUtils();

  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      onOpenChange(false);
      trpcUtils.sessions.list.invalidate();
      onSuccess?.();
    },
    onError: (e) => toast.error(`Erro ao atualizar: ${e.message}`),
  });

  useEffect(() => {
    if (session) {
      const date = new Date(session.scheduledAt);
      
      // Formatar horário em HH:MM para input type="time"
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      setEditData({
        sessionTime: timeStr,
        sessionType: session.sessionType || "individual",
        notes: session.notes || "",
      });
    }
  }, [session, open]);

  const handleSave = () => {
    if (!session) return;

    if (!editData.sessionTime) {
      toast.error("Preencha o horário");
      return;
    }

    // Converter horário de volta para timestamp
    const [hours, minutes] = editData.sessionTime.split(":");
    const newDate = new Date(session.scheduledAt);
    newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    updateSessionMutation.mutate({
      id: session.id,
      scheduledAt: newDate.getTime(),
      sessionType: editData.sessionType,
      notes: editData.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Sessão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente</Label>
            <div className="p-2 bg-muted rounded text-sm">
              {session?.patient?.name || "Paciente"}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTime">Horário</Label>
            <Input
              id="sessionTime"
              type="time"
              value={editData.sessionTime || ""}
              onChange={(e) =>
                setEditData({ ...editData, sessionTime: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionType">Tipo de Sessão</Label>
            <Select
              value={editData.sessionType || "individual"}
              onValueChange={(value) =>
                setEditData({ ...editData, sessionType: value })
              }
            >
              <SelectTrigger id="sessionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="couple">Casal</SelectItem>
                <SelectItem value="family">Família</SelectItem>
                <SelectItem value="group">Grupo</SelectItem>
                <SelectItem value="evaluation">Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações da sessão"
              value={editData.notes || ""}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateSessionMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSessionMutation.isPending}
          >
            {updateSessionMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
