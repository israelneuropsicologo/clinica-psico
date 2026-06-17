// @ts-nocheck
import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import RichTextEditor from "@/components/RichTextEditor";
import PDFExportButton from "@/components/PDFExportButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle,
  Clock,
  Loader2,
  Save,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SessionDetailTabs } from "@/components/SessionTabs/SessionDetailTabs";
import { AIAnalysisResult } from "@/components/AIAnalysisResult";
import { formatDateSaoPaulo } from "@/lib/timezone";

function formatDate(ts: number) {
  return formatDateSaoPaulo(ts, {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { data: session, refetch: refetchSession } = trpc.sessions.getById.useQuery({ id: sessionId });
  const { data: notes, refetch: refetchNotes } = trpc.clinicalNotes.bySession.useQuery({ sessionId });
  const { data: patient } = trpc.patients.getById.useQuery(
    { id: session?.patientId ?? 0 },
    { enabled: !!session?.patientId }
  );
  const { data: patientNotes } = trpc.clinicalNotes.byPatient.useQuery(
    { patientId: session?.patientId ?? 0 },
    { enabled: !!session?.patientId }
  );

  // Legacy fields (kept for backward compatibility)
  const [noteContent, setNoteContent] = useState("");
  const [mood, setMood] = useState<"very_bad" | "bad" | "neutral" | "good" | "very_good">("neutral");
  const [progressRating, setProgressRating] = useState(5);
  const [goals, setGoals] = useState("");
  const [interventions, setInterventions] = useState("");
  const [homework, setHomework] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // New 8-tabs data structure
  const [tabsData, setTabsData] = useState<any>({
    // Session tab
    sessionNumber: 0,
    sessionType2: "individual",
    modality2: "in_person",
    sessionLocation: "",
    // Avaliacao tab
    emotionalState: "",
    predominantMood: "",
    sufferingLevel: 5,
    currentMedications: "",
    generalPresentation: "",
    mainDemand: "",
    topicsAddressed: "",
    relevantNarrative: "",
    clinicalAssessment: "",
    technicalAnalysis: "",
    // Interventions tab
    techniquesUsed: "",
    plannedInterventions: "",
    therapeuticPlan: "",
    // Evolution tab
    treatmentResponse: "",
    goalsProgress: "",
    observedInsights: "",
    observedResistances: "",
    // Next tab
    nextSessionDate: "",
    nextSessionGoals: "",
    treatmentPlanAdjustments: "",
    // Risks tab
    selfHarmRisk: "absent",
    thirdPartyRisk: "absent",
    suicideRisk: "absent",
    // Private tab
    countertransference: "",
    clinicalHypotheses: "",
    supervisionNotes: "",
    referrals: "",
    privateObservations: "",
    // AI tab
    aiTechnicalFeedback: "",
  });
  const { data: patients } = trpc.patients.list.useQuery({ limit: 1000 });

  const existingNote = notes?.[0];
  const trpcUtils = trpc.useUtils();

  useEffect(() => {
    if (existingNote) {
      // Load legacy fields
      setNoteContent(existingNote.content);
      setMood((existingNote.mood as typeof mood) ?? "neutral");
      setProgressRating(existingNote.progressRating ?? 5);
      setGoals(existingNote.goals ?? "");
      setInterventions(existingNote.interventions ?? "");
      setHomework(existingNote.homework ?? "");
      setAiResult(existingNote.aiSuggestions ?? "");
      setEditingNoteId(existingNote.id);

      // Load new 8-tabs data
      setTabsData({
        sessionNumber: existingNote.sessionNumber ?? 0,
        sessionType2: existingNote.sessionType2 ?? "individual",
        modality2: existingNote.modality2 ?? "in_person",
        sessionLocation: existingNote.sessionLocation ?? "",
        emotionalState: existingNote.emotionalState ?? "",
        predominantMood: existingNote.predominantMood ?? "",
        sufferingLevel: existingNote.sufferingLevel ?? 5,
        currentMedications: existingNote.currentMedications ?? "",
        generalPresentation: existingNote.generalPresentation ?? "",
        mainDemand: existingNote.mainDemand ?? "",
        topicsAddressed: existingNote.topicsAddressed ?? "",
        relevantNarrative: existingNote.relevantNarrative ?? "",
        clinicalAssessment: existingNote.clinicalAssessment ?? "",
        technicalAnalysis: existingNote.technicalAnalysis ?? "",
        techniquesUsed: existingNote.techniquesUsed ?? "",
        plannedInterventions: existingNote.plannedInterventions ?? "",
        therapeuticPlan: existingNote.therapeuticPlan ?? "",
        treatmentResponse: existingNote.treatmentResponse ?? "",
        goalsProgress: existingNote.goalsProgress ?? "",
        observedInsights: existingNote.observedInsights ?? "",
        observedResistances: existingNote.observedResistances ?? "",
        nextSessionDate: existingNote.nextSessionDate ?? "",
        nextSessionGoals: existingNote.nextSessionGoals ?? "",
        treatmentPlanAdjustments: existingNote.treatmentPlanAdjustments ?? "",
        selfHarmRisk: existingNote.selfHarmRisk ?? "absent",
        thirdPartyRisk: existingNote.thirdPartyRisk ?? "absent",
        suicideRisk: existingNote.suicideRisk ?? "absent",
        countertransference: existingNote.countertransference ?? "",
        clinicalHypotheses: existingNote.clinicalHypotheses ?? "",
        supervisionNotes: existingNote.supervisionNotes ?? "",
        referrals: existingNote.referrals ?? "",
        privateObservations: existingNote.privateObservations ?? "",
        aiTechnicalFeedback: existingNote.aiTechnicalFeedback ?? "",
      });
    }
  }, [existingNote]);

  const createNote = trpc.clinicalNotes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Prontuário salvo!");
      setEditingNoteId(data.id);
      refetchNotes();
      trpcUtils.clinicalNotes.byPatient.invalidate({ patientId: session?.patientId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateNote = trpc.clinicalNotes.update.useMutation({
    onSuccess: () => {
      toast.success("Prontuário atualizado!");
      refetchNotes();
      trpcUtils.clinicalNotes.byPatient.invalidate({ patientId: session?.patientId });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSession = trpc.sessions.update.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetchSession(); },
    onError: (e) => toast.error(e.message),
  });

  const analyzeAI = trpc.clinicalNotes.analyzeWithAI.useMutation({
    onSuccess: (data) => {
      setAiResult(data.suggestions);
      toast.success("Análise de IA concluída!");
    },
    onError: (e) => toast.error(`Erro na IA: ${e.message}`),
  });

  const handleSaveNote = (updatedData?: any) => {
    // Usar functional update para evitar closure stale
    setTabsData((prevTabsData: any) => {
      const dataToSave = {
        ...prevTabsData,
        ...updatedData,
        content: noteContent,
        mood,
        progressRating,
        goals,
        interventions,
        homework,
      };

      // Validate required fields
      if (!session?.patientId) {
        toast.error("Paciente não selecionado.");
        return prevTabsData;
      }

      if (editingNoteId) {
        updateNote.mutate({ id: editingNoteId, ...dataToSave });
      } else {
        createNote.mutate({
          sessionId,
          patientId: session.patientId,
          ...dataToSave,
        });
      }
      
      return dataToSave;
    });
  };

  const handleAnalyzeAI = () => {
    if (!noteContent.trim()) { toast.error("Escreva as anotações antes de analisar."); return; }
    const noteIdToUse = editingNoteId;
    if (!noteIdToUse) { toast.error("Salve o prontuário antes de analisar."); return; }
    const history = patientNotes
      ?.slice(0, 5)
      .map((n) => n.content.replace(/<[^>]*>/g, ""))
      .join("\n---\n");
    analyzeAI.mutate({ noteId: noteIdToUse, content: noteContent.replace(/<[^>]*>/g, ""), patientHistory: history });
  };

  const generateSessionPDFMutation = trpc.reports.generateSessionPDF.useMutation();

  const handleExportSessionPDF = async () => {
    const result = await generateSessionPDFMutation.mutateAsync({ sessionId });
    return result;
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sessions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">
              {patient ? patient.name : `Paciente #${session.patientId}`}
            </h1>
            <p className="text-muted-foreground text-sm">{formatDate(session.scheduledAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <PDFExportButton
              label="Exportar PDF"
              onExportPDF={handleExportSessionPDF}
            />
            <StatusBadge status={session.status} />
          </div>
        </div>

        {/* Session Info + Status Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {session.durationMinutes} min
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {session.sessionType === "individual" ? "Individual" : session.sessionType}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {session.modality === "online" ? "Online" : "Presencial"}
                </span>
                {session.sessionValue && (
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(session.sessionValue))}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {session.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    onClick={() => updateSession.mutate({ id: sessionId, status: "completed", isPaid: session.isPaid })}
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Marcar como Realizada
                  </Button>
                )}
                {session.status !== "cancelled" && session.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => updateSession.mutate({ id: sessionId, status: "cancelled" })}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                )}
                <Select
                  value={session.isPaid}
                  onValueChange={(v) => updateSession.mutate({ id: sessionId, isPaid: v as "pending" | "paid" | "waived" })}
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="waived">Isento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Clinical Notes Editor */}
          <div className="xl:col-span-2 space-y-4">
            <SessionDetailTabs
              sessionId={sessionId.toString()}
              data={tabsData}
              patients={[]}
              preSelectedPatientId={session?.patientId}
              preSelectedPatientName={patient?.name}
              noteId={editingNoteId ?? undefined}
              onSave={(updatedData) => {
                setTabsData({ ...tabsData, ...updatedData });
                if (isMountedRef.current) {
                  handleSaveNote(updatedData);
                }
              }}
              onAnalyze={handleAnalyzeAI}
              isSaving={createNote.isPending || updateNote.isPending}
              isAnalyzing={analyzeAI.isPending}
            />
          </div>

          {/* AI Panel */}
          <div className="space-y-4">
            <Card className="border-accent/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  Assistente Clínico IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analyzeAI.isPending ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    <p className="text-sm text-center">Analisando anotações clínicas...</p>
                  </div>
                ) : aiResult ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <MarkdownRenderer>{aiResult}</MarkdownRenderer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">Assistente IA disponível</p>
                    <p className="text-xs mt-1 leading-relaxed">
                      Salve o prontuário e clique em "Analisar com IA" para obter sugestões clínicas, resumo da sessão e análise de evolução do paciente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Notes Summary */}
            {patientNotes && patientNotes.length > 1 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Histórico Recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {patientNotes.slice(1, 4).map((note) => (
                    <div key={note.id} className="text-xs text-muted-foreground border-l-2 border-border pl-3 py-1">
                      <p className="font-medium text-foreground mb-0.5">
                        {new Date(note.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="line-clamp-2">{note.content.replace(/<[^>]*>/g, "")}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
