import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Clock, Plus, User, Video, MapPin } from "lucide-react";
import ExportButton from "@/components/ExportButton";
import PDFExportButton from "@/components/PDFExportButton";
import DashboardLayout from "@/components/DashboardLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Sessions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [, navigate] = useLocation();

  const { data: sessions, isLoading, refetch } = trpc.sessions.list.useQuery({
    status: statusFilter,
  });

  const generatePatientPDFMutation = trpc.reports.generatePatientPDF.useMutation();
  const trpcUtils = trpc.useUtils();
  const deleteMultipleMutation = trpc.sessions.deleteMultiple.useMutation({
    onSuccess: () => {
      toast.success(`${selectedSessions.size} sessão(ões) deletada(s)!`);
      setSelectedSessions(new Set());
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleSessionSelection = (sessionId: number) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSessions.size === sessions?.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(sessions?.map(s => s.id) || []));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedSessions.size === 0) return;
    if (confirm(`Tem certeza que deseja deletar ${selectedSessions.size} sessão(ões)?`)) {
      deleteMultipleMutation.mutate({ ids: Array.from(selectedSessions) });
    }
  };

  const handleExportPatientPDF = async () => {
    const result = await generatePatientPDFMutation.mutateAsync({});
    return result;
  };

  const handleExportSessions = async (format: string) => {
    try {
      const result = await trpcUtils.reports.exportSessions.fetch({
        status: statusFilter,
        format: format as "json" | "csv",
      });
      return result || { content: "", filename: "", mimeType: "" };
    } catch (error) {
      toast.error("Erro ao exportar sessões");
      return { content: "", filename: "", mimeType: "" };
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Sessões</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLoading ? "Carregando..." : `${sessions?.length ?? 0} sessão(ões)`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PDFExportButton
              label="Exportar PDF"
              disabled={!sessions || sessions.length === 0}
              onExportPDF={handleExportPatientPDF}
            />
            <ExportButton
              label="Exportar"
              onExport={(format: string) => handleExportSessions(format)}
            />
            {selectedSessions.size > 0 && (
              <Button 
                onClick={handleDeleteSelected} 
                variant="destructive"
                disabled={deleteMultipleMutation.isPending}
              >
                Deletar Selecionadas ({selectedSessions.size})
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agendar Sessão
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="scheduled">Agendada</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="completed">Realizada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="no_show">Não compareceu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !sessions?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">Nenhuma sessão encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em 'Agendar Sessão' para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sessions && sessions.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedSessions.size === sessions.length && sessions.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedSessions.size > 0 ? `${selectedSessions.size} selecionada(s)` : 'Selecionar todas'}
                </span>
              </div>
            )}
            {sessions.map((session) => (
              <Card
                key={session.id}
                className={`transition-all ${
                  selectedSessions.has(session.id)
                    ? 'border-primary bg-primary/5'
                    : 'cursor-pointer hover:shadow-md hover:border-primary/30'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSessionSelection(session.id);
                        }}
                        className="w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div 
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => navigate(`/sessions/${session.id}`)}
                      >
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div 
                        className="min-w-0 cursor-pointer"
                        onClick={() => navigate(`/sessions/${session.id}`)}
                      >
                        <p className="font-semibold text-sm">{session.patient?.name || `Paciente #${session.patientId}`}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(session.scheduledAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            {session.modality === "online" ? (
                              <><Video className="h-3 w-3" /> Online</>
                            ) : (
                              <><MapPin className="h-3 w-3" /> Presencial</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={session.isPaid} />
                      <StatusBadge status={session.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateSessionDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />
    </DashboardLayout>
  );
}

function CreateSessionDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: patients } = trpc.patients.list.useQuery({});
  const [form, setForm] = useState({
    patientId: "",
    scheduledDate: "",
    scheduledTime: "09:00",
    durationMinutes: "50",
    sessionType: "individual" as "individual" | "couple" | "group" | "evaluation",
    modality: "in_person" as "in_person" | "online",
    sessionValue: "",
    notes: "",
  });

  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => { toast.success("Sessão agendada!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.scheduledDate) return;
    const dateTime = new Date(`${form.scheduledDate}T${form.scheduledTime}:00`);
    createMutation.mutate({
      patientId: parseInt(form.patientId),
      scheduledAt: dateTime.getTime(),
      durationMinutes: parseInt(form.durationMinutes),
      sessionType: form.sessionType,
      modality: form.modality,
      sessionValue: form.sessionValue || undefined,
      notes: form.notes || undefined,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agendar Sessão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Paciente *</Label>
            <Select value={form.patientId} onValueChange={(v) => setForm((p) => ({ ...p, patientId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data *</Label>
              <Input type="date" value={form.scheduledDate} onChange={set("scheduledDate")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Horário *</Label>
              <Input type="time" value={form.scheduledTime} onChange={set("scheduledTime")} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duração (min)</Label>
              <Input type="number" value={form.durationMinutes} onChange={set("durationMinutes")} min="15" max="180" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input value={form.sessionValue} onChange={set("sessionValue")} placeholder="200.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.sessionType} onValueChange={(v) => setForm((p) => ({ ...p, sessionType: v as typeof form.sessionType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="couple">Casal</SelectItem>
                  <SelectItem value="group">Grupo</SelectItem>
                  <SelectItem value="evaluation">Avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Modalidade</Label>
              <Select value={form.modality} onValueChange={(v) => setForm((p) => ({ ...p, modality: v as typeof form.modality }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">Presencial</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Observações sobre a sessão..."
              className="w-full min-h-[60px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
