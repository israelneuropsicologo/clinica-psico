import { useState, useEffect } from "react";
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
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="treatmentResponse">Resposta ao Tratamento</Label>
        <Textarea
          id="treatmentResponse"
          placeholder="Como o paciente respondeu ao tratamento?"
          value={localData?.treatmentResponse || ""}
          onChange={(e) => handleChange("treatmentResponse", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="goalsProgress">Progresso dos Objetivos</Label>
        <Textarea
          id="goalsProgress"
          placeholder="Qual foi o progresso em relação aos objetivos?"
          value={localData?.goalsProgress || ""}
          onChange={(e) => handleChange("goalsProgress", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observedInsights">Insights Observados</Label>
        <Textarea
          id="observedInsights"
          placeholder="Quais insights foram observados?"
          value={localData?.observedInsights || ""}
          onChange={(e) => handleChange("observedInsights", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observedResistances">Resistências Observadas</Label>
        <Textarea
          id="observedResistances"
          placeholder="Quais resistências foram observadas?"
          value={localData?.observedResistances || ""}
          onChange={(e) => handleChange("observedResistances", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
