import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GoogleCalendarEmbed } from "@/components/GoogleCalendarEmbed";
import { Plus, Clock, User, Edit2 } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Calendar() {
  const [, navigate] = useLocation();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<any>({});

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

  const formatDateInSaoPaulo = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      timeZone: "America/Sao_Paulo",
    }).format(date);
  };

  const handleEditSession = (session: any) => {
    setSelectedSession(session);
    setEditData({
      patientName: session.patient?.name || "",
      sessionTime: formatTimeInSaoPaulo(session.scheduledAt),
      sessionType: session.sessionType || "individual",
      notes: session.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!selectedSession) return;
    updateSessionMutation.mutate({
      id: selectedSession.id,
      ...editData,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Google Calendar integrado - Suas sessões sincronizadas automaticamente
            </p>
          </div>
          <Button onClick={() => navigate("/sessions")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              ✅ <strong>Google Calendar integrado!</strong> Todas as sessões agendadas no Google Calendar aparecem automaticamente no sistema. Você pode gerenciar tudo diretamente no Google Calendar e as mudanças sincronizam em tempo real.
            </p>
          </CardContent>
        </Card>

        {/* Google Calendar Embed */}
        <GoogleCalendarEmbed calendarId="israelneuropsicologo@gmail.com" height="700px" />

        {/* Sessions List Below Calendar */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Próximas Sessões</h2>
          <div className="space-y-2">
            {sessions && sessions.length > 0 ? (
              sessions.slice(0, 10).map((session: any) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleEditSession(session)}
                >
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatTimeInSaoPaulo(session.scheduledAt)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateInSaoPaulo(session.scheduledAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{session.patient?.name || "Paciente"}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.sessionType}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSession(session);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma sessão agendada
                </CardContent>
              </Card>
            )}
          </div>
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
                <Label htmlFor="sessionType">Tipo de Sessão</Label>
                <Select value={editData.sessionType || ""} onValueChange={(value) => setEditData({ ...editData, sessionType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="couple">Casal</SelectItem>
                    <SelectItem value="group">Grupo</SelectItem>
                    <SelectItem value="evaluation">Avaliação</SelectItem>
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
    </DashboardLayout>
  );
}
