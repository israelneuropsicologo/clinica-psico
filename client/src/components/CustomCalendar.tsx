import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Edit2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Session {
  id: number;
  sessionDate: number;
  sessionTime: string;
  patientName: string;
  sessionType: string;
  notes: string;
  status: string;
}

export default function CustomCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Session>>({});

  const { data: sessions } = trpc.sessions.list.useQuery({ status: "all" });
  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada!");
      setShowEditModal(false);
      setSelectedSession(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Convert UTC timestamp to São Paulo time
  const formatTimeInSaoPaulo = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  // Get sessions for current month
  const monthSessions = useMemo(() => {
    if (!sessions) return {};
    const grouped: Record<number, Session[]> = {};

    sessions.forEach((session: any) => {
      const sessionDate = new Date(session.sessionDate);
      if (
        sessionDate.getFullYear() === currentDate.getFullYear() &&
        sessionDate.getMonth() === currentDate.getMonth()
      ) {
        const day = sessionDate.getDate();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          id: session.id,
          sessionDate: session.sessionDate,
          sessionTime: formatTimeInSaoPaulo(session.sessionDate),
          patientName: session.patientName || "Paciente",
          sessionType: session.sessionType || "Sessão",
          notes: session.notes || "",
          status: session.status || "scheduled",
        });
      }
    });

    return grouped;
  }, [sessions, currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setEditData(session);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedSession) return;
    updateSessionMutation.mutate({
      id: selectedSession.id,
      ...editData,
    });
  };

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day names */}
        {dayNames.map((day) => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for first week */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const daySessions = monthSessions[day] || [];

          return (
            <div
              key={day}
              className="aspect-square border rounded-lg p-2 bg-card hover:bg-accent transition-colors"
            >
              <div className="text-sm font-semibold mb-1">{day}</div>
              <div className="space-y-1 text-xs">
                {daySessions.slice(0, 2).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleEditSession(session)}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 p-1 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <div className="font-semibold truncate">{session.sessionTime}</div>
                    <div className="truncate">{session.patientName}</div>
                  </div>
                ))}
                {daySessions.length > 2 && (
                  <div className="text-muted-foreground text-xs">
                    +{daySessions.length - 2} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sessão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Patient Name */}
            <div>
              <Label htmlFor="patientName">Nome do Paciente</Label>
              <Input
                id="patientName"
                value={editData.patientName || ""}
                onChange={(e) => setEditData({ ...editData, patientName: e.target.value })}
                placeholder="Nome do paciente"
              />
            </div>

            {/* Time */}
            <div>
              <Label htmlFor="sessionTime">Horário</Label>
              <Input
                id="sessionTime"
                type="time"
                value={editData.sessionTime || ""}
                onChange={(e) => setEditData({ ...editData, sessionTime: e.target.value })}
              />
            </div>

            {/* Session Type */}
            <div>
              <Label htmlFor="sessionType">Tipo de Consulta</Label>
              <Select value={editData.sessionType || ""} onValueChange={(value) => setEditData({ ...editData, sessionType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="telefone">Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={editData.notes || ""}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="Observações da sessão"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateSessionMutation.isPending}>
                {updateSessionMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
