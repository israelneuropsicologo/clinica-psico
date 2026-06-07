import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Target, Lightbulb, AlertCircle } from "lucide-react";

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
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Evolução do Paciente</h2>
        </div>
        <p className="text-blue-50 text-sm">Acompanhamento do progresso, insights e resistências observadas</p>
      </div>

      {/* Resposta ao Tratamento */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <Label htmlFor="treatmentResponse" className="font-semibold text-gray-700">Resposta ao Tratamento</Label>
        </div>
        <Textarea
          id="treatmentResponse"
          placeholder="Como o paciente respondeu ao tratamento? Melhorias, desafios, aderência, etc."
          value={localData?.treatmentResponse || ""}
          onChange={(e) => handleChange("treatmentResponse", e.target.value)}
          rows={4}
          className="border-blue-200 focus:border-blue-500 bg-white"
        />
        <p className="text-xs text-blue-600 mt-2">📈 Descreva a resposta clínica e comportamental do paciente</p>
      </div>

      {/* Progresso dos Objetivos */}
      <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-cyan-600" />
          <Label htmlFor="goalsProgress" className="font-semibold text-gray-700">Progresso dos Objetivos</Label>
        </div>
        <Textarea
          id="goalsProgress"
          placeholder="Qual foi o progresso em relação aos objetivos terapêuticos? Metas atingidas, parcialmente atingidas, não atingidas?"
          value={localData?.goalsProgress || ""}
          onChange={(e) => handleChange("goalsProgress", e.target.value)}
          rows={4}
          className="border-cyan-200 focus:border-cyan-500 bg-white"
        />
        <p className="text-xs text-cyan-600 mt-2">🎯 Avaliação do progresso em relação aos objetivos estabelecidos</p>
      </div>

      {/* Insights Observados */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-teal-600" />
          <Label htmlFor="observedInsights" className="font-semibold text-gray-700">Insights Observados</Label>
        </div>
        <Textarea
          id="observedInsights"
          placeholder="Quais insights foram observados? Descobertas importantes, mudanças de perspectiva, compreensões do paciente, etc."
          value={localData?.observedInsights || ""}
          onChange={(e) => handleChange("observedInsights", e.target.value)}
          rows={4}
          className="border-teal-200 focus:border-teal-500 bg-white"
        />
        <p className="text-xs text-teal-600 mt-2">💡 Momentos de compreensão e aprendizado do paciente</p>
      </div>

      {/* Resistências Observadas */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <Label htmlFor="observedResistances" className="font-semibold text-gray-700">Resistências Observadas</Label>
        </div>
        <Textarea
          id="observedResistances"
          placeholder="Quais resistências foram observadas? Bloqueios, defesas, dificuldades de adesão, etc."
          value={localData?.observedResistances || ""}
          onChange={(e) => handleChange("observedResistances", e.target.value)}
          rows={4}
          className="border-orange-200 focus:border-orange-500 bg-white"
        />
        <p className="text-xs text-orange-600 mt-2">⚠️ Identificação de obstáculos e resistências ao processo terapêutico</p>
      </div>

      {/* Info Box */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
        <p className="text-sm text-cyan-800">
          <span className="font-semibold">📊 Acompanhamento:</span> Mantenha registros consistentes da evolução para identificar padrões e ajustar a estratégia terapêutica conforme necessário.
        </p>
      </div>
    </div>
  );
}
