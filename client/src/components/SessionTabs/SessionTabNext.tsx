import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="nextSessionDate">Data da Próxima Sessão</Label>
        <Input
          id="nextSessionDate"
          type="date"
          value={localData?.nextSessionDate || ""}
          onChange={(e) => handleChange("nextSessionDate", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextSessionGoals">Objetivos para a Próxima Sessão</Label>
        <Textarea
          id="nextSessionGoals"
          placeholder="Quais são os objetivos para a próxima sessão?"
          value={localData?.nextSessionGoals || ""}
          onChange={(e) => handleChange("nextSessionGoals", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatmentPlanAdjustments">Ajustes no Plano de Tratamento</Label>
        <Textarea
          id="treatmentPlanAdjustments"
          placeholder="Quais ajustes serão feitos no plano de tratamento?"
          value={localData?.treatmentPlanAdjustments || ""}
          onChange={(e) => handleChange("treatmentPlanAdjustments", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
