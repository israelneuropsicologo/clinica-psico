import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SessionTabRisksProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

const RISK_LEVELS = [
  { value: "absent", label: "Ausente", color: "bg-green-100 text-green-800 border-green-300" },
  { value: "low", label: "Baixo", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "moderate", label: "Moderado", color: "bg-orange-100 text-orange-800 border-orange-300" },
  { value: "high", label: "Alto", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "extreme", label: "Extremo", color: "bg-red-200 text-red-900 border-red-400" },
];

export function SessionTabRisks({ data, onUpdate }: SessionTabRisksProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleRiskChange = (field: string, value: string) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onUpdate(field, value);
  };

  const renderRiskButtons = (fieldName: string) => {
    const currentValue = localData?.[fieldName] || "absent";
    const isHighRisk = currentValue === "high" || currentValue === "extreme";

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {RISK_LEVELS.map((level) => (
            <Button
              key={level.value}
              onClick={() => handleRiskChange(fieldName, level.value)}
              variant={currentValue === level.value ? "default" : "outline"}
              className={`${
                currentValue === level.value
                  ? level.color
                  : "border-gray-300"
              }`}
              size="sm"
            >
              {level.label}
            </Button>
          ))}
        </div>
        {isHighRisk && (
          <Alert className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ⚠️ Risco {currentValue === "extreme" ? "EXTREMO" : "ALTO"} detectado. Considere intervenção imediata.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <Alert className="border-blue-300 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Avaliação de risco é crítica. Selecione um nível para cada categoria.
        </AlertDescription>
      </Alert>

      {/* Risco de Prejuízo a Si */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Risco de Prejuízo a Si</Label>
        {renderRiskButtons("selfHarmRisk")}
      </div>

      {/* Risco a Terceiros */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Risco a Terceiros</Label>
        {renderRiskButtons("harmToOthersRisk")}
      </div>

      {/* Risco de Suicídio */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Risco de Suicídio</Label>
        {renderRiskButtons("suicideRisk")}
      </div>
    </div>
  );
}
