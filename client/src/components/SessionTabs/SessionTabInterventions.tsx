import { useEffect, useState } from "react";
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
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      {/* Técnicas Utilizadas */}
      <div className="space-y-2">
        <Label htmlFor="techniquesUsed">Técnicas Utilizadas</Label>
        <Textarea
          id="techniquesUsed"
          placeholder="TCC, escuta ativa, reestruturação cognitiva..."
          value={localData?.techniquesUsed || ""}
          onChange={(e) => handleChange("techniquesUsed", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Intervenções Planejadas */}
      <div className="space-y-2">
        <Label htmlFor="plannedInterventions">Intervenções Planejadas</Label>
        <Textarea
          id="plannedInterventions"
          placeholder="Próximas intervenções a serem aplicadas..."
          value={localData?.plannedInterventions || ""}
          onChange={(e) => handleChange("plannedInterventions", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Tarefa de Casa */}
      <div className="space-y-2">
        <Label htmlFor="homework">Tarefa de Casa</Label>
        <Textarea
          id="homework"
          placeholder="Atividades sugeridas para o paciente entre sessões..."
          value={localData?.homework || ""}
          onChange={(e) => handleChange("homework", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Planejamento Terapêutico */}
      <div className="space-y-2">
        <Label htmlFor="therapeuticPlanning">Planejamento Terapêutico</Label>
        <Textarea
          id="therapeuticPlanning"
          placeholder="Plano de tratamento e etapas futuras..."
          value={localData?.therapeuticPlanning || ""}
          onChange={(e) => handleChange("therapeuticPlanning", e.target.value)}
          className="min-h-32"
        />
      </div>
    </div>
  );
}
