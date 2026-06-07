
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SessionTabSession } from "./SessionTabSession";
import { SessionTabAvaliacao } from "./SessionTabAvaliacao";
import { SessionTabInterventions } from "./SessionTabInterventions";
import { SessionTabEvolution } from "./SessionTabEvolution";
import { SessionTabNext } from "./SessionTabNext";
import { SessionTabRisks } from "./SessionTabRisks";
import { SessionTabPrivate } from "./SessionTabPrivate";
import { SessionTabAI } from "./SessionTabAI";

interface SessionDetailTabsProps {
  sessionId: string;
  data: any;
  patients: any[];
  onSave: (data: any) => void;
  onAnalyze: () => Promise<void>;
  isSaving?: boolean;
  isAnalyzing?: boolean;
  preSelectedPatientId?: number;
  preSelectedPatientName?: string;
  noteId?: number;
}

const TABS = [
  { id: 0, label: "Sessão", icon: "📋" },
  { id: 1, label: "Avaliação", icon: "📊" },
  { id: 2, label: "Intervenções", icon: "🎯" },
  { id: 3, label: "Evolução", icon: "📈" },
  { id: 4, label: "Próxima", icon: "🔮" },
  { id: 5, label: "Riscos", icon: "⚠️" },
  { id: 6, label: "Privado", icon: "🔒" },
  { id: 7, label: "Análise IA", icon: "🤖" },
];

export function SessionDetailTabs({
  sessionId,
  data,
  patients,
  onSave,
  onAnalyze,
  isSaving = false,
  isAnalyzing = false,
  preSelectedPatientId,
  preSelectedPatientName,
  noteId,
}: SessionDetailTabsProps) {

  const [currentTabId, setCurrentTabId] = useState(0);
  const [localData, setLocalData] = useState(data || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const autoFillMutation = trpc.clinicalNotes.autoFill.useMutation();
  const utils = trpc.useUtils();



  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setLocalData(data || {});
  }, [data]);

  // Autosave com debounce - CORRIGIDO
  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      setLocalData((prev: any) => {
        const updated = { ...prev, [field]: value };
        setHasChanges(true);

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            try {
              onSave(updated);
              setHasChanges(false);
            } catch (error) {
              console.error("Erro ao autosalvar:", error);
            }
          }
        }, 1000);

        return updated;
      });
    },
    [onSave]
  );

  const handlePreviousTab = () => {
    if (currentTabId > 0) {
      setCurrentTabId(currentTabId - 1);
    }
  };

  const handleNextTab = () => {
    if (currentTabId < TABS.length - 1) {
      setCurrentTabId(currentTabId + 1);
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    try {
      onSave(localData);
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const currentTab = TABS[currentTabId];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Editar Prontuário</h3>
          <p className="text-sm text-muted-foreground">
            {currentTab.label} ({currentTabId + 1} de {TABS.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
              Não salvo
            </span>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (preSelectedPatientId) {
                // Garantir conversao segura para numeros
                const patientIdNum = Number(preSelectedPatientId);
                const sessionIdNum = Number(sessionId);
                const noteIdNum = noteId ? Number(noteId) : 0;
                
                if (isNaN(patientIdNum) || isNaN(sessionIdNum) || patientIdNum <= 0 || sessionIdNum <= 0) {
                  toast.error("IDs inválidos para preenchimento com IA");
                  return;
                }
                
                // Se não tem noteId, usar 0 para indicar que a IA deve criar uma nova nota
                const finalNoteId = noteIdNum && !isNaN(noteIdNum) ? noteIdNum : 0;
                
                autoFillMutation.mutate(
                  { patientId: patientIdNum, sessionId: sessionIdNum, noteId: finalNoteId },
                  {
                    onSuccess: (data) => {
                      console.log("[autoFill] Sucesso:", data);
                      // Preencher os campos com os dados da IA
                      onSave(data);
                      toast.success("Prontuário preenchido com IA!");
                      utils.clinicalNotes.bySession.invalidate();
                    },
                    onError: (error) => {
                      console.error("[autoFill] Erro:", error);
                      toast.error("Erro ao preencher com IA: " + error.message);
                    },
                  }
                );
              } else {
                toast.error("Nenhum paciente selecionado para preenchimento com IA");
              }
            }}
            disabled={autoFillMutation.isPending || !preSelectedPatientId}
            className="gap-1.5 border-violet-400 text-violet-600 hover:bg-violet-50 dark:border-violet-500 dark:text-violet-400 dark:hover:bg-violet-900/20"
          >
            {autoFillMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {autoFillMutation.isPending ? "Gerando..." : "Preencher com IA"}
          </Button>

          <Button
            onClick={handleManualSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Stepper - Horizontal tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTabId(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentTabId === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Content */}
      <div className="border rounded-lg p-4 bg-card">
        {currentTabId === 0 && (
          <SessionTabSession
            data={localData}
            onUpdate={handleFieldUpdate}
            patients={patients}
            preSelectedPatientId={preSelectedPatientId}
            preSelectedPatientName={preSelectedPatientName}
          />
        )}
        {currentTabId === 1 && (
          <SessionTabAvaliacao data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 2 && (
          <SessionTabInterventions data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 3 && (
          <SessionTabEvolution data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 4 && (
          <SessionTabNext data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 5 && (
          <SessionTabRisks data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 6 && (
          <SessionTabPrivate data={localData} onUpdate={handleFieldUpdate} />
        )}
        {currentTabId === 7 && (
          <SessionTabAI data={localData} onAnalyze={onAnalyze} isLoading={isAnalyzing} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePreviousTab} disabled={currentTabId === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentTab.label} ({currentTabId + 1}/{TABS.length})
        </span>
        <Button variant="outline" onClick={handleNextTab} disabled={currentTabId === TABS.length - 1}>
          Próxima
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
