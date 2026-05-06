import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
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
  onSave: (data: any) => Promise<void>;
  onAnalyze: () => Promise<void>;
  isSaving?: boolean;
  isAnalyzing?: boolean;
}

const tabs = [
  { id: "sessao", label: "Sessão", icon: "📋" },
  { id: "avaliacao", label: "Avaliação", icon: "📊" },
  { id: "intervencoes", label: "Intervenções", icon: "🎯" },
  { id: "evolucao", label: "Evolução", icon: "📈" },
  { id: "proxima", label: "Próxima", icon: "🔮" },
  { id: "riscos", label: "Riscos", icon: "⚠️" },
  { id: "privado", label: "Privado", icon: "🔒" },
  { id: "analise-ia", label: "Análise IA", icon: "🤖" },
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
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [localData, setLocalData] = useState(data);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Autosave com debounce
  const handleFieldUpdate = useCallback(
    (field: string, value: any) => {
      setLocalData((prev: any) => {
        const updated = { ...prev, [field]: value };
        setHasChanges(true);

        // Limpar timeout anterior
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // Definir novo timeout para autosave
        const newTimeout = setTimeout(() => {
          onSave(updated);
          setHasChanges(false);
        }, 1000); // 1 segundo de debounce

        setSaveTimeout(newTimeout);
        return updated;
      });
    },
    [onSave, saveTimeout]
  );

  const handlePreviousTab = () => {
    if (currentTabIndex > 0) {
      setCurrentTabIndex(currentTabIndex - 1);
    }
  };

  const handleNextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setCurrentTabIndex(currentTabIndex + 1);
    }
  };

  const handleManualSave = async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    await onSave(localData);
    setHasChanges(false);
  };

  const currentTab = tabs[currentTabIndex];

  return (
    <div className="space-y-4">
      {/* Header com indicador de progresso */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Editar Prontuário</h3>
          <p className="text-sm text-muted-foreground">
            Página {currentTabIndex + 1} de {tabs.length}
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && <span className="text-xs text-orange-600 font-medium">● Não salvo</span>}
          <Button
            onClick={handleManualSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            variant="outline"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab.id} onValueChange={(tabId) => {
        const index = tabs.findIndex((t) => t.id === tabId);
        if (index !== -1) setCurrentTabIndex(index);
      }}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Aba: Sessão */}
        <TabsContent value="sessao" className="space-y-4">
          <SessionTabSession data={localData} onUpdate={handleFieldUpdate} patients={patients} />
        </TabsContent>

        {/* Aba: Avaliação */}
        <TabsContent value="avaliacao" className="space-y-4">
          <SessionTabAvaliacao data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Intervenções */}
        <TabsContent value="intervencoes" className="space-y-4">
          <SessionTabInterventions data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Evolução */}
        <TabsContent value="evolucao" className="space-y-4">
          <SessionTabEvolution data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Próxima */}
        <TabsContent value="proxima" className="space-y-4">
          <SessionTabNext data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Riscos */}
        <TabsContent value="riscos" className="space-y-4">
          <SessionTabRisks data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Privado */}
        <TabsContent value="privado" className="space-y-4">
          <SessionTabPrivate data={localData} onUpdate={handleFieldUpdate} />
        </TabsContent>

        {/* Aba: Análise IA */}
        <TabsContent value="analise-ia" className="space-y-4">
          <SessionTabAI data={localData} onAnalyze={onAnalyze} isLoading={isAnalyzing} />
        </TabsContent>
      </Tabs>

      {/* Navegação entre abas */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          onClick={handlePreviousTab}
          disabled={currentTabIndex === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentTab.label} ({currentTabIndex + 1}/{tabs.length})
        </span>

        <Button
          onClick={handleNextTab}
          disabled={currentTabIndex === tabs.length - 1}
          variant="outline"
          size="sm"
        >
          Próxima
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
