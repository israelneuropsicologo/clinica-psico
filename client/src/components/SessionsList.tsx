import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Session {
  id: number;
  patient?: { name: string };
  scheduledAt: number;
  sessionType: string;
  notes?: string | null;
  status: string;
}

interface SessionsListProps {
  sessions: Session[];
  onEditSession: (session: Session) => void;
}

export function SessionsList({ sessions, onEditSession }: SessionsListProps) {
  const formatTimeInSaoPaulo = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  const formatDateInSaoPaulo = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma sessão agendada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Próximas Sessões</h3>
      {sessions.map((session) => (
        <Card
          key={session.id}
          className="p-4 cursor-pointer hover:bg-accent transition-colors border-l-4 border-l-blue-500"
          onClick={() => onEditSession(session)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>
                  {formatTimeInSaoPaulo(session.scheduledAt)}{" "}
                  {formatDateInSaoPaulo(session.scheduledAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-semibold">
                  {session.patient?.name || "Paciente"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {session.sessionType} • {session.status}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditSession(session);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
