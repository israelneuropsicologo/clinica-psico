import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  Heart,
  Loader2,
  Mail,
  Mic,
  Phone,
  Play,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-xs shrink-0 pt-0.5">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showRecordingUpload, setShowRecordingUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const { data: patient, isLoading, refetch } = trpc.patients.getById.useQuery({ id: patientId }, { enabled: patientId > 0 });
  const { data: patientSessions } = trpc.sessions.list.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: documents, refetch: refetchDocs } = trpc.documents.byPatient.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: clinicalNotes } = trpc.clinicalNotes.byPatient.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: anamneseData, refetch: refetchAnamnese } = trpc.anamnese.get.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: recordings, refetch: refetchRecordings } = trpc.recordings.list.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: timelineList, refetch: refetchTimeline } = trpc.timeline.list.useQuery({ patientId }, { enabled: patientId > 0 });

  const deleteMutation = trpc.patients.delete.useMutation({
    onSuccess: () => { toast.success("Paciente excluído."); navigate("/patients"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Documento excluído."); refetchDocs(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRecordingMutation = trpc.recordings.delete.useMutation({
    onSuccess: () => { toast.success("Gravação excluída."); refetchRecordings(); },
    onError: (e) => toast.error(e.message),
  });
  const transcribeMutation = trpc.recordings.transcribe.useMutation({
    onSuccess: () => { toast.success("Transcrição concluída!"); refetchRecordings(); },
    onError: (e) => toast.error(e.message),
  });
  const generateTimelineMutation = trpc.timeline.generate.useMutation({
    onSuccess: () => { toast.success("Análise gerada com sucesso!"); refetchTimeline(); },
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

  const latestTimeline = timelineList?.[0];
  let timelineData: Record<string, unknown> | null = null;
  if (latestTimeline?.content) {
    try { timelineData = JSON.parse(latestTimeline.content); } catch { /* ignore */ }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold truncate">{patient.name}</h1>
            <p className="text-muted-foreground text-xs">
              Cadastrado em {new Date(patient.createdAt).toLocaleDateString("pt-BR")} •{" "}
              {patientSessions?.length ?? 0} sessão(ões)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { if (confirm("Excluir este paciente?")) deleteMutation.mutate({ id: patientId }); }}
              className="gap-1.5 hidden md:flex"
            >
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={patient.status} />
          {patient.leadStatus && <StatusBadge status={patient.leadStatus} />}
          {patient.sessionValue && (
            <Badge variant="outline" className="text-xs">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(patient.sessionValue))}/sessão
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="mb-4 flex w-max min-w-full gap-0.5">
              <TabsTrigger value="profile" className="gap-1.5 text-xs px-3"><User className="h-3.5 w-3.5" />Perfil</TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 text-xs px-3"><Phone className="h-3.5 w-3.5" />Contato</TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5 text-xs px-3"><Heart className="h-3.5 w-3.5" />Saúde</TabsTrigger>
              <TabsTrigger value="anamnese" className="gap-1.5 text-xs px-3"><FileText className="h-3.5 w-3.5" />Anamnese</TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-xs px-3"><Brain className="h-3.5 w-3.5" />Prontuário</TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5 text-xs px-3"><Upload className="h-3.5 w-3.5" />Documentos</TabsTrigger>
              <TabsTrigger value="recordings" className="gap-1.5 text-xs px-3"><Mic className="h-3.5 w-3.5" />Gravações</TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5 text-xs px-3"><TrendingUp className="h-3.5 w-3.5" />Linha do Tempo</TabsTrigger>
            </TabsList>
          </div>

          {/* ── PERFIL ── */}
          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Dados Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 text-sm">
                  <InfoRow label="Nome completo" value={patient.name} />
                  {patient.birthDate && <InfoRow label="Data de nascimento" value={patient.birthDate} />}
                  {patient.cpf && <InfoRow label="CPF" value={patient.cpf} />}
                  {patient.occupation && <InfoRow label="Profissão" value={patient.occupation} />}
                  {patient.referredBy && <InfoRow label="Encaminhado por" value={patient.referredBy} />}
                  <InfoRow label="Status" value={<StatusBadge status={patient.status} />} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Resumo Clínico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 text-sm">
                  <InfoRow label="Total de sessões" value={patientSessions?.length ?? 0} />
                  <InfoRow label="Prontuários" value={clinicalNotes?.length ?? 0} />
                  <InfoRow label="Documentos" value={documents?.length ?? 0} />
                  <InfoRow label="Gravações" value={recordings?.length ?? 0} />
                  {patient.sessionValue && (
                    <InfoRow label="Valor/sessão" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(patient.sessionValue))} />
                  )}
                </CardContent>
              </Card>
            </div>
            {patient.mainComplaint && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Queixa Principal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{patient.mainComplaint}</p>
                </CardContent>
              </Card>
            )}
            {patient.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Observações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{patient.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── CONTATO ── */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 text-sm">
                {patient.email ? (
                  <InfoRow label="E-mail" value={<a href={`mailto:${patient.email}`} className="text-primary hover:underline flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{patient.email}</a>} />
                ) : <InfoRow label="E-mail" value={<span className="text-muted-foreground text-xs">Não informado</span>} />}
                {patient.phone ? (
                  <InfoRow label="Telefone" value={<a href={`tel:${patient.phone}`} className="text-primary hover:underline flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{patient.phone}</a>} />
                ) : <InfoRow label="Telefone" value={<span className="text-muted-foreground text-xs">Não informado</span>} />}
                {patient.address ? (
                  <InfoRow label="Endereço" value={patient.address} />
                ) : <InfoRow label="Endereço" value={<span className="text-muted-foreground text-xs">Não informado</span>} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Contato de Emergência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 text-sm">
                {patient.emergencyContact ? (
                  <InfoRow label="Nome" value={patient.emergencyContact} />
                ) : <InfoRow label="Nome" value={<span className="text-muted-foreground text-xs">Não informado</span>} />}
                {patient.emergencyPhone ? (
                  <InfoRow label="Telefone" value={<a href={`tel:${patient.emergencyPhone}`} className="text-primary hover:underline">{patient.emergencyPhone}</a>} />
                ) : <InfoRow label="Telefone" value={<span className="text-muted-foreground text-xs">Não informado</span>} />}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" /> Editar Contato
              </Button>
            </div>
          </TabsContent>

          {/* ── SAÚDE ── */}
          <TabsContent value="health" className="space-y-4">
            <AnamneseHealthTab patientId={patientId} anamneseData={anamneseData} refetch={refetchAnamnese} healthOnly />
          </TabsContent>

          {/* ── ANAMNESE ── */}
          <TabsContent value="anamnese" className="space-y-4">
            <AnamneseHealthTab patientId={patientId} anamneseData={anamneseData} refetch={refetchAnamnese} healthOnly={false} />
          </TabsContent>

          {/* ── PRONTUÁRIO ── */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{clinicalNotes?.length ?? 0} prontuário(s) registrado(s)</p>
              <Button size="sm" onClick={() => navigate("/sessions")} className="gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Nova Sessão
              </Button>
            </div>
            {!clinicalNotes?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Brain className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum prontuário registrado ainda.</p>
                  <p className="text-xs mt-1">Prontuários são criados durante as sessões.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {clinicalNotes.map((note) => (
                  <Card key={note.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/sessions/${note.sessionId}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-medium">{new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                          {note.progressRating && (
                            <Badge variant="outline" className="text-xs mt-1">Progresso: {note.progressRating}/10</Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      </div>
                      {note.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, " ").substring(0, 200) }} />
                      )}
                      {note.goals && (
                        <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Objetivos:</span> {note.goals.substring(0, 100)}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── DOCUMENTOS ── */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center">
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
                  <p className="text-xs mt-1">Anexe laudos, exames, receitas e outros documentos.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.category === "report" ? "Laudo" : doc.category === "exam" ? "Exame" : doc.category === "prescription" ? "Receita" : doc.category === "referral" ? "Encaminhamento" : doc.category === "consent" ? "Consentimento" : "Outro"} •{" "}
                            {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
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

          {/* ── GRAVAÇÕES ── */}
          <TabsContent value="recordings" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{recordings?.length ?? 0} gravação(ões)</p>
              <Button size="sm" onClick={() => setShowRecordingUpload(true)} className="gap-1.5">
                <Mic className="h-3.5 w-3.5" /> Adicionar Gravação
              </Button>
            </div>
            {!recordings?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Mic className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma gravação registrada.</p>
                  <p className="text-xs mt-1">Faça upload de áudios das sessões para transcrição automática.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recordings.map((rec) => (
                  <Card key={rec.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Mic className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{rec.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rec.createdAt).toLocaleDateString("pt-BR")} •{" "}
                              {rec.transcriptionStatus === "done" ? (
                                <span className="text-green-600">Transcrito</span>
                              ) : rec.transcriptionStatus === "processing" ? (
                                <span className="text-yellow-600">Transcrevendo...</span>
                              ) : rec.transcriptionStatus === "error" ? (
                                <span className="text-red-600">Erro na transcrição</span>
                              ) : (
                                <span>Aguardando transcrição</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <a href={rec.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Play className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          {rec.transcriptionStatus !== "done" && rec.transcriptionStatus !== "processing" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => transcribeMutation.mutate({ recordingId: rec.id })}
                              disabled={transcribeMutation.isPending}
                              className="gap-1.5"
                            >
                              {transcribeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                              Transcrever
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("Excluir gravação?")) deleteRecordingMutation.mutate({ recordingId: rec.id }); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {rec.transcription && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Transcrição</p>
                          <p className="text-xs leading-relaxed">{rec.transcription}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── LINHA DO TEMPO ── */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Análise Clínica por IA</h3>
                <p className="text-xs text-muted-foreground">Baseada em {patientSessions?.length ?? 0} sessão(ões) registrada(s)</p>
              </div>
              <Button
                size="sm"
                onClick={() => generateTimelineMutation.mutate({ patientId })}
                disabled={generateTimelineMutation.isPending}
                className="gap-1.5"
              >
                {generateTimelineMutation.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando...</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> {timelineData ? "Nova Análise" : "Gerar Análise"}</>
                )}
              </Button>
            </div>

            {!timelineData && !generateTimelineMutation.isPending ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Nenhuma análise gerada ainda</p>
                  <p className="text-xs mt-1 max-w-xs mx-auto">Clique em "Gerar Análise" para que a IA analise o histórico clínico completo do paciente.</p>
                </CardContent>
              </Card>
            ) : generateTimelineMutation.isPending ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-sm font-medium">Analisando histórico clínico...</p>
                  <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos.</p>
                </CardContent>
              </Card>
            ) : timelineData ? (
              <TimelineDisplay data={timelineData} sessionCount={latestTimeline?.sessionCount ?? 0} createdAt={latestTimeline?.createdAt} />
            ) : null}
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

      <UploadRecordingDialog
        patientId={patientId}
        open={showRecordingUpload}
        onClose={() => setShowRecordingUpload(false)}
        onSuccess={() => { setShowRecordingUpload(false); refetchRecordings(); }}
      />
    </DashboardLayout>
  );
}

// ── Anamnese + Health Tab ────────────────────────────────────────────────────
function AnamneseHealthTab({
  patientId,
  anamneseData,
  refetch,
  healthOnly,
}: {
  patientId: number;
  anamneseData: Record<string, unknown> | null | undefined;
  refetch: () => void;
  healthOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bloodType: (anamneseData?.bloodType as string) ?? "",
    allergies: (anamneseData?.allergies as string) ?? "",
    chronicConditions: (anamneseData?.chronicConditions as string) ?? "",
    disabilities: (anamneseData?.disabilities as string) ?? "",
    mainComplaintDetail: (anamneseData?.mainComplaintDetail as string) ?? "",
    familyHistory: (anamneseData?.familyHistory as string) ?? "",
    personalHistory: (anamneseData?.personalHistory as string) ?? "",
    previousTreatments: (anamneseData?.previousTreatments as string) ?? "",
    therapeuticGoals: (anamneseData?.therapeuticGoals as string) ?? "",
    cidCode: (anamneseData?.cidCode as string) ?? "",
    therapeuticApproach: (anamneseData?.therapeuticApproach as string) ?? "",
    riskFactors: (anamneseData?.riskFactors as string) ?? "",
    protectiveFactors: (anamneseData?.protectiveFactors as string) ?? "",
    additionalNotes: (anamneseData?.additionalNotes as string) ?? "",
  });

  const upsertMutation = trpc.anamnese.upsert.useMutation({
    onSuccess: () => { toast.success("Dados salvos!"); setEditing(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const TextArea = ({ field, label, rows = 3 }: { field: string; label: string; rows?: number }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {editing ? (
        <textarea
          value={form[field as keyof typeof form]}
          onChange={set(field)}
          rows={rows}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ) : (
        <p className="text-sm text-muted-foreground min-h-[2rem]">
          {form[field as keyof typeof form] || <span className="italic text-xs">Não informado</span>}
        </p>
      )}
    </div>
  );

  if (healthOnly) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Informações de Saúde</h3>
          <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="gap-1.5">
            <Edit className="h-3.5 w-3.5" /> {editing ? "Cancelar" : "Editar"}
          </Button>
        </div>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo Sanguíneo</Label>
                {editing ? (
                  <Select value={form.bloodType} onValueChange={(v) => setForm((p) => ({ ...p, bloodType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">{form.bloodType || <span className="italic text-xs">Não informado</span>}</p>
                )}
              </div>
            </div>
            <TextArea field="allergies" label="Alergias" />
            <TextArea field="chronicConditions" label="Condições Crônicas / Histórico Médico" />
            <TextArea field="disabilities" label="Deficiências / Necessidades Especiais" />
          </CardContent>
        </Card>
        {editing && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={() => upsertMutation.mutate({ patientId, ...form })} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Ficha de Anamnese</h3>
        <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="gap-1.5">
          <Edit className="h-3.5 w-3.5" /> {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Queixa e Objetivos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TextArea field="mainComplaintDetail" label="Queixa Principal Detalhada" rows={4} />
            <TextArea field="therapeuticGoals" label="Objetivos Terapêuticos" rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">CID-10 / CID-11</Label>
                {editing ? <Input value={form.cidCode} onChange={set("cidCode")} placeholder="Ex: F41.1" /> : <p className="text-sm text-muted-foreground">{form.cidCode || <span className="italic text-xs">Não informado</span>}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Abordagem Terapêutica</Label>
                {editing ? <Input value={form.therapeuticApproach} onChange={set("therapeuticApproach")} placeholder="Ex: TCC, Psicanálise..." /> : <p className="text-sm text-muted-foreground">{form.therapeuticApproach || <span className="italic text-xs">Não informado</span>}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TextArea field="familyHistory" label="Histórico Familiar" rows={3} />
            <TextArea field="personalHistory" label="Histórico Pessoal" rows={3} />
            <TextArea field="previousTreatments" label="Tratamentos Anteriores" rows={2} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fatores de Risco e Proteção</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <TextArea field="riskFactors" label="Fatores de Risco" rows={3} />
            <TextArea field="protectiveFactors" label="Fatores Protetivos" rows={3} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações Adicionais</CardTitle></CardHeader>
          <CardContent>
            <TextArea field="additionalNotes" label="" rows={6} />
          </CardContent>
        </Card>
      </div>
      {editing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button onClick={() => upsertMutation.mutate({ patientId, ...form })} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Salvando..." : "Salvar Anamnese"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Timeline Display ─────────────────────────────────────────────────────────
function TimelineDisplay({ data, sessionCount, createdAt }: { data: Record<string, unknown>; sessionCount: number; createdAt?: Date }) {
  const global = data.globalAnalysis as Record<string, unknown> | undefined;
  const lastSession = data.lastSessionAnalysis as Record<string, unknown> | undefined;
  const nextGuidance = data.nextSessionGuidance as Record<string, unknown> | undefined;
  const evolution = data.sufferingEvolution as Array<{ session: number; date: string; level: number }> | undefined;

  return (
    <div className="space-y-4">
      {createdAt && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Análise gerada em {new Date(createdAt).toLocaleString("pt-BR")} • Baseada em {sessionCount} sessão(ões)
        </p>
      )}

      {/* Análise Global */}
      {global && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> Análise Histórica Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {global.summary && <p className="text-sm leading-relaxed">{global.summary as string}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(global.identifiedPatterns) && global.identifiedPatterns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Padrões Identificados</p>
                  <ul className="space-y-1">
                    {(global.identifiedPatterns as string[]).map((p, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(global.concreteProgress) && global.concreteProgress.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Progressos Concretos</p>
                  <ul className="space-y-1">
                    {(global.concreteProgress as string[]).map((p, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {Array.isArray(global.attentionPoints) && global.attentionPoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pontos de Atenção</p>
                <ul className="space-y-1">
                  {(global.attentionPoints as string[]).map((p, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {global.synthesis && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Síntese</p>
                <p className="text-sm">{global.synthesis as string}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Análise do Último Atendimento */}
      {lastSession && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" /> Análise do Último Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastSession.summary && <p className="text-sm leading-relaxed">{lastSession.summary as string}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(lastSession.clinicalObservations) && lastSession.clinicalObservations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Observações Clínicas</p>
                  <ul className="space-y-1">
                    {(lastSession.clinicalObservations as string[]).map((o, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {lastSession.emotionalState && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Estado Emocional</p>
                  <p className="text-sm">{lastSession.emotionalState as string}</p>
                </div>
              )}
            </div>
            {lastSession.riskAnalysis && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Análise de Risco</p>
                <p className="text-sm">{lastSession.riskAnalysis as string}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orientação para Próxima Sessão */}
      {nextGuidance && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" /> Orientação para Próxima Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextGuidance.suggestedFocus && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Foco Sugerido</p>
                <p className="text-sm">{nextGuidance.suggestedFocus as string}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(nextGuidance.themesToReturn) && nextGuidance.themesToReturn.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Temas a Retomar</p>
                  <ul className="space-y-1">
                    {(nextGuidance.themesToReturn as string[]).map((t, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(nextGuidance.suggestedQuestions) && nextGuidance.suggestedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Perguntas Sugeridas</p>
                  <ul className="space-y-1">
                    {(nextGuidance.suggestedQuestions as string[]).map((q, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground"><span className="text-primary shrink-0">?</span>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(nextGuidance.recommendedTechniques) && nextGuidance.recommendedTechniques.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Técnicas Recomendadas</p>
                  <ul className="space-y-1">
                    {(nextGuidance.recommendedTechniques as string[]).map((t, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(nextGuidance.clinicalAlerts) && nextGuidance.clinicalAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Alertas Clínicos</p>
                  <ul className="space-y-1">
                    {(nextGuidance.clinicalAlerts as string[]).map((a, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {nextGuidance.immediateRecommendation && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Recomendação Imediata</p>
                <p className="text-sm">{nextGuidance.immediateRecommendation as string}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evolução do Sofrimento */}
      {Array.isArray(evolution) && evolution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Evolução do Nível de Sofrimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24 mt-2">
              {evolution.map((e, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{e.level}</span>
                  <div
                    className="w-full rounded-t-sm bg-primary/70 transition-all"
                    style={{ height: `${(e.level / 10) * 80}px` }}
                    title={`Sessão ${e.session}: ${e.date}`}
                  />
                  <span className="text-xs text-muted-foreground truncate w-full text-center">{e.session}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Sessões (escala 0-10)</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Edit Patient Dialog ──────────────────────────────────────────────────────
function EditPatientDialog({
  patient,
  open,
  onClose,
  onSuccess,
}: {
  patient: { id: number; name: string; email?: string | null; phone?: string | null; birthDate?: string | null; cpf?: string | null; occupation?: string | null; mainComplaint?: string | null; medicalHistory?: string | null; medications?: string | null; notes?: string | null; sessionValue?: string | null; status: string; referredBy?: string | null; address?: string | null; emergencyContact?: string | null; emergencyPhone?: string | null; };
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
    address: patient.address ?? "",
    emergencyContact: patient.emergencyContact ?? "",
    emergencyPhone: patient.emergencyPhone ?? "",
  });

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => { toast.success("Paciente atualizado!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: patient.id, ...form }); }} className="space-y-4 pt-2">
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
            <Label>Endereço</Label>
            <Input value={form.address} onChange={set("address")} placeholder="Rua, número, bairro, cidade" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Contato de Emergência</Label>
              <Input value={form.emergencyContact} onChange={set("emergencyContact")} />
            </div>
            <div className="space-y-1.5">
              <Label>Tel. Emergência</Label>
              <Input value={form.emergencyPhone} onChange={set("emergencyPhone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Queixa principal</Label>
            <textarea value={form.mainComplaint} onChange={set("mainComplaint")} className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
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

// ── Upload Document Dialog ───────────────────────────────────────────────────
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
    uploadMutation.mutate({ patientId, fileName, mimeType: fileData.mimeType, fileSize: fileData.size, category, description, fileBase64: fileData.base64 });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Anexar Documento</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName ? <p className="text-sm font-medium text-primary">{fileName}</p> : (
              <><p className="text-sm font-medium">Clique para selecionar</p><p className="text-xs text-muted-foreground mt-1">PDF, imagens, Word — máx. 16MB</p></>
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

// ── Upload Recording Dialog ──────────────────────────────────────────────────
function UploadRecordingDialog({
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
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; size: number } | null>(null);

  const uploadMutation = trpc.recordings.upload.useMutation({
    onSuccess: () => { toast.success("Gravação enviada!"); onSuccess(); },
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
    if (!fileData || !fileName) { toast.error("Selecione um arquivo de áudio"); return; }
    uploadMutation.mutate({ patientId, fileName, fileBase64: fileData.base64, mimeType: fileData.mimeType, fileSize: fileData.size });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Adicionar Gravação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
            <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName ? <p className="text-sm font-medium text-primary">{fileName}</p> : (
              <><p className="text-sm font-medium">Clique para selecionar</p><p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG — máx. 16MB</p></>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept=".mp3,.wav,.m4a,.ogg,.webm" />
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Após o upload, você poderá solicitar a transcrição automática por IA diretamente na lista de gravações.</p>
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
