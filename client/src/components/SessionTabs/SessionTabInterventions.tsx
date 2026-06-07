import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Target, BookMarked, Lightbulb } from "lucide-react";

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
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Intervenções Terapêuticas</h2>
        </div>
        <p className="text-purple-50 text-sm">Técnicas, estratégias e planejamento das intervenções realizadas</p>
      </div>

      {/* Técnicas Utilizadas */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-purple-600" />
          <Label htmlFor="techniquesUsed" className="font-semibold text-gray-700">Técnicas Utilizadas</Label>
        </div>
        <Textarea
          id="techniquesUsed"
          placeholder="Quais técnicas foram utilizadas? (ex: TCC, Mindfulness, Psicodrama, etc.)"
          value={localData?.techniquesUsed || ""}
          onChange={(e) => handleChange("techniquesUsed", e.target.value)}
          rows={4}
          className="border-purple-200 focus:border-purple-500 bg-white"
        />
        <p className="text-xs text-purple-600 mt-2">💡 Descreva as técnicas específicas aplicadas na sessão</p>
      </div>

      {/* Intervenções Planejadas */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-violet-600" />
          <Label htmlFor="plannedInterventions" className="font-semibold text-gray-700">Intervenções Planejadas</Label>
        </div>
        <Textarea
          id="plannedInterventions"
          placeholder="Quais intervenções foram planejadas para as próximas sessões?"
          value={localData?.plannedInterventions || ""}
          onChange={(e) => handleChange("plannedInterventions", e.target.value)}
          rows={4}
          className="border-violet-200 focus:border-violet-500 bg-white"
        />
        <p className="text-xs text-violet-600 mt-2">🎯 Planejamento estratégico para continuidade do tratamento</p>
      </div>

      {/* Tarefa de Casa */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <BookMarked className="w-5 h-5 text-indigo-600" />
          <Label htmlFor="homework" className="font-semibold text-gray-700">Tarefa de Casa</Label>
        </div>
        <Textarea
          id="homework"
          placeholder="Qual é a tarefa de casa para o paciente? (ex: exercícios, leitura, meditação, etc.)"
          value={localData?.homework || ""}
          onChange={(e) => handleChange("homework", e.target.value)}
          rows={4}
          className="border-indigo-200 focus:border-indigo-500 bg-white"
        />
        <p className="text-xs text-indigo-600 mt-2">📝 Atividades para o paciente realizar entre sessões</p>
      </div>

      {/* Planejamento Terapêutico */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <Label htmlFor="therapeuticPlan" className="font-semibold text-gray-700">Planejamento Terapêutico</Label>
        </div>
        <Textarea
          id="therapeuticPlan"
          placeholder="Descreva o planejamento terapêutico geral (objetivos, metas, duração esperada do tratamento, etc.)"
          value={localData?.therapeuticPlan || ""}
          onChange={(e) => handleChange("therapeuticPlan", e.target.value)}
          rows={4}
          className="border-blue-200 focus:border-blue-500 bg-white"
        />
        <p className="text-xs text-blue-600 mt-2">🗺️ Visão geral da estratégia terapêutica</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">💡 Dica:</span> Descreva as intervenções de forma clara e objetiva, facilitando a continuidade do tratamento e a compreensão de outros profissionais.
        </p>
      </div>
    </div>
  );
}
