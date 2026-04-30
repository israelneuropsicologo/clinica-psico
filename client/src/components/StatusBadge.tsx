import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Realizada",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
  active: "Ativo",
  inactive: "Inativo",
  discharged: "Alta",
  pending: "Pendente",
  paid: "Pago",
  overdue: "Em atraso",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        `status-${status}`,
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
