import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SessionTabInterventionsProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export function SessionTabInterventions({ data, onUpdate }: SessionTabInterventionsProps) {
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
        <Label htmlFor="techniquesUsed">Técnicas Utilizadas</Label>
        <Textarea
          id="techniquesUsed"
          placeholder="Quais técnicas foram utilizadas?"
          value={localData?.techniquesUsed || ""}
          onChange={(e) => handleChange("techniquesUsed", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plannedInterventions">Intervenções Planejadas</Label>
        <Textarea
          id="plannedInterventions"
          placeholder="Quais intervenções foram planejadas?"
          value={localData?.plannedInterventions || ""}
          onChange={(e) => handleChange("plannedInterventions", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="homework">Tarefa de Casa</Label>
        <Textarea
          id="homework"
          placeholder="Qual é a tarefa de casa para o paciente?"
          value={localData?.homework || ""}
          onChange={(e) => handleChange("homework", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="therapeuticPlan">Planejamento Terapêutico</Label>
        <Textarea
          id="therapeuticPlan"
          placeholder="Descreva o planejamento terapêutico..."
          value={localData?.therapeuticPlan || ""}
          onChange={(e) => handleChange("therapeuticPlan", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
