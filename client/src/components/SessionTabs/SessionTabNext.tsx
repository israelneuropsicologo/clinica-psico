import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SessionTabNextProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export function SessionTabNext({ data, onUpdate }: SessionTabNextProps) {
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
      {/* Data da Próxima Sessão */}
      <div className="space-y-2">
        <Label htmlFor="nextSessionDate">Data da Próxima Sessão</Label>
        <Input
          id="nextSessionDate"
          type="date"
          value={localData?.nextSessionDate || ""}
          onChange={(e) => handleChange("nextSessionDate", e.target.value)}
        />
      </div>

      {/* Objetivos para a Próxima Sessão */}
      <div className="space-y-2">
        <Label htmlFor="nextSessionObjectives">Objetivos para a Próxima Sessão</Label>
        <Textarea
          id="nextSessionObjectives"
          placeholder="O que será trabalhado na próxima sessão..."
          value={localData?.nextSessionObjectives || ""}
          onChange={(e) => handleChange("nextSessionObjectives", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Ajustes no Plano de Tratamento */}
      <div className="space-y-2">
        <Label htmlFor="treatmentPlanAdjustments">Ajustes no Plano de Tratamento</Label>
        <Textarea
          id="treatmentPlanAdjustments"
          placeholder="Mudanças necessárias no plano terapêutico..."
          value={localData?.treatmentPlanAdjustments || ""}
          onChange={(e) => handleChange("treatmentPlanAdjustments", e.target.value)}
          className="min-h-32"
        />
      </div>
    </div>
  );
}
