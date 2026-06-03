// @ts-nocheck
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Edit,
  FileDown,
  FileText,
  Heart,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Mic,
  MoreVertical,
  Phone,
  Play,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Square,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateSaoPaulo } from "@/lib/timezone";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(ts: number | Date) {
  const timestamp = typeof ts === "number" ? ts : ts.getTime();
  return formatDateSaoPaulo(timestamp, {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-xs shrink-0 pt-0.5">{label}</span>
      <span className="text-right text-sm font-medium">{value ?? <span className="text-muted-foreground text-xs italic">Não informado</span>}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const [showEdit, setShowEdit] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showRecordingUpload, setShowRecordingUpload] = useState(false);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralForm, setReferralForm] = useState({
    recipientTitle: "Ao Médico Psiquiatra",
    recipientName: "",
    referralReason: "",
    treatmentDuration: "",
    sessionFrequency: "Semanal",
    observedSymptoms: "",
    diagnosticHypothesis: "",
    recentEvolution: "",
    currentMedications: "",
    riskFactors: "",
  });

  const { data: patient, isLoading, refetch } = trpc.patients.getById.useQuery({ id: patientId }, { enabled: patientId > 0 });
  const { data: patientSessions } = trpc.sessions.list.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: documents, refetch: refetchDocs } = trpc.documents.byPatient.useQuery({ patientId }, { enabled: patientId > 0 });
  const { data: clinicalNotes, refetch: refetchNotes } = trpc.clinicalNotes.byPatient.useQuery({ patientId }, { enabled: patientId > 0 });
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
  const supervisionMutation = trpc.recordings.generateSupervision.useMutation({
    onSuccess: () => { toast.success("Supervisão IA gerada!"); refetchRecordings(); },
    onError: (e) => toast.error(e.message),
  });
  const generateTimelineMutation = trpc.timeline.generate.useMutation({
    onSuccess: () => { toast.success("Análise gerada com sucesso!"); refetchTimeline(); },
    onError: (e) => toast.error(e.message),
  });
  const generateReferralMutation = trpc.reports.generateReferralLetterPDF.useMutation({
    onSuccess: (result) => {
      const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Carta de Encaminhamento gerada com sucesso!");
      setShowReferralModal(false);
    },
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

  const activeNote = selectedNote != null ? clinicalNotes?.find((n) => n.id === selectedNote) : null;

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
              <SectionCard title="Dados Pessoais" icon={User}>
                <div className="space-y-0 text-sm">
                  <InfoRow label="Nome completo" value={patient.name} />
                  <InfoRow label="Data de nascimento" value={patient.birthDate} />
                  <InfoRow label="CPF" value={patient.cpf} />
                  <InfoRow label="Gênero" value={(patient as Record<string, unknown>).gender ? {
                    male: "Masculino", female: "Feminino", other: "Outro", prefer_not_to_say: "Prefiro não informar"
                  }[(patient as Record<string, unknown>).gender as string] : null} />
                  <InfoRow label="Estado Civil" value={(patient as Record<string, unknown>).maritalStatus ? {
                    single: "Solteiro(a)", married: "Casado(a)", divorced: "Divorciado(a)", widowed: "Viúvo(a)", stable_union: "União Estável", other: "Outro"
                  }[(patient as Record<string, unknown>).maritalStatus as string] : null} />
                  <InfoRow label="Escolaridade" value={(patient as Record<string, unknown>).schooling ? {
                    no_schooling: "Sem escolaridade", elementary: "Fundamental", middle: "Médio", high_school: "Ensino Médio Completo", college: "Superior", postgrad: "Pós-graduação"
                  }[(patient as Record<string, unknown>).schooling as string] : null} />
                  <InfoRow label="Religião" value={(patient as Record<string, unknown>).religion as string} />
                  <InfoRow label="Profissão" value={patient.occupation} />
                  <InfoRow label="Encaminhado por" value={patient.referredBy} />
                  <InfoRow label="Status" value={<StatusBadge status={patient.status} />} />
                </div>
              </SectionCard>
              <SectionCard title="Resumo Clínico" icon={Calendar}>
                <div className="space-y-0 text-sm">
                  <InfoRow label="Total de sessões" value={patientSessions?.length ?? 0} />
                  <InfoRow label="Prontuários" value={clinicalNotes?.length ?? 0} />
                  <InfoRow label="Documentos" value={documents?.length ?? 0} />
                  <InfoRow label="Gravações" value={recordings?.length ?? 0} />
                  {patient.sessionValue && (
                    <InfoRow label="Valor/sessão" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(patient.sessionValue))} />
                  )}
                </div>
              </SectionCard>
            </div>
            {patient.mainComplaint && (
              <SectionCard title="Queixa Principal" icon={FileText}>
                <p className="text-sm text-muted-foreground">{patient.mainComplaint}</p>
              </SectionCard>
            )}
            {patient.notes && (
              <SectionCard title="Observações Gerais" icon={FileText}>
                <p className="text-sm text-muted-foreground">{patient.notes}</p>
              </SectionCard>
            )}
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowReferralModal(true)} className="gap-1.5">
                <FileDown className="h-3.5 w-3.5" /> Carta de Encaminhamento
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)} className="gap-1.5">
                <Edit className="h-3.5 w-3.5" /> Editar Perfil
              </Button>
            </div>
          </TabsContent>

          {/* ── CONTATO ── */}
          <TabsContent value="contact" className="space-y-4">
            <ContactTab patient={patient} onEdit={() => setShowEdit(true)} />
          </TabsContent>

          {/* ── SAÚDE ── */}
          <TabsContent value="health" className="space-y-4">
            <HealthTab patientId={patientId} anamneseData={anamneseData} refetch={refetchAnamnese} patient={patient} onEditPatient={() => setShowEdit(true)} />
          </TabsContent>

          {/* ── ANAMNESE ── */}
          <TabsContent value="anamnese" className="space-y-4">
            <AnamneseTab patientId={patientId} anamneseData={anamneseData} refetch={refetchAnamnese} />
          </TabsContent>

          {/* ── PRONTUÁRIO ── */}
          <TabsContent value="notes" className="space-y-4">
            {activeNote ? (
              <ClinicalNoteEditor
                key={activeNote.id}
                note={activeNote}
                onBack={() => { setSelectedNote(null); refetchNotes(); }}
                patientId={patientId}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{clinicalNotes?.length ?? 0} prontuário(s) registrado(s)</p>
                  <Button size="sm" onClick={() => navigate(`/sessions?patientId=${patientId}`)} className="gap-1.5">
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
                      <Card key={note.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedNote(note.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-medium">{new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {(note as Record<string, unknown>).sessionNumber && (
                                  <Badge variant="outline" className="text-xs">Sessão #{String((note as Record<string, unknown>).sessionNumber)}</Badge>
                                )}
                                {(note as Record<string, unknown>).sufferingLevel != null && (
                                  <Badge variant="outline" className="text-xs">Sofrimento: {String((note as Record<string, unknown>).sufferingLevel)}/10</Badge>
                                )}
                                {(note as Record<string, unknown>).aiTechnicalFeedback && (
                                  <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{String((note as Record<string, unknown>).aiTechnicalFeedback)}</Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          </div>
                          {(note as Record<string, unknown>).mainDemand && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              <span className="font-medium">Demanda: </span>{String((note as Record<string, unknown>).mainDemand)}
                            </p>
                          )}
                          {note.content && !(note as Record<string, unknown>).mainDemand && (
                            <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, " ").substring(0, 200) }} />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ── DOCUMENTOS ── */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <p className="text-sm text-muted-foreground">{documents?.length ?? 0} documento(s)</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShowDocumentSelector(true)} className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Novo Documento
                </Button>
                <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> Anexar Documento
                </Button>
              </div>
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
                          variant="ghost" size="icon" className="text-destructive hover:text-destructive"
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
                    <CardContent className="p-4 space-y-3">
                      {/* Header da gravação */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Mic className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{rec.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(rec.createdAt).toLocaleDateString("pt-BR")} {"•"}{" "}
                              {rec.transcriptionStatus === "done" ? <span className="text-green-600 font-medium">Transcrito</span>
                                : rec.transcriptionStatus === "processing" ? <span className="text-yellow-600">Transcrevendo...</span>
                                : rec.transcriptionStatus === "error" ? <span className="text-red-600">Erro na transcrição</span>
                                : <span className="text-muted-foreground">Aguardando transcrição</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {rec.transcriptionStatus !== "done" && rec.transcriptionStatus !== "processing" && (
                            <Button variant="outline" size="sm"
                              onClick={() => transcribeMutation.mutate({ recordingId: rec.id })}
                              disabled={transcribeMutation.isPending}
                              className="gap-1.5">
                              {transcribeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                              Transcrever
                            </Button>
                          )}
                          {/* Menu de ações */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {rec.transcription && (
                                <>
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(rec.transcription);
                                    toast.success('Transcrição copiada!');
                                  }} className="gap-2">
                                    <Copy className="h-4 w-4" />
                                    Copiar Transcrição
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => {
                                const link = document.createElement('a');
                                link.href = rec.fileUrl;
                                link.download = rec.fileName;
                                link.click();
                              }} className="gap-2">
                                <Download className="h-4 w-4" />
                                Baixar Áudio
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { if (confirm("Excluir gravação?")) deleteRecordingMutation.mutate({ recordingId: rec.id }); }} className="gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Player de áudio nativo */}
                      <audio controls className="w-full h-10" preload="none">
                        <source src={rec.fileUrl} type={rec.mimeType ?? "audio/mpeg"} />
                        Seu navegador não suporta o player de áudio.
                      </audio>

                      {/* Transcrição completa */}
                      {rec.transcription && (
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              Transcrição Completa
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs h-7 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => supervisionMutation.mutate({ recordingId: rec.id })}
                              disabled={supervisionMutation.isPending}
                            >
                              {supervisionMutation.isPending
                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</>
                                : <><Brain className="h-3 w-3" /> Supervisão IA</>}
                            </Button>
                          </div>
                          <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{rec.transcription}</p>
                        </div>
                      )}

                      {/* Supervisão IA */}
                      {(rec as Record<string, unknown>).supervision && (
                        <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <Brain className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <p className="text-xs font-semibold text-primary">Supervisão Clínica por IA</p>
                            <Badge variant="outline" className="text-[10px] h-4 border-primary/30 text-primary">Ferramenta de apoio</Badge>
                          </div>
                          <MarkdownRenderer className="text-xs">{String((rec as Record<string, unknown>).supervision)}</MarkdownRenderer>
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
              <Button size="sm" onClick={() => generateTimelineMutation.mutate({ patientId })} disabled={generateTimelineMutation.isPending} className="gap-1.5">
                {generateTimelineMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analisando...</> : <><Sparkles className="h-3.5 w-3.5" /> {timelineData ? "Nova Análise" : "Gerar Análise"}</>}
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

      <EditPatientDialog patient={patient} open={showEdit} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); refetch(); }} />
      <UploadDocumentDialog patientId={patientId} open={showUpload} onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); refetchDocs(); }} />
      <UploadRecordingDialog patientId={patientId} open={showRecordingUpload} onClose={() => setShowRecordingUpload(false)} onSuccess={() => { setShowRecordingUpload(false); refetchRecordings(); }} />

      {/* Modal Carta de Encaminhamento */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              Carta de Encaminhamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Preencha os campos abaixo para gerar a carta de encaminhamento em PDF.</p>

            {/* Destinatário */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b pb-1">Destinatário</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Título do Destinatário *</Label>
                  <Select value={referralForm.recipientTitle} onValueChange={(v) => setReferralForm(f => ({ ...f, recipientTitle: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ao Médico Psiquiatra">Ao Médico Psiquiatra</SelectItem>
                      <SelectItem value="Ao Médico Neurologista">Ao Médico Neurologista</SelectItem>
                      <SelectItem value="Ao Médico Clínico Geral">À Médico Clínico Geral</SelectItem>
                      <SelectItem value="À Equipe Multidisciplinar">À Equipe Multidisciplinar</SelectItem>
                      <SelectItem value="Ao Psicopedagogo">Ao Psicopedagogo</SelectItem>
                      <SelectItem value="Ao Fonoaudiólogo">Ao Fonoaudiólogo</SelectItem>
                      <SelectItem value="Ao Terapeuta Ocupacional">Ao Terapeuta Ocupacional</SelectItem>
                      <SelectItem value="Ao Profissional de Saúde">Ao Profissional de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome do Destinatário (opcional)</Label>
                  <Input className="h-8 text-xs" placeholder="Dr(a). Nome" value={referralForm.recipientName} onChange={(e) => setReferralForm(f => ({ ...f, recipientName: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Contextualização */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b pb-1">Contextualização</h3>
              <div className="space-y-1">
                <Label className="text-xs">Motivo do Encaminhamento *</Label>
                <Textarea className="text-xs min-h-[70px]" placeholder="Descreva o motivo pelo qual o paciente está sendo encaminhado..." value={referralForm.referralReason} onChange={(e) => setReferralForm(f => ({ ...f, referralReason: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tempo de Acompanhamento *</Label>
                  <Input className="h-8 text-xs" placeholder="Ex: 8 meses, 1 ano e 2 meses" value={referralForm.treatmentDuration} onChange={(e) => setReferralForm(f => ({ ...f, treatmentDuration: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frequência das Sessões *</Label>
                  <Select value={referralForm.sessionFrequency} onValueChange={(v) => setReferralForm(f => ({ ...f, sessionFrequency: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Duas vezes por semana">Duas vezes por semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Aspectos Clínicos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b pb-1">Aspectos Clínicos</h3>
              <div className="space-y-1">
                <Label className="text-xs">Sintomatologia Observada *</Label>
                <Textarea className="text-xs min-h-[80px]" placeholder="Descreva os sintomas e apresentações clínicas observadas durante o acompanhamento..." value={referralForm.observedSymptoms} onChange={(e) => setReferralForm(f => ({ ...f, observedSymptoms: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hipótese Diagnóstica (opcional)</Label>
                <Input className="h-8 text-xs" placeholder="Ex: F41.1 (CID-11) – Transtorno de Ansiedade Generalizada" value={referralForm.diagnosticHypothesis} onChange={(e) => setReferralForm(f => ({ ...f, diagnosticHypothesis: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Evolução Recente *</Label>
                <Textarea className="text-xs min-h-[70px]" placeholder="Descreva a evolução clínica recente do paciente..." value={referralForm.recentEvolution} onChange={(e) => setReferralForm(f => ({ ...f, recentEvolution: e.target.value }))} />
              </div>
            </div>

            {/* Observações Éticas */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary border-b pb-1">Observações Éticas</h3>
              <div className="space-y-1">
                <Label className="text-xs">Uso de Medicação (opcional)</Label>
                <Input className="h-8 text-xs" placeholder="Ex: Fluoxetina 20mg, Clonazepam 0,5mg" value={referralForm.currentMedications} onChange={(e) => setReferralForm(f => ({ ...f, currentMedications: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fatores de Risco (opcional)</Label>
                <Input className="h-8 text-xs" placeholder="Ex: Ideação suicida passiva sem plano" value={referralForm.riskFactors} onChange={(e) => setReferralForm(f => ({ ...f, riskFactors: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowReferralModal(false)}>Cancelar</Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={generateReferralMutation.isPending || !referralForm.referralReason || !referralForm.observedSymptoms || !referralForm.recentEvolution || !referralForm.treatmentDuration}
                onClick={() => generateReferralMutation.mutate({ patientId, ...referralForm })}
              >
                {generateReferralMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando PDF...</> : <><FileDown className="h-3.5 w-3.5" /> Gerar e Baixar PDF</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ── Contact Tab ───────────────────────────────────────────────────────────────
function ContactTab({ patient, onEdit }: { patient: Record<string, unknown>; onEdit: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Telefones" icon={Phone}>
          <div className="space-y-0 text-sm">
            <InfoRow label="Telefone principal" value={patient.phone as string} />
            <InfoRow label="Telefone secundário" value={(patient as Record<string, unknown>).phone2 as string} />
            <InfoRow label="E-mail" value={patient.email ? (
              <a href={`mailto:${patient.email}`} className="text-primary hover:underline flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />{patient.email as string}
              </a>
            ) : null} />
          </div>
        </SectionCard>
        <SectionCard title="Endereço" icon={MapPin}>
          <div className="space-y-0 text-sm">
            <InfoRow label="CEP" value={(patient as Record<string, unknown>).zipCode as string} />
            <InfoRow label="Rua" value={(patient as Record<string, unknown>).address as string} />
            <InfoRow label="Número" value={(patient as Record<string, unknown>).addressNumber as string} />
            <InfoRow label="Complemento" value={(patient as Record<string, unknown>).addressComplement as string} />
            <InfoRow label="Bairro" value={(patient as Record<string, unknown>).neighborhood as string} />
            <InfoRow label="Cidade" value={(patient as Record<string, unknown>).city as string} />
            <InfoRow label="Estado" value={(patient as Record<string, unknown>).state as string} />
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Contato de Emergência" icon={Users}>
        <div className="space-y-0 text-sm">
          <InfoRow label="Nome" value={(patient as Record<string, unknown>).emergencyContact as string} />
          <InfoRow label="Telefone" value={(patient as Record<string, unknown>).emergencyPhone as string} />
        </div>
      </SectionCard>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onEdit} className="gap-1.5">
          <Edit className="h-3.5 w-3.5" /> Editar Contato
        </Button>
      </div>
    </div>
  );
}

// ── Health Tab ────────────────────────────────────────────────────────────────
function HealthTab({ patientId, anamneseData, refetch, patient, onEditPatient }: {
  patientId: number;
  anamneseData: Record<string, unknown> | null | undefined;
  refetch: () => void;
  patient: Record<string, unknown>;
  onEditPatient: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    bloodType: (anamneseData?.bloodType as string) ?? "",
    allergies: (anamneseData?.allergies as string) ?? "",
    chronicConditions: (anamneseData?.chronicConditions as string) ?? "",
    disabilities: (anamneseData?.disabilities as string) ?? "",
  }));

  useEffect(() => {
    if (!editing && anamneseData) {
      setForm({
        bloodType: (anamneseData.bloodType as string) ?? "",
        allergies: (anamneseData.allergies as string) ?? "",
        chronicConditions: (anamneseData.chronicConditions as string) ?? "",
        disabilities: (anamneseData.disabilities as string) ?? "",
      });
    }
  }, [anamneseData, editing]);

  const upsertMutation = trpc.anamnese.upsert.useMutation({
    onSuccess: () => { toast.success("Dados de saúde salvos!"); setEditing(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Informações de Saúde</h3>
        <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="gap-1.5">
          <Edit className="h-3.5 w-3.5" /> {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      {/* Convênio */}
      <SectionCard title="Convênio / Plano de Saúde" icon={Shield}>
        <div className="space-y-0 text-sm">
          <InfoRow label="Convênio" value={(patient as Record<string, unknown>).insuranceName as string} />
          <InfoRow label="Nº da Carteirinha" value={(patient as Record<string, unknown>).insuranceNumber as string} />
          <InfoRow label="Tipo de Plano" value={(patient as Record<string, unknown>).insurancePlan as string} />
          <InfoRow label="Validade" value={(patient as Record<string, unknown>).insuranceExpiry as string} />
        </div>
        <div className="mt-3 pt-3 border-t border-border/40">
          <Button size="sm" variant="outline" onClick={onEditPatient} className="gap-1.5">
            <Edit className="h-3.5 w-3.5" /> Editar Convênio
          </Button>
        </div>
      </SectionCard>

      {/* Dados de saúde */}
      <Card>
        <CardContent className="p-4 space-y-4">
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
          <div className="space-y-1.5">
            <Label className="text-xs">Alergias</Label>
            {editing ? <Textarea value={form.allergies} onChange={set("allergies")} rows={3} /> : <p className="text-sm text-muted-foreground">{form.allergies || <span className="italic text-xs">Não informado</span>}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Condições Crônicas / Histórico Médico</Label>
            {editing ? <Textarea value={form.chronicConditions} onChange={set("chronicConditions")} rows={3} /> : <p className="text-sm text-muted-foreground">{form.chronicConditions || <span className="italic text-xs">Não informado</span>}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Deficiências / Necessidades Especiais</Label>
            {editing ? <Textarea value={form.disabilities} onChange={set("disabilities")} rows={2} /> : <p className="text-sm text-muted-foreground">{form.disabilities || <span className="italic text-xs">Não informado</span>}</p>}
          </div>
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

// ── Field Component (memoizado para evitar remontagem) ──────────────────────────────────────────────────────────────
const AnamneseField = React.memo(function AnamneseField({ 
  field, 
  label, 
  rows = 3, 
  type = "textarea",
  editing,
  value,
  onChange
}: { 
  field: string; 
  label: string; 
  rows?: number; 
  type?: "input" | "textarea"
  editing: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {editing ? (
        type === "input"
          ? <Input value={value} onChange={onChange} />
          : <Textarea value={value} onChange={onChange} rows={rows} />
      ) : (
        <p className="text-sm text-muted-foreground min-h-[1.5rem]">
          {value || <span className="italic text-xs">Não informado</span>}
        </p>
      )}
    </div>
  );
});

// ── Anamnese Tab ──────────────────────────────────────────────────────────────
function AnamneseTab({ patientId, anamneseData, refetch }: {
  patientId: number;
  anamneseData: Record<string, unknown> | null | undefined;
  refetch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => ({
    mainComplaintDetail: (anamneseData?.mainComplaintDetail as string) ?? "",
    therapeuticGoals: (anamneseData?.therapeuticGoals as string) ?? "",
    cidCode: (anamneseData?.cidCode as string) ?? "",
    cidDescription: (anamneseData?.cidDescription as string) ?? "",
    therapeuticApproach: (anamneseData?.therapeuticApproach as string) ?? "",
    familyHistory: (anamneseData?.familyHistory as string) ?? "",
    personalHistory: (anamneseData?.personalHistory as string) ?? "",
    previousTreatments: (anamneseData?.previousTreatments as string) ?? "",
    currentDiseaseHistory: (anamneseData?.currentDiseaseHistory as string) ?? "",
    psychiatricHistory: (anamneseData?.psychiatricHistory as string) ?? "",
    childhoodHistory: (anamneseData?.childhoodHistory as string) ?? "",
    relationshipHistory: (anamneseData?.relationshipHistory as string) ?? "",
    professionalHistory: (anamneseData?.professionalHistory as string) ?? "",
    substanceUse: (anamneseData?.substanceUse as string) ?? "",
    sleepAndEating: (anamneseData?.sleepAndEating as string) ?? "",
    sexualAffectiveLife: (anamneseData?.sexualAffectiveLife as string) ?? "",
    riskFactors: (anamneseData?.riskFactors as string) ?? "",
    protectiveFactors: (anamneseData?.protectiveFactors as string) ?? "",
    additionalNotes: (anamneseData?.additionalNotes as string) ?? "",
  }));

  // Atualizar form apenas quando sair do modo de edição
  useEffect(() => {
    if (!editing && anamneseData) {
      setForm({
        mainComplaintDetail: (anamneseData.mainComplaintDetail as string) ?? "",
        therapeuticGoals: (anamneseData.therapeuticGoals as string) ?? "",
        cidCode: (anamneseData.cidCode as string) ?? "",
        cidDescription: (anamneseData.cidDescription as string) ?? "",
        therapeuticApproach: (anamneseData.therapeuticApproach as string) ?? "",
        familyHistory: (anamneseData.familyHistory as string) ?? "",
        personalHistory: (anamneseData.personalHistory as string) ?? "",
        previousTreatments: (anamneseData.previousTreatments as string) ?? "",
        currentDiseaseHistory: (anamneseData.currentDiseaseHistory as string) ?? "",
        psychiatricHistory: (anamneseData.psychiatricHistory as string) ?? "",
        childhoodHistory: (anamneseData.childhoodHistory as string) ?? "",
        relationshipHistory: (anamneseData.relationshipHistory as string) ?? "",
        professionalHistory: (anamneseData.professionalHistory as string) ?? "",
        substanceUse: (anamneseData.substanceUse as string) ?? "",
        sleepAndEating: (anamneseData.sleepAndEating as string) ?? "",
        sexualAffectiveLife: (anamneseData.sexualAffectiveLife as string) ?? "",
        riskFactors: (anamneseData.riskFactors as string) ?? "",
        protectiveFactors: (anamneseData.protectiveFactors as string) ?? "",
        additionalNotes: (anamneseData.additionalNotes as string) ?? "",
      });
    }
  }, [anamneseData, editing])

  const upsertMutation = trpc.anamnese.upsert.useMutation({
    onSuccess: () => { toast.success("Anamnese salva!"); setEditing(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Ficha de Anamnese</h3>
        <Button size="sm" variant="outline" onClick={() => setEditing(!editing)} className="gap-1.5">
          <Edit className="h-3.5 w-3.5" /> {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      {/* Queixa e Objetivos */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Queixa e Objetivos Terapêuticos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AnamneseField field="mainComplaintDetail" label="Queixa Principal Detalhada" rows={4} editing={editing} value={form.mainComplaintDetail} onChange={set("mainComplaintDetail")} />
          <AnamneseField field="therapeuticGoals" label="Objetivos Terapêuticos" rows={3} editing={editing} value={form.therapeuticGoals} onChange={set("therapeuticGoals")} />
          <div className="grid grid-cols-2 gap-3">
            <AnamneseField field="cidCode" label="CID-10 / CID-11" type="input" editing={editing} value={form.cidCode} onChange={set("cidCode")} />
            <AnamneseField field="cidDescription" label="Descrição do CID" type="input" editing={editing} value={form.cidDescription} onChange={set("cidDescription")} />
          </div>
          <AnamneseField field="therapeuticApproach" label="Abordagem Terapêutica" type="input" editing={editing} value={form.therapeuticApproach} onChange={set("therapeuticApproach")} />
        </CardContent>
      </Card>

      {/* Histórico Clínico */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Histórico Clínico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AnamneseField field="currentDiseaseHistory" label="História da Doença Atual (HDA)" rows={4} editing={editing} value={form.currentDiseaseHistory} onChange={set("currentDiseaseHistory")} />
          <AnamneseField field="personalHistory" label="Histórico Pessoal" rows={3} editing={editing} value={form.personalHistory} onChange={set("personalHistory")} />
          <AnamneseField field="familyHistory" label="Histórico Familiar" rows={3} editing={editing} value={form.familyHistory} onChange={set("familyHistory")} />
          <AnamneseField field="psychiatricHistory" label="Histórico Psiquiátrico / Tratamentos Anteriores" rows={3} editing={editing} value={form.psychiatricHistory} onChange={set("psychiatricHistory")} />
          <AnamneseField field="previousTreatments" label="Outros Tratamentos Anteriores" rows={2} editing={editing} value={form.previousTreatments} onChange={set("previousTreatments")} />
        </CardContent>
      </Card>

      {/* Desenvolvimento */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Desenvolvimento e Contexto de Vida</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AnamneseField field="childhoodHistory" label="Histórico da Infância e Adolescência" rows={3} editing={editing} value={form.childhoodHistory} onChange={set("childhoodHistory")} />
          <AnamneseField field="relationshipHistory" label="Histórico Afetivo e Relacional" rows={3} editing={editing} value={form.relationshipHistory} onChange={set("relationshipHistory")} />
          <AnamneseField field="professionalHistory" label="Histórico Profissional e Acadêmico" rows={3} editing={editing} value={form.professionalHistory} onChange={set("professionalHistory")} />
        </CardContent>
      </Card>

      {/* Hábitos e Estilo de Vida */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hábitos e Estilo de Vida</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AnamneseField field="substanceUse" label="Uso de Substâncias (álcool, tabaco, drogas)" rows={2} editing={editing} value={form.substanceUse} onChange={set("substanceUse")} />
          <AnamneseField field="sleepAndEating" label="Sono e Alimentação" rows={2} editing={editing} value={form.sleepAndEating} onChange={set("sleepAndEating")} />
          <AnamneseField field="sexualAffectiveLife" label="Vida Sexual e Afetiva" rows={2} editing={editing} value={form.sexualAffectiveLife} onChange={set("sexualAffectiveLife")} />
        </CardContent>
      </Card>

      {/* Fatores */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fatores de Risco e Proteção</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AnamneseField field="riskFactors" label="Fatores de Risco" rows={3} editing={editing} value={form.riskFactors} onChange={set("riskFactors")} />
          <AnamneseField field="protectiveFactors" label="Fatores Protetivos" rows={3} editing={editing} value={form.protectiveFactors} onChange={set("protectiveFactors")} />
          <AnamneseField field="additionalNotes" label="Observações Adicionais" rows={4} editing={editing} value={form.additionalNotes} onChange={set("additionalNotes")} />
        </CardContent>
      </Card>

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

// ── Clinical Note Editor (DocsPsi-style 8 sub-tabs) ───────────────────────────
type RiskLevel = "absent" | "low" | "moderate" | "high" | "extreme";

// IMPORTANT: This component must live OUTSIDE ClinicalNoteEditor to prevent
// React from unmounting/remounting the textarea on every parent render (which
// causes focus loss after each keystroke).
function NoteField({
  field, label, rows = 3, placeholder = "", form, onChange
}: {
  field: string; label: string; rows?: number; placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: Record<string, any>;
  onChange: (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea
        value={(form[field] as string) ?? ""}
        onChange={onChange(field)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}

// Enum sanitization helpers — defined at module level so they can be used in mutation callbacks
const VALID_MOODS = ["very_bad", "bad", "neutral", "good", "very_good"] as const;
const VALID_RISKS = ["absent", "low", "moderate", "high", "extreme"] as const;
const VALID_SESSION_TYPES = ["individual", "couple", "group", "evaluation"] as const;
const VALID_MODALITIES = ["in_person", "online"] as const;
type MoodValue = typeof VALID_MOODS[number];
type SessionTypeValue = typeof VALID_SESSION_TYPES[number];
type ModalityValue = typeof VALID_MODALITIES[number];
const sanitizeMood = (v: unknown): MoodValue =>
  (VALID_MOODS as readonly string[]).includes(v as string) ? v as MoodValue : "neutral";
const sanitizeRisk = (v: unknown): RiskLevel =>
  (VALID_RISKS as readonly string[]).includes(v as string) ? v as RiskLevel : "absent";
const sanitizeSessionType = (v: unknown): SessionTypeValue =>
  (VALID_SESSION_TYPES as readonly string[]).includes(v as string) ? v as SessionTypeValue : "individual";
const sanitizeModality = (v: unknown): ModalityValue =>
  (VALID_MODALITIES as readonly string[]).includes(v as string) ? v as ModalityValue : "in_person";

function ClinicalNoteEditor({ note, onBack, patientId }: { note: Record<string, unknown>; onBack: () => void; patientId: number }) {
  const [subTab, setSubTab] = useState("session");
  const [form, setForm] = useState(() => ({
    // Sessão
    sessionNumber: String((note.sessionNumber as number) ?? ""),
    sessionType2: (note.sessionType2 as string) ?? "individual",
    modality2: (note.modality2 as string) ?? "in_person",
    sessionLocation: (note.sessionLocation as string) ?? "",
    // Avaliação
    emotionalState: (note.emotionalState as string) ?? "",
    predominantMood: (note.predominantMood as string) ?? "",
    mood: (note.mood as string) ?? "neutral",
    sufferingLevel: String((note.sufferingLevel as number) ?? "5"),
    currentMedications: (note.currentMedications as string) ?? "",
    generalPresentation: (note.generalPresentation as string) ?? "",
    mainDemand: (note.mainDemand as string) ?? "",
    topicsAddressed: (note.topicsAddressed as string) ?? "",
    relevantNarrative: (note.relevantNarrative as string) ?? "",
    clinicalAssessment: (note.clinicalAssessment as string) ?? "",
    technicalAnalysis: (note.technicalAnalysis as string) ?? "",
    // Intervenções
    techniquesUsed: (note.techniquesUsed as string) ?? "",
    plannedInterventions: (note.plannedInterventions as string) ?? "",
    homework: (note.homework as string) ?? "",
    therapeuticPlan: (note.therapeuticPlan as string) ?? "",
    // Evolução
    treatmentResponse: (note.treatmentResponse as string) ?? "",
    goalsProgress: (note.goalsProgress as string) ?? "",
    observedInsights: (note.observedInsights as string) ?? "",
    observedResistances: (note.observedResistances as string) ?? "",
    // Próxima
    nextSessionDate: (note.nextSessionDate as string) ?? "",
    nextSessionGoals: (note.nextSessionGoals as string) ?? "",
    treatmentPlanAdjustments: (note.treatmentPlanAdjustments as string) ?? "",
    // Riscos
    selfHarmRisk: (note.selfHarmRisk as RiskLevel) ?? "absent",
    thirdPartyRisk: (note.thirdPartyRisk as RiskLevel) ?? "absent",
    suicideRisk: (note.suicideRisk as RiskLevel) ?? "absent",
    // Geral (Anotações Gerais da Sessão — armazenado em aiSuggestions)
    content: String((note.aiSuggestions as string) ?? "").replace(/<[^>]+>/g, "").trim() || "",
    // Privado
    countertransference: (note.countertransference as string) ?? "",
    clinicalHypotheses: (note.clinicalHypotheses as string) ?? "",
    supervisionNotes: (note.supervisionNotes as string) ?? "",
    referrals: (note.referrals as string) ?? "",
    privateObservations: (note.privateObservations as string) ?? "",
  }));
  const [aiFeedback, setAiFeedback] = useState((note.aiTechnicalFeedback as string) ?? "");
  const [aiFeedbackAt, setAiFeedbackAt] = useState((note.aiTechnicalFeedbackAt as number) ?? null);

  const utils = trpc.useUtils();
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSaveRef = React.useRef<(() => void) | null>(null);
  // Prevent auto-save on initial mount — only save after user makes a change
  const isDirtyRef = React.useRef(false);

  const updateMutation = trpc.clinicalNotes.update.useMutation({
    onSuccess: () => {
      setSaveStatus("saved");
      utils.clinicalNotes.byPatient.invalidate({ patientId: note.patientId as number });
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: (e) => {
      setSaveStatus("error");
      const msg = e.message?.length > 120 ? e.message.substring(0, 120) + "..." : e.message;
      toast.error(msg || "Erro ao salvar prontuário");
    },
  });

  const autoFillMutation = trpc.clinicalNotes.autoFill.useMutation({
    onSuccess: (data) => {
      // Preenche apenas campos vazios — preserva o que o usuário já digitou
  // @ts-ignore
      const isEmpty = (v: string | undefined | null) => (v ?? "").trim() === "";
  // @ts-ignore
      const isDefaultEnum = (v: string | undefined | null, def: string) => (v ?? "").trim() === "" || v === def;
  // @ts-ignore
      setForm((prev) => ({
  // @ts-ignore
        ...prev,
  // @ts-ignore
        ...(isEmpty(prev.content) && data.content !== undefined && { content: String(data.content) }),
  // @ts-ignore
        ...(isEmpty(prev.emotionalState) && data.emotionalState !== undefined && { emotionalState: String(data.emotionalState) }),
  // @ts-ignore
        ...(isEmpty(prev.predominantMood) && data.predominantMood !== undefined && { predominantMood: String(data.predominantMood) }),
  // @ts-ignore
        ...(isDefaultEnum(prev.mood, "neutral") && data.mood !== undefined && { mood: sanitizeMood(data.mood) }),
  // @ts-ignore
        ...(isEmpty(prev.sufferingLevel) && data.sufferingLevel !== undefined && { sufferingLevel: String(data.sufferingLevel) }),
  // @ts-ignore
        ...(isEmpty(prev.mainDemand) && data.mainDemand !== undefined && { mainDemand: String(data.mainDemand) }),
  // @ts-ignore
        ...(isEmpty(prev.topicsAddressed) && data.topicsAddressed !== undefined && { topicsAddressed: String(data.topicsAddressed) }),
  // @ts-ignore
        ...(isEmpty(prev.relevantNarrative) && data.relevantNarrative !== undefined && { relevantNarrative: String(data.relevantNarrative) }),
  // @ts-ignore
        ...(isEmpty(prev.clinicalAssessment) && data.clinicalAssessment !== undefined && { clinicalAssessment: String(data.clinicalAssessment) }),
  // @ts-ignore
        ...(isEmpty(prev.technicalAnalysis) && data.technicalAnalysis !== undefined && { technicalAnalysis: String(data.technicalAnalysis) }),
  // @ts-ignore
        ...(isEmpty(prev.techniquesUsed) && data.techniquesUsed !== undefined && { techniquesUsed: String(data.techniquesUsed) }),
  // @ts-ignore
        ...(isEmpty(prev.plannedInterventions) && data.plannedInterventions !== undefined && { plannedInterventions: String(data.plannedInterventions) }),
  // @ts-ignore
        ...(isEmpty(prev.therapeuticPlan) && data.therapeuticPlan !== undefined && { therapeuticPlan: String(data.therapeuticPlan) }),
  // @ts-ignore
        ...(isEmpty(prev.homework) && data.homework !== undefined && { homework: String(data.homework) }),
  // @ts-ignore
        ...(isEmpty(prev.treatmentResponse) && data.treatmentResponse !== undefined && { treatmentResponse: String(data.treatmentResponse) }),
  // @ts-ignore
        ...(isEmpty(prev.goalsProgress) && data.goalsProgress !== undefined && { goalsProgress: String(data.goalsProgress) }),
  // @ts-ignore
        ...(isEmpty(prev.observedInsights) && data.observedInsights !== undefined && { observedInsights: String(data.observedInsights) }),
  // @ts-ignore
        ...(isEmpty(prev.observedResistances) && data.observedResistances !== undefined && { observedResistances: String(data.observedResistances) }),
  // @ts-ignore
        ...(isEmpty(prev.nextSessionGoals) && data.nextSessionGoals !== undefined && { nextSessionGoals: String(data.nextSessionGoals) }),
  // @ts-ignore
        ...(isEmpty(prev.treatmentPlanAdjustments) && data.treatmentPlanAdjustments !== undefined && { treatmentPlanAdjustments: String(data.treatmentPlanAdjustments) }),
  // @ts-ignore
        ...(isDefaultEnum(prev.selfHarmRisk, "absent") && data.selfHarmRisk !== undefined && { selfHarmRisk: sanitizeRisk(data.selfHarmRisk) }),
  // @ts-ignore
        ...(isDefaultEnum(prev.thirdPartyRisk, "absent") && data.thirdPartyRisk !== undefined && { thirdPartyRisk: sanitizeRisk(data.thirdPartyRisk) }),
  // @ts-ignore
        ...(isDefaultEnum(prev.suicideRisk, "absent") && data.suicideRisk !== undefined && { suicideRisk: sanitizeRisk(data.suicideRisk) }),
  // @ts-ignore
        ...(isEmpty(prev.countertransference) && data.countertransference !== undefined && { countertransference: String(data.countertransference) }),
  // @ts-ignore
        ...(isEmpty(prev.clinicalHypotheses) && data.clinicalHypotheses !== undefined && { clinicalHypotheses: String(data.clinicalHypotheses) }),
  // @ts-ignore
        ...(isEmpty(prev.supervisionNotes) && data.supervisionNotes !== undefined && { supervisionNotes: String(data.supervisionNotes) }),
  // @ts-ignore
        ...(isEmpty(prev.sessionNumber) && data.sessionNumber !== undefined && { sessionNumber: String(data.sessionNumber) }),
  // @ts-ignore
        ...(isEmpty(prev.currentMedications) && (data as Record<string, unknown>).currentMedications !== undefined && { currentMedications: String((data as Record<string, unknown>).currentMedications) }),
  // @ts-ignore
        ...(isEmpty(prev.generalPresentation) && (data as Record<string, unknown>).generalPresentation !== undefined && { generalPresentation: String((data as Record<string, unknown>).generalPresentation) }),
  // @ts-ignore
        ...(isEmpty(prev.referrals) && (data as Record<string, unknown>).referrals !== undefined && { referrals: String((data as Record<string, unknown>).referrals) }),
  // @ts-ignore
        ...(isEmpty(prev.privateObservations) && (data as Record<string, unknown>).privateObservations !== undefined && { privateObservations: String((data as Record<string, unknown>).privateObservations) }),
  // @ts-ignore
      }));
  // @ts-ignore
      toast.success("Campos vazios preenchidos pela IA! Revise e salve.");
  // @ts-ignore
    },
  // @ts-ignore
    onError: (e) => toast.error(e.message),
  // @ts-ignore
  });

  // @ts-ignore
  const aiFeedbackMutation = trpc.clinicalNotes.generateAIFeedback.useMutation({
  // @ts-ignore
    onSuccess: (data) => {
  // @ts-ignore
      setAiFeedback(data.feedback);
  // @ts-ignore
      setAiFeedbackAt(Date.now());
  // @ts-ignore
      toast.success("Análise IA gerada!");
  // @ts-ignore
    },
  // @ts-ignore
    onError: (e) => toast.error(e.message),
  // @ts-ignore
  });

  // @ts-ignore
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
  // @ts-ignore
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // @ts-ignore
  const doSave = React.useCallback(() => {
  // @ts-ignore
    updateMutation.mutate({
  // @ts-ignore
      id: note.id as number,
  // @ts-ignore
      sessionNumber: form.sessionNumber ? parseInt(form.sessionNumber) : undefined,
  // @ts-ignore
      sessionType2: sanitizeSessionType(form.sessionType2),
  // @ts-ignore
      modality2: sanitizeModality(form.modality2),
  // @ts-ignore
      sessionLocation: form.sessionLocation,
  // @ts-ignore
      emotionalState: form.emotionalState,
  // @ts-ignore
      predominantMood: form.predominantMood,
  // @ts-ignore
      sufferingLevel: form.sufferingLevel ? parseInt(form.sufferingLevel) : undefined,
  // @ts-ignore
      currentMedications: form.currentMedications,
  // @ts-ignore
      generalPresentation: form.generalPresentation,
  // @ts-ignore
      mainDemand: form.mainDemand,
  // @ts-ignore
      topicsAddressed: form.topicsAddressed,
  // @ts-ignore
      relevantNarrative: form.relevantNarrative,
  // @ts-ignore
      clinicalAssessment: form.clinicalAssessment,
  // @ts-ignore
      technicalAnalysis: form.technicalAnalysis,
  // @ts-ignore
      techniquesUsed: form.techniquesUsed,
  // @ts-ignore
      plannedInterventions: form.plannedInterventions,
  // @ts-ignore
      homework: form.homework,
  // @ts-ignore
      therapeuticPlan: form.therapeuticPlan,
  // @ts-ignore
      treatmentResponse: form.treatmentResponse,
  // @ts-ignore
      goalsProgress: form.goalsProgress,
  // @ts-ignore
      observedInsights: form.observedInsights,
  // @ts-ignore
      observedResistances: form.observedResistances,
  // @ts-ignore
      nextSessionDate: form.nextSessionDate || undefined,
  // @ts-ignore
      nextSessionGoals: form.nextSessionGoals,
  // @ts-ignore
      treatmentPlanAdjustments: form.treatmentPlanAdjustments,
  // @ts-ignore
      mood: sanitizeMood(form.mood),
  // @ts-ignore
      selfHarmRisk: sanitizeRisk(form.selfHarmRisk),
  // @ts-ignore
      thirdPartyRisk: sanitizeRisk(form.thirdPartyRisk),
  // @ts-ignore
      suicideRisk: sanitizeRisk(form.suicideRisk),
  // @ts-ignore
      countertransference: form.countertransference,
  // @ts-ignore
      clinicalHypotheses: form.clinicalHypotheses,
  // @ts-ignore
      supervisionNotes: form.supervisionNotes,
  // @ts-ignore
      referrals: form.referrals,
  // @ts-ignore
      privateObservations: form.privateObservations,
  // @ts-ignore
      aiSuggestions: form.content, // Anotações Gerais da Sessão stored in aiSuggestions
  // @ts-ignore
    });
  // @ts-ignore
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // @ts-ignore
  }, [form, note.id]);

  // @ts-ignore
  // Keep ref in sync so auto-save timer always calls the latest version
  // @ts-ignore
  doSaveRef.current = doSave;

  // @ts-ignore
  // Auto-save: trigger save 2s after last change (skip initial mount)
  // @ts-ignore
  React.useEffect(() => {
  // @ts-ignore
    if (!isDirtyRef.current) {
      // Mark as dirty after first render so subsequent changes trigger auto-save
      isDirtyRef.current = true;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      doSaveRef.current?.();
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [form]);

  const handleSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus("saving");
    doSave();
  };

  const riskLevels: { value: RiskLevel; label: string; color: string }[] = [
    { value: "absent", label: "Ausente", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300" },
    { value: "low", label: "Baixo", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300" },
    { value: "moderate", label: "Moderado", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300" },
    { value: "high", label: "Alto", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300" },
    { value: "extreme", label: "Extremo", color: "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200 border-red-500" },
  ];

  const RiskSelector = ({ field, label }: { field: "selfHarmRisk" | "thirdPartyRisk" | "suicideRisk"; label: string }) => (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {riskLevels.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setForm((p) => ({ ...p, [field]: r.value }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form[field] === r.value ? r.color + " ring-2 ring-offset-1 ring-current" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );

  const subTabs = [
    { value: "session", label: "Sessão", icon: Calendar },
    { value: "assessment", label: "Avaliação", icon: Heart },
    { value: "interventions", label: "Intervenções", icon: Brain },
    { value: "evolution", label: "Evolução", icon: TrendingUp },
    { value: "next", label: "Próxima", icon: ChevronRight },
    { value: "risks", label: "Riscos", icon: AlertTriangle },
    { value: "private", label: "Privado", icon: Lock },
    { value: "ai", label: "Análise IA", icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <div>
            <h3 className="font-semibold text-sm">Editar Prontuário</h3>
            <p className="text-xs text-muted-foreground">{new Date(note.createdAt as number).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => autoFillMutation.mutate({ patientId, sessionId: note.sessionId as number, noteId: note.id as number })}
            disabled={autoFillMutation.isPending}
            className="gap-1.5 border-violet-400 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-900/20"
          >
            {autoFillMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {autoFillMutation.isPending ? "Gerando..." : "Preencher com IA"}
          </Button>
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Salvo
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              Erro ao salvar
            </span>
          )}
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending || saveStatus === "saving"} className="gap-1.5">
            {(updateMutation.isPending || saveStatus === "saving") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-1 w-max min-w-full border-b border-border pb-0">
          {subTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSubTab(t.value)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                subTab === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tab content */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Sessão */}
          {subTab === "session" && (
            <>
              <h4 className="text-sm font-semibold">Dados da Sessão</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nº da Sessão</Label>
                  <Input type="number" value={form.sessionNumber} onChange={set("sessionNumber")} placeholder="1" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Sessão</Label>
                  <Select value={form.sessionType2} onValueChange={(v) => setForm((p) => ({ ...p, sessionType2: v }))}>
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
                  <Label className="text-xs">Modalidade</Label>
                  <Select value={form.modality2} onValueChange={(v) => setForm((p) => ({ ...p, modality2: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Local</Label>
                  <Input value={form.sessionLocation} onChange={set("sessionLocation")} placeholder="Consultório, teleatendimento..." />
                </div>
              </div>
              <NoteField field="content" label="Anotações Gerais da Sessão" rows={4} placeholder="Resumo e observações gerais sobre a sessão..."  form={form} onChange={set} />
            </>
          )}

          {/* Avaliação */}
          {subTab === "assessment" && (
            <>
              <h4 className="text-sm font-semibold">Avaliação Clínica</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado Emocional</Label>
                  <Input value={form.emotionalState} onChange={set("emotionalState")} placeholder="Ex: Ansioso, Deprimido..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Humor Predominante</Label>
                  <Select value={form.predominantMood} onValueChange={(v) => setForm((p) => ({ ...p, predominantMood: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {["Eutímico", "Deprimido / Anedônico", "Ansioso / Tenso", "Irritável / Agitado", "Eufórico / Expansivo", "Lábil", "Embotado / Apático", "Outro"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nível de Sofrimento: {form.sufferingLevel}/10</Label>
                <input type="range" min="0" max="10" value={form.sufferingLevel} onChange={set("sufferingLevel")} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>0 - Sem sofrimento</span><span>10 - Sofrimento extremo</span></div>
              </div>
              <NoteField field="currentMedications" label="Medicações em Uso" rows={2} placeholder="Medicamentos que o paciente está tomando..."  form={form} onChange={set} />
              <NoteField field="generalPresentation" label="Apresentação Geral" rows={2} placeholder="Aparência, comportamento, postura..."  form={form} onChange={set} />
              <NoteField field="mainDemand" label="Demanda Principal" rows={2} placeholder="O que o paciente trouxe para a sessão..."  form={form} onChange={set} />
              <NoteField field="topicsAddressed" label="Temas Abordados" rows={3} placeholder="Tópicos discutidos durante a sessão..."  form={form} onChange={set} />
              <NoteField field="relevantNarrative" label="Narrativa Relevante" rows={3} placeholder="Falas e narrativas significativas do paciente..."  form={form} onChange={set} />
              <NoteField field="clinicalAssessment" label="Avaliação Clínica" rows={3} placeholder="Observações clínicas do profissional..."  form={form} onChange={set} />
              <NoteField field="technicalAnalysis" label="Análise Técnica" rows={2} placeholder="Abordagem teórica aplicada..."  form={form} onChange={set} />
            </>
          )}

          {/* Intervenções */}
          {subTab === "interventions" && (
            <>
              <h4 className="text-sm font-semibold">Intervenções & Planejamento</h4>
              <NoteField field="techniquesUsed" label="Técnicas Utilizadas" rows={3} placeholder="TCC, escuta ativa, reestruturação cognitiva..."  form={form} onChange={set} />
              <NoteField field="plannedInterventions" label="Intervenções Planejadas" rows={3} placeholder="Próximas intervenções a serem aplicadas..."  form={form} onChange={set} />
              <NoteField field="homework" label="Tarefa de Casa" rows={2} placeholder="Atividades sugeridas para o paciente entre sessões..."  form={form} onChange={set} />
              <NoteField field="therapeuticPlan" label="Planejamento Terapêutico" rows={3} placeholder="Plano de tratamento e etapas futuras..."  form={form} onChange={set} />
            </>
          )}

          {/* Evolução */}
          {subTab === "evolution" && (
            <>
              <h4 className="text-sm font-semibold">Evolução do Tratamento</h4>
              <NoteField field="treatmentResponse" label="Resposta ao Tratamento" rows={3} placeholder="Como o paciente está respondendo ao tratamento..."  form={form} onChange={set} />
              <NoteField field="goalsProgress" label="Progresso dos Objetivos" rows={3} placeholder="Avanços nos objetivos terapêuticos..."  form={form} onChange={set} />
              <NoteField field="observedInsights" label="Insights Observados" rows={3} placeholder="Momentos de insight, autopercepção..."  form={form} onChange={set} />
              <NoteField field="observedResistances" label="Resistências Observadas" rows={3} placeholder="Resistências, evitações, mecanismos de defesa..."  form={form} onChange={set} />
            </>
          )}

          {/* Próxima */}
          {subTab === "next" && (
            <>
              <h4 className="text-sm font-semibold">Próxima Sessão</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Data da Próxima Sessão</Label>
                <Input type="date" value={form.nextSessionDate} onChange={set("nextSessionDate")} />
              </div>
              <NoteField field="nextSessionGoals" label="Objetivos para a Próxima Sessão" rows={3} placeholder="O que será trabalhado na próxima sessão..."  form={form} onChange={set} />
              <NoteField field="treatmentPlanAdjustments" label="Ajustes no Plano de Tratamento" rows={3} placeholder="Mudanças necessárias no plano terapêutico..."  form={form} onChange={set} />
            </>
          )}

          {/* Riscos */}
          {subTab === "risks" && (
            <>
              <h4 className="text-sm font-semibold">Avaliação de Risco</h4>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Avalie cuidadosamente cada indicador de risco. Em caso de risco alto ou extremo, acione os protocolos de segurança.
                </p>
              </div>
              <RiskSelector field="selfHarmRisk" label="Risco de Prejuízo a Si" />
              <RiskSelector field="thirdPartyRisk" label="Risco a Terceiros" />
              <RiskSelector field="suicideRisk" label="Risco de Suicídio" />
            </>
          )}

          {/* Privado */}
          {subTab === "private" && (
            <>
              <h4 className="text-sm font-semibold">Anotações Clínicas Privadas</h4>
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Estas anotações são de uso exclusivo do profissional. Não são incluídas em relatórios ou documentos compartilhados com o paciente.
                </p>
              </div>
              <NoteField field="countertransference" label="Contratransferência" rows={3} placeholder="Sentimentos e reações do profissional durante a sessão..."  form={form} onChange={set} />
              <NoteField field="clinicalHypotheses" label="Hipóteses Clínicas" rows={3} placeholder="Hipóteses diagnósticas e de compreensão do caso..."  form={form} onChange={set} />
              <NoteField field="supervisionNotes" label="Dúvidas para Supervisão" rows={3} placeholder="Pontos a levar para supervisão clínica..."  form={form} onChange={set} />
              <NoteField field="referrals" label="Encaminhamentos" rows={2} placeholder="Encaminhamentos realizados ou necessários..."  form={form} onChange={set} />
              <NoteField field="privateObservations" label="Observações Adicionais" rows={3} placeholder="Qualquer informação adicional relevante..."  form={form} onChange={set} />
            </>
          )}

          {/* Análise IA */}
          {subTab === "ai" && (
            <>
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" /> Feedback Técnico por IA
              </h4>
              <div className="space-y-2">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    A análise é gerada por Inteligência Artificial e serve como ferramenta de apoio para aprimoramento técnico do prontuário.{" "}
                    <span className="font-semibold">Não substitui o julgamento clínico do profissional.</span>
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    💡 Para maior eficácia da análise, preencha a ampla maioria dos campos do prontuário nas diversas seções antes de solicitar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => aiFeedbackMutation.mutate({ noteId: note.id as number })}
                  disabled={aiFeedbackMutation.isPending}
                  className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {aiFeedbackMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {aiFeedback ? "Solicitar Nova Análise" : "Solicitar Análise"}
                </Button>
                {aiFeedbackAt && (
                  <p className="text-xs text-muted-foreground">
                    Última análise: {new Date(aiFeedbackAt).toLocaleDateString("pt-BR")} às {new Date(aiFeedbackAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              {aiFeedbackMutation.isPending && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-purple-500 animate-spin" />
                    <p className="text-sm font-medium">Gerando feedback técnico...</p>
                    <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos.</p>
                  </CardContent>
                </Card>
              )}
              {aiFeedback && !aiFeedbackMutation.isPending && (
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resultado da Análise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                      <MarkdownRenderer>{aiFeedback}</MarkdownRenderer>
                    </div>
                  </CardContent>
                </Card>
              )}
              {!aiFeedback && !aiFeedbackMutation.isPending && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma análise gerada ainda.</p>
                    <p className="text-xs mt-1">Clique em "Solicitar Análise" para gerar o feedback técnico.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Timeline Display ──────────────────────────────────────────────────────────
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
      {global && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Análise Histórica Global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {global.summary && <p className="text-sm leading-relaxed">{String(global.summary)}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.isArray(global.identifiedPatterns) && global.identifiedPatterns.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Padrões Identificados</p>
                  <ul className="space-y-1">{(global.identifiedPatterns as string[]).map((p, i) => <li key={i} className="text-xs flex items-start gap-1.5"><ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />{p}</li>)}</ul>
                </div>
              )}
              {Array.isArray(global.concreteProgress) && global.concreteProgress.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Progressos Concretos</p>
                  <ul className="space-y-1">{(global.concreteProgress as string[]).map((p, i) => <li key={i} className="text-xs flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />{p}</li>)}</ul>
                </div>
              )}
            </div>
            {Array.isArray(global.attentionPoints) && global.attentionPoints.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Pontos de Atenção</p>
                <ul className="space-y-1">{(global.attentionPoints as string[]).map((p, i) => <li key={i} className="text-xs flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0 mt-0.5" />{p}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {lastSession && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> Análise do Último Atendimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastSession.summary && <p className="text-sm leading-relaxed">{String(lastSession.summary)}</p>}
            {lastSession.riskAnalysis && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Análise de Risco</p>
                <p className="text-sm">{String(lastSession.riskAnalysis)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {nextGuidance && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-green-500" /> Orientação para Próxima Sessão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextGuidance.suggestedFocus && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Foco Sugerido</p>
                <p className="text-sm">{String(nextGuidance.suggestedFocus)}</p>
              </div>
            )}
            {nextGuidance.immediateRecommendation && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Recomendação Imediata</p>
                <p className="text-sm">{String(nextGuidance.immediateRecommendation)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {Array.isArray(evolution) && evolution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Evolução do Nível de Sofrimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24 mt-2">
              {evolution.map((e, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{e.level}</span>
                  <div className="w-full rounded-t-sm bg-primary/70 transition-all" style={{ height: `${(e.level / 10) * 80}px` }} title={`Sessão ${e.session}: ${e.date}`} />
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

// ── Edit Patient Dialog (with CEP/ViaCEP + insurance) ─────────────────────────
function EditPatientDialog({ patient, open, onClose, onSuccess }: {
  patient: Record<string, unknown>;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeSection, setActiveSection] = useState("basic");
  const [form, setForm] = useState(() => ({
    name: (patient.name as string) ?? "",
    email: (patient.email as string) ?? "",
    phone: (patient.phone as string) ?? "",
    phone2: ((patient as Record<string, unknown>).phone2 as string) ?? "",
    birthDate: (patient.birthDate as string) ?? "",
    cpf: (patient.cpf as string) ?? "",
    gender: ((patient as Record<string, unknown>).gender as string) ?? "",
    maritalStatus: ((patient as Record<string, unknown>).maritalStatus as string) ?? "",
    schooling: ((patient as Record<string, unknown>).schooling as string) ?? "",
    religion: ((patient as Record<string, unknown>).religion as string) ?? "",
    occupation: (patient.occupation as string) ?? "",
    referredBy: (patient.referredBy as string) ?? "",
    // Endereço
    zipCode: ((patient as Record<string, unknown>).zipCode as string) ?? "",
    address: (patient.address as string) ?? "",
    addressNumber: ((patient as Record<string, unknown>).addressNumber as string) ?? "",
    addressComplement: ((patient as Record<string, unknown>).addressComplement as string) ?? "",
    neighborhood: ((patient as Record<string, unknown>).neighborhood as string) ?? "",
    city: ((patient as Record<string, unknown>).city as string) ?? "",
    state: ((patient as Record<string, unknown>).state as string) ?? "",
    // Emergência
    emergencyContact: (patient.emergencyContact as string) ?? "",
    emergencyPhone: (patient.emergencyPhone as string) ?? "",
    // Convênio
    insuranceName: ((patient as Record<string, unknown>).insuranceName as string) ?? "",
    insuranceNumber: ((patient as Record<string, unknown>).insuranceNumber as string) ?? "",
    insurancePlan: ((patient as Record<string, unknown>).insurancePlan as string) ?? "",
    insuranceExpiry: ((patient as Record<string, unknown>).insuranceExpiry as string) ?? "",
    // Clínico
    mainComplaint: (patient.mainComplaint as string) ?? "",
    medications: (patient.medications as string) ?? "",
    notes: (patient.notes as string) ?? "",
    sessionValue: (patient.sessionValue as string) ?? "",
    status: (patient.status as string) ?? "active",
  }));
  const [cepLoading, setCepLoading] = useState(false);

  const updateMutation = trpc.patients.update.useMutation({
    onSuccess: () => { toast.success("Paciente atualizado!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const lookupCep = async () => {
    const cep = form.zipCode.replace(/\D/g, "");
    if (cep.length !== 8) { toast.error("CEP inválido. Digite 8 dígitos."); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado."); return; }
      setForm((p) => ({
        ...p,
        address: data.logradouro ?? p.address,
        neighborhood: data.bairro ?? p.neighborhood,
        city: data.localidade ?? p.city,
        state: data.uf ?? p.state,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setCepLoading(false);
    }
  };

  const sections = [
    { id: "basic", label: "Dados Básicos" },
    { id: "contact", label: "Contato" },
    { id: "address", label: "Endereço" },
    { id: "insurance", label: "Convênio" },
    { id: "clinical", label: "Clínico" },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Paciente — {patient.name as string}</DialogTitle>
        </DialogHeader>

        {/* Section nav */}
        <div className="flex gap-1 border-b border-border pb-2 overflow-x-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${activeSection === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: patient.id as number, ...form, gender: form.gender as "male" | "female" | "other" | "prefer_not_to_say" || undefined, maritalStatus: form.maritalStatus as "single" | "married" | "divorced" | "widowed" | "stable_union" | "other" || undefined, schooling: form.schooling as "no_schooling" | "elementary" | "middle" | "high_school" | "college" | "postgrad" || undefined, status: form.status as "active" | "inactive" | "discharged" }); }} className="space-y-4 pt-2">

          {/* Dados Básicos */}
          {activeSection === "basic" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={set("name")} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.birthDate} onChange={set("birthDate")} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gênero</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado Civil</Label>
                  <Select value={form.maritalStatus} onValueChange={(v) => setForm((p) => ({ ...p, maritalStatus: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Solteiro(a)</SelectItem>
                      <SelectItem value="married">Casado(a)</SelectItem>
                      <SelectItem value="divorced">Divorciado(a)</SelectItem>
                      <SelectItem value="widowed">Viúvo(a)</SelectItem>
                      <SelectItem value="stable_union">União Estável</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Escolaridade</Label>
                  <Select value={form.schooling} onValueChange={(v) => setForm((p) => ({ ...p, schooling: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_schooling">Sem escolaridade</SelectItem>
                      <SelectItem value="elementary">Fundamental</SelectItem>
                      <SelectItem value="middle">Médio Incompleto</SelectItem>
                      <SelectItem value="high_school">Ensino Médio</SelectItem>
                      <SelectItem value="college">Superior</SelectItem>
                      <SelectItem value="postgrad">Pós-graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Religião</Label>
                  <Input value={form.religion} onChange={set("religion")} placeholder="Ex: Católica, Evangélica..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Profissão</Label>
                  <Input value={form.occupation} onChange={set("occupation")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Encaminhado por</Label>
                  <Input value={form.referredBy} onChange={set("referredBy")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="discharged">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor da Sessão (R$)</Label>
                  <Input value={form.sessionValue} onChange={set("sessionValue")} placeholder="200.00" />
                </div>
              </div>
            </div>
          )}

          {/* Contato */}
          {activeSection === "contact" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={set("email")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone Principal</Label>
                  <Input value={form.phone} onChange={set("phone")} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Telefone Secundário</Label>
                <Input value={form.phone2} onChange={set("phone2")} placeholder="(11) 99999-9999" />
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
            </div>
          )}

          {/* Endereço */}
          {activeSection === "address" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.zipCode}
                    onChange={set("zipCode")}
                    placeholder="00000-000"
                    maxLength={9}
                    onBlur={() => { if (form.zipCode.replace(/\D/g, "").length === 8) lookupCep(); }}
                  />
                  <Button type="button" variant="outline" onClick={lookupCep} disabled={cepLoading} className="shrink-0 gap-1.5">
                    {cepLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    Buscar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Digite o CEP e clique em Buscar para preencher automaticamente.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Rua / Logradouro</Label>
                  <Input value={form.address} onChange={set("address")} placeholder="Nome da rua" />
                </div>
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input value={form.addressNumber} onChange={set("addressNumber")} placeholder="123" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Complemento</Label>
                  <Input value={form.addressComplement} onChange={set("addressComplement")} placeholder="Apto, Bloco..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={form.neighborhood} onChange={set("neighborhood")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={form.city} onChange={set("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado (UF)</Label>
                  <Input value={form.state} onChange={set("state")} maxLength={2} placeholder="SP" />
                </div>
              </div>
            </div>
          )}

          {/* Convênio */}
          {activeSection === "insurance" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome do Convênio</Label>
                <Input value={form.insuranceName} onChange={set("insuranceName")} placeholder="Ex: Unimed, Bradesco Saúde..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Nº da Carteirinha</Label>
                  <Input value={form.insuranceNumber} onChange={set("insuranceNumber")} placeholder="0000000000000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo de Plano</Label>
                  <Input value={form.insurancePlan} onChange={set("insurancePlan")} placeholder="Ex: Enfermaria, Apartamento..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={form.insuranceExpiry} onChange={set("insuranceExpiry")} />
              </div>
            </div>
          )}

          {/* Clínico */}
          {activeSection === "clinical" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Queixa Principal</Label>
                <Textarea value={form.mainComplaint} onChange={set("mainComplaint")} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Medicamentos em Uso</Label>
                <Input value={form.medications} onChange={set("medications")} />
              </div>
              <div className="space-y-1.5">
                <Label>Observações Gerais</Label>
                <Textarea value={form.notes} onChange={set("notes")} rows={4} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-border">
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

// ── Upload Document Dialog ────────────────────────────────────────────────────
function UploadDocumentDialog({ patientId, open, onClose, onSuccess }: { patientId: number; open: boolean; onClose: () => void; onSuccess: () => void }) {
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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Anexar Documento</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (!fileData || !fileName) { toast.error("Selecione um arquivo"); return; } uploadMutation.mutate({ patientId, fileName, mimeType: fileData.mimeType, fileSize: fileData.size, category, description, fileBase64: fileData.base64 }); }} className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName ? <p className="text-sm font-medium text-primary">{fileName}</p> : <><p className="text-sm font-medium">Clique para selecionar</p><p className="text-xs text-muted-foreground mt-1">PDF, imagens, Word — máx. 16MB</p></>}
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

// ── Upload Recording Dialog ───────────────────────────────────────────────────
function UploadRecordingDialog({ patientId, open, onClose, onSuccess }: { patientId: number; open: boolean; onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; size: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const uploadMutation = trpc.recordings.upload.useMutation({
    onSuccess: () => { toast.success("Gravação enviada e transcrição iniciada!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  // Iniciar gravação
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setRecordedAudioUrl(null);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        
        // Converter para base64
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = (ev.target?.result as string).split(",")[1];
          setFileData({ base64, mimeType: 'audio/webm', size: audioBlob.size });
          setFileName(`Gravação_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`);
        };
        reader.readAsDataURL(audioBlob);
        
        // Parar stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();

      // Timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao acessar microfone. Verifique as permissões.");
      console.error(error);
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  // Upload de arquivo
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
    if (!fileData || !fileName) { toast.error("Nenhuma gravação selecionada"); return; }
    uploadMutation.mutate({ patientId, fileName, fileBase64: fileData.base64, mimeType: fileData.mimeType, fileSize: fileData.size });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) { stopRecording(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Adicionar Gravação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Gravador de áudio */}
          <div className="border-2 border-primary/30 rounded-xl p-6 bg-primary/5 space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
                <Mic className={`h-8 w-8 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
              </div>
              <p className="text-sm font-semibold">Gravador de Áudio</p>
              {isRecording && <p className="text-xs text-muted-foreground mt-1">Tempo: {formatTime(recordingTime)}</p>}
            </div>
            
            <div className="flex gap-2">
              {!isRecording ? (
                <Button type="button" onClick={startRecording} className="flex-1 gap-2" size="sm">
                  <Mic className="h-4 w-4" /> Iniciar Gravação
                </Button>
              ) : (
                <Button type="button" onClick={stopRecording} variant="destructive" className="flex-1 gap-2" size="sm">
                  <Square className="h-4 w-4" /> Parar Gravação
                </Button>
              )}
            </div>
          </div>

          {/* Preview de áudio gravado */}
          {recordedAudioUrl && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Gravação Realizada</p>
              <audio controls className="w-full h-10" src={recordedAudioUrl} />
            </div>
          )}

          {/* Upload de arquivo */}
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileRef.current?.click()}>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {fileName && !recordedAudioUrl ? <p className="text-sm font-medium text-primary">{fileName}</p> : <><p className="text-sm font-medium">Ou selecione um arquivo</p><p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A, OGG — máx. 16MB</p></>}
            <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept=".mp3,.wav,.m4a,.ogg,.webm" />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Após o upload, a transcrição será iniciada automaticamente.</p>
          </div>
          
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => { stopRecording(); onClose(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={uploadMutation.isPending || !fileData}>
              {uploadMutation.isPending ? "Enviando..." : "Enviar e Transcrever"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
