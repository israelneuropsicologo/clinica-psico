import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SessionTabEvolutionProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export function SessionTabEvolution({ data, onUpdate }: SessionTabEvolutionProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      {/* Resposta ao Tratamento */}
      <div className="space-y-2">
        <Label htmlFor="treatmentResponse">Resposta ao Tratamento</Label>
        <Textarea
          id="treatmentResponse"
          placeholder="Como o paciente está respondendo ao tratamento..."
          value={localData?.treatmentResponse || ""}
          onChange={(e) => handleChange("treatmentResponse", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Progresso dos Objetivos */}
      <div className="space-y-2">
        <Label htmlFor="objectiveProgress">Progresso dos Objetivos</Label>
        <Textarea
          id="objectiveProgress"
          placeholder="Avanços nos objetivos terapêuticos..."
          value={localData?.objectiveProgress || ""}
          onChange={(e) => handleChange("objectiveProgress", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Insights Observados */}
      <div className="space-y-2">
        <Label htmlFor="observedInsights">Insights Observados</Label>
        <Textarea
          id="observedInsights"
          placeholder="Momentos de insight, autopercepcão..."
          value={localData?.observedInsights || ""}
          onChange={(e) => handleChange("observedInsights", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Resistências Observadas */}
      <div className="space-y-2">
        <Label htmlFor="observedResistances">Resistências Observadas</Label>
        <Textarea
          id="observedResistances"
          placeholder="Resistências, evitações, mecanismos de defesa..."
          value={localData?.observedResistances || ""}
          onChange={(e) => handleChange("observedResistances", e.target.value)}
          className="min-h-32"
        />
      </div>
    </div>
  );
}
