import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SessionTabRisksProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

const riskLevels = ["Ausente", "Baixo", "Moderado", "Alto", "Extremo"];

export function SessionTabRisks({ data, onUpdate }: SessionTabRisksProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    onUpdate(field, value);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Ausente":
        return "bg-green-100 text-green-800";
      case "Baixo":
        return "bg-blue-100 text-blue-800";
      case "Moderado":
        return "bg-yellow-100 text-yellow-800";
      case "Alto":
        return "bg-orange-100 text-orange-800";
      case "Extremo":
        return "bg-red-100 text-red-800";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Risco de Prejuízo a Si */}
      <div className="space-y-3">
        <Label htmlFor="riskSelfHarm">Risco de Prejuízo a Si</Label>
        <Select value={localData?.riskSelfHarm || ""} onValueChange={(val) => handleChange("riskSelfHarm", val)}>
          <SelectTrigger id="riskSelfHarm">
            <SelectValue placeholder="Selecione o nível de risco" />
          </SelectTrigger>
          <SelectContent>
            {riskLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {localData?.riskSelfHarm && (
          <div className={`p-3 rounded-md text-sm font-medium ${getRiskColor(localData.riskSelfHarm)}`}>
            Nível: {localData.riskSelfHarm}
          </div>
        )}
      </div>

      {/* Risco a Terceiros */}
      <div className="space-y-3">
        <Label htmlFor="riskToOthers">Risco a Terceiros</Label>
        <Select value={localData?.riskToOthers || ""} onValueChange={(val) => handleChange("riskToOthers", val)}>
          <SelectTrigger id="riskToOthers">
            <SelectValue placeholder="Selecione o nível de risco" />
          </SelectTrigger>
          <SelectContent>
            {riskLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {localData?.riskToOthers && (
          <div className={`p-3 rounded-md text-sm font-medium ${getRiskColor(localData.riskToOthers)}`}>
            Nível: {localData.riskToOthers}
          </div>
        )}
      </div>

      {/* Risco de Suicídio */}
      <div className="space-y-3">
        <Label htmlFor="suicideRisk">Risco de Suicídio</Label>
        <Select value={localData?.suicideRisk || ""} onValueChange={(val) => handleChange("suicideRisk", val)}>
          <SelectTrigger id="suicideRisk">
            <SelectValue placeholder="Selecione o nível de risco" />
          </SelectTrigger>
          <SelectContent>
            {riskLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {localData?.suicideRisk && (
          <div className={`p-3 rounded-md text-sm font-medium ${getRiskColor(localData.suicideRisk)}`}>
            Nível: {localData.suicideRisk}
          </div>
        )}
      </div>

      {/* Aviso de Risco Alto */}
      {(localData?.riskSelfHarm === "Alto" ||
        localData?.riskSelfHarm === "Extremo" ||
        localData?.riskToOthers === "Alto" ||
        localData?.riskToOthers === "Extremo" ||
        localData?.suicideRisk === "Alto" ||
        localData?.suicideRisk === "Extremo") && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">⚠️ Risco Alto Detectado</p>
          <p className="text-red-700 text-sm mt-1">
            Recomenda-se avaliação urgente e possível encaminhamento para serviço especializado.
          </p>
        </div>
      )}
    </div>
  );
}
