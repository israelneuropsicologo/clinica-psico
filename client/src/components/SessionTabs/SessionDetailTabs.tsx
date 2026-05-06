import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
}: SessionDetailTabsProps) {
  const [currentTabId, setCurrentTabId] = useState(0);
  const [localData, setLocalData] = useState(data || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalData(data || {});
  }, [data]);

  // Autosave com debounce
  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      setLocalData((prev: any) => {
        const updated = { ...prev, [field]: value };
        setHasChanges(true);

        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        const newTimeout = setTimeout(() => {
          try {
            onSave(updated);
            setHasChanges(false);
          } catch (error) {
            console.error("Erro ao autosalvar:", error);
          }
        }, 1000);

        setSaveTimeout(newTimeout);
        return updated;
      });
    },
    [onSave, saveTimeout]
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
    if (saveTimeout) {
      clearTimeout(saveTimeout);
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
    <div className="space-y-4 w-full">
      {/* Header */}
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
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <Card className="border">
        <CardContent className="pt-6">
          {currentTabId === 0 && (
            <SessionTabSession
              data={localData}
              onUpdate={handleFieldUpdate}
              patients={patients}
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
            <SessionTabAI
              data={localData}
              onAnalyze={onAnalyze}
              isLoading={isAnalyzing}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          onClick={handlePreviousTab}
          disabled={currentTabId === 0}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="text-sm text-muted-foreground">
          {currentTab.label} ({currentTabId + 1}/{TABS.length})
        </div>

        <Button
          onClick={handleNextTab}
          disabled={currentTabId === TABS.length - 1}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
