import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  Edit,
  FileText,
  Mail,
  Phone,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const { data: patient, isLoading, refetch } = trpc.patients.getById.useQuery({ id: patientId }, { enabled: patientId > 0 });
  const { data: sessions } = trpc.sessions.list.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: documents, refetch: refetchDocs } = trpc.documents.byPatient.useQuery({ patientId }, { enabled: patientId > 0 });
  const deleteMutation = trpc.patients.delete.useMutation({
    onSuccess: () => { toast.success("Paciente excluído."); navigate("/patients"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Documento excluído."); refetchDocs(); },
    onError: (e) => toast.error(e.message),
  });

  if (patientId === 0 || isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-40 bg-muted rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center text-muted-foreground">Paciente não encontrado.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{patient.name}</h1>
            <p className="text-muted-foreground text-sm">Cadastrado em {new Date(patient.createdAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (confirm("Excluir este paciente?")) deleteMutation.mutate({ id: patientId }); }}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>
        </div>

        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="sessions">Sessões ({sessions?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="documents">Documentos ({documents?.length ?? 0})</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Status" value={<StatusBadge status={patient.status} />} />
                  {patient.email && <InfoRow label="E-mail" value={<span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.email}</span>} />}
                  {patient.phone && <InfoRow label="Telefone" value={<span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{patient.phone}</span>} />}
                  {patient.birthDate && <InfoRow label="Nascimento" value={<span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{patient.birthDate}</span>} />}
                  {patient.cpf && <InfoRow label="CPF" value={patient.cpf} />}
                  {patient.occupation && <InfoRow label="Profissão" value={patient.occupation} />}
                  {patient.sessionValue && (
                    <InfoRow
                      label="Valor/sessão"
                      value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(patient.sessionValue))}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Histórico Clínico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {patient.mainComplaint && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Queixa principal</p>
                      <p className="text-sm">{patient.mainComplaint}</p>
                    </div>
                  )}
                  {patient.medicalHistory && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Histórico médico</p>
                      <p className="text-sm">{patient.medicalHistory}</p>
                    </div>
                  )}
                  {patient.medications && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Medicamentos</p>
                      <p className="text-sm">{patient.medications}</p>
                    </div>
                  )}
                  {patient.referredBy && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Encaminhado por</p>
                      <p className="text-sm">{patient.referredBy}</p>
                    </div>
                  )}
                  {!patient.mainComplaint && !patient.medicalHistory && !patient.medications && (
                    <p className="text-muted-foreground text-xs">Nenhum histórico clínico registrado.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {patient.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Observações gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{patient.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{sessions?.length ?? 0} sessão(ões) registrada(s)</p>
              <Button size="sm" onClick={() => navigate("/sessions")} className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Nova Sessão
              </Button>
            </div>
            {!sessions?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma sessão registrada para este paciente.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{formatDate(session.scheduledAt)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.sessionType === "individual" ? "Individual" : session.sessionType} •{" "}
                          {session.modality === "online" ? "Online" : "Presencial"} •{" "}
                          {session.durationMinutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={session.isPaid} />
                        <StatusBadge status={session.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">{documents?.length ?? 0} documento(s)</p>
              <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Anexar Documento
              </Button>
            </div>
            {!documents?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum documento anexado.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.category} • {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">Ver</a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Excluir documento?")) deleteDocMutation.mutate({ id: doc.id }); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EditPatientDialog
        patient={patient}
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={() => { setShowEdit(false); refetch(); }}
      />

      <UploadDocumentDialog
        patientId={patientId}
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={() => { setShowUpload(false); refetchDocs(); }}
      />
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function EditPatientDialog({
  patient,
  open,
  onClose,
  onSuccess,
}: {
  patient: { id: number; name: string; email?: string | null; phone?: string | null; birthDate?: string | null; cpf?: string | null; occupation?: string | null; mainComplaint?: string | null; medicalHistory?: string | null; medications?: string | null; notes?: string | null; sessionValue?: string | null; status: string; referredBy?: string | null; };
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: patient.name,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    birthDate: patient.birthDate ?? "",
    cpf: patient.cpf ?? "",
    occupation: patient.occupation ?? "",
    mainComplaint: patient.mainComplaint ?? "",
    medicalHistory: patient.medicalHistory ?? "",
    medications: patient.medications ?? "",
    notes: patient.notes ?? "",
    sessionValue: patient.sessionValue ?? "",
    status: patient.status as "active" | "inactive" | "discharged",
  });

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => { toast.success("Paciente atualizado!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  // Autosave com sincronização em nuvem
  const { status: autoSaveStatus } = useAutoSave(
    form,
    async (data) => {
      // Não salvar se os dados não mudaram do paciente original
      if (JSON.stringify(data) === JSON.stringify({
        name: patient.name,
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        birthDate: patient.birthDate ?? "",
        cpf: patient.cpf ?? "",
        occupation: patient.occupation ?? "",
        mainComplaint: patient.mainComplaint ?? "",
        medicalHistory: patient.medicalHistory ?? "",
        medications: patient.medications ?? "",
        notes: patient.notes ?? "",
        sessionValue: patient.sessionValue ?? "",
        status: patient.status,
      })) return;

      // Salvar automaticamente
      return new Promise((resolve, reject) => {
        updateMutation.mutate({ id: patient.id, ...data }, {
          onSuccess: () => resolve(),
          onError: (e) => reject(e),
        });
      });
    },
    {
      debounceMs: 2000,
      storageKey: `patient-edit-${patient.id}`,
      onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
    }
  );

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: patient.id, ...form }); }} className="space-y-4 pt-2">
          {/* Indicador de autosave */}
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            {autoSaveStatus === "saving" && <span>💾 Salvando...</span>}
            {autoSaveStatus === "saved" && <span>✅ Salvo</span>}
            {autoSaveStatus === "error" && <span>❌ Erro ao salvar</span>}
          </div>
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={set("name")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nascimento</Label>
              <Input type="date" value={form.birthDate} onChange={set("birthDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as "active" | "inactive" | "discharged" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="discharged">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Queixa principal</Label>
            <textarea value={form.mainComplaint} onChange={set("mainComplaint")} className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label>Histórico médico</Label>
            <textarea value={form.medicalHistory} onChange={set("medicalHistory")} className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label>Medicamentos</Label>
            <Input value={form.medications} onChange={set("medications")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor da sessão (R$)</Label>
              <Input value={form.sessionValue} onChange={set("sessionValue")} placeholder="200.00" />
            </div>
            <div className="space-y-1.5">
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={set("cpf")} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentDialog({
  patientId,
  open,
  onClose,
  onSuccess,
}: {
  patientId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<"report" | "exam" | "prescription" | "referral" | "consent" | "other">("other");
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; size: number } | null>(null);

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => { toast.success("Documento enviado!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("Arquivo muito grande (máx. 16MB)"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      setFileData({ base64, mimeType: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileData || !fileName) { toast.error("Selecione um arquivo"); return; }
    uploadMutation.mutate({
      patientId,
      fileName,
      mimeType: fileData.mimeType,
      fileSize: fileData.size,
      category,
      description,
      fileBase64: fileData.base64,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Anexar Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName ? (
              <p className="text-sm font-medium text-primary">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, imagens, Word — máx. 16MB</p>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="report">Laudo</SelectItem>
                <SelectItem value="exam">Exame</SelectItem>
                <SelectItem value="prescription">Receita</SelectItem>
                <SelectItem value="referral">Encaminhamento</SelectItem>
                <SelectItem value="consent">Consentimento</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do documento" />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={uploadMutation.isPending || !fileData}>
              {uploadMutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
