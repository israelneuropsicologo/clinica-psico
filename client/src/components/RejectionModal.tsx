// @ts-nocheck
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectionModalProps {
  open: boolean;
  patientName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
}

export function RejectionModal({
  open,
  patientName,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Recusar Agendamento",
  description,
  placeholder = "Ex: Horário indisponível, especialidade não atendida, paciente já atendido, etc.",
}: RejectionModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }
    onConfirm(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || (
              <>
                Você está recusando o agendamento de <strong>{patientName}</strong>. Por favor, indique o motivo.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Motivo da Recusa</Label>
            <Textarea
              id="rejection-reason"
              placeholder={placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-24"
              disabled={isLoading}
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Nota:</strong> O motivo será arquivado no histórico do paciente para referência futura.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? "Recusando..." : "Recusar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
