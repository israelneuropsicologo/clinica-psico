import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Heart, Brain, Pill, User, MessageSquare, BookOpen, Stethoscope, Lightbulb } from "lucide-react";

interface SessionTabAvaliacaoProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export function SessionTabAvaliacao({ data, onUpdate }: SessionTabAvaliacaoProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onUpdate(field, value);
  };

  const emotionalStateLabel = {
    very_sad: "Muito Triste",
    sad: "Triste",
    neutral: "Neutro",
    good: "Bem",
    very_good: "Muito Bem"
  };

  const emotionalStateColor = {
    very_sad: "text-red-600",
    sad: "text-orange-500",
    neutral: "text-gray-500",
    good: "text-blue-500",
    very_good: "text-green-600"
  };

  const moodLabel = {
    depressed: "Deprimido",
    anhedonic: "Anedônico",
    anxious: "Ansioso",
    irritable: "Irritável",
    stable: "Estável"
  };

  return (
    <div className="space-y-6">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Avaliação Clínica</h2>
        </div>
        <p className="text-emerald-50 text-sm">Avaliação detalhada do estado emocional e clínico do paciente</p>
      </div>

      {/* Estado Emocional e Humor - Grid com Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado Emocional */}
        <div className="bg-white border border-emerald-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-emerald-600" />
            <Label htmlFor="emotionalState" className="font-semibold text-gray-700">Estado Emocional</Label>
          </div>
          <Select
            value={localData?.emotionalState || ""}
            onValueChange={(val) => handleChange("emotionalState", val)}
          >
            <SelectTrigger id="emotionalState" className="border-emerald-200 focus:border-emerald-500">
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="very_sad">😢 Muito Triste</SelectItem>
              <SelectItem value="sad">😕 Triste</SelectItem>
              <SelectItem value="neutral">😐 Neutro</SelectItem>
              <SelectItem value="good">🙂 Bem</SelectItem>
              <SelectItem value="very_good">😊 Muito Bem</SelectItem>
            </SelectContent>
          </Select>
          {localData?.emotionalState && (
            <div className={`mt-2 text-sm font-medium ${emotionalStateColor[localData.emotionalState as keyof typeof emotionalStateColor]}`}>
              ✓ {emotionalStateLabel[localData.emotionalState as keyof typeof emotionalStateLabel]}
            </div>
          )}
        </div>

        {/* Humor Predominante */}
        <div className="bg-white border border-teal-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-teal-600" />
            <Label htmlFor="predominantMood" className="font-semibold text-gray-700">Humor Predominante</Label>
          </div>
          <Select
            value={localData?.predominantMood || ""}
            onValueChange={(val) => handleChange("predominantMood", val)}
          >
            <SelectTrigger id="predominantMood" className="border-teal-200 focus:border-teal-500">
              <SelectValue placeholder="Selecione o humor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="depressed">Deprimido</SelectItem>
              <SelectItem value="anhedonic">Anedônico</SelectItem>
              <SelectItem value="anxious">Ansioso</SelectItem>
              <SelectItem value="irritable">Irritável</SelectItem>
              <SelectItem value="stable">Estável</SelectItem>
            </SelectContent>
          </Select>
          {localData?.predominantMood && (
            <div className="mt-2 text-sm font-medium text-teal-600">
              ✓ {moodLabel[localData.predominantMood as keyof typeof moodLabel]}
            </div>
          )}
        </div>
      </div>

      {/* Nível de Sofrimento - Card com Slider Visual */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-red-600" />
          <Label className="font-semibold text-gray-700">Nível de Sofrimento</Label>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Mínimo</span>
          <span className="text-2xl font-bold text-red-600">
            {localData?.sufferingLevel || 0}/10
          </span>
          <span className="text-sm text-gray-600">Máximo</span>
        </div>
        <Slider
          min={0}
          max={10}
          step={1}
          value={[localData?.sufferingLevel || 0]}
          onValueChange={(val) => handleChange("sufferingLevel", val[0])}
          className="w-full"
        />
        <div className="mt-3 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full" />
      </div>

      {/* Medicamentos */}
      <div className="bg-white border border-cyan-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-5 h-5 text-cyan-600" />
          <Label htmlFor="currentMedications" className="font-semibold text-gray-700">Uso de Medicamentos</Label>
        </div>
        <Textarea
          id="currentMedications"
          placeholder="Descreva os medicamentos em uso..."
          value={localData?.currentMedications || ""}
          onChange={(e) => handleChange("currentMedications", e.target.value)}
          rows={3}
          className="border-cyan-200 focus:border-cyan-500"
        />
      </div>

      {/* Apresentação Geral */}
      <div className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-blue-600" />
          <Label htmlFor="generalPresentation" className="font-semibold text-gray-700">Apresentação Geral</Label>
        </div>
        <Textarea
          id="generalPresentation"
          placeholder="Descreva a apresentação geral do paciente..."
          value={localData?.generalPresentation || ""}
          onChange={(e) => handleChange("generalPresentation", e.target.value)}
          rows={3}
          className="border-blue-200 focus:border-blue-500"
        />
      </div>

      {/* Demanda Principal */}
      <div className="bg-white border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <Label htmlFor="mainDemand" className="font-semibold text-gray-700">Demanda Principal</Label>
        </div>
        <Textarea
          id="mainDemand"
          placeholder="Qual é a demanda principal do paciente?"
          value={localData?.mainDemand || ""}
          onChange={(e) => handleChange("mainDemand", e.target.value)}
          rows={3}
          className="border-indigo-200 focus:border-indigo-500"
        />
      </div>

      {/* Temas Abordados */}
      <div className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <Label htmlFor="topicsAddressed" className="font-semibold text-gray-700">Temas Abordados</Label>
        </div>
        <Textarea
          id="topicsAddressed"
          placeholder="Quais temas foram abordados na sessão?"
          value={localData?.topicsAddressed || ""}
          onChange={(e) => handleChange("topicsAddressed", e.target.value)}
          rows={3}
          className="border-purple-200 focus:border-purple-500"
        />
      </div>

      {/* Narrativa Relevante */}
      <div className="bg-white border border-pink-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-pink-600" />
          <Label htmlFor="relevantNarrative" className="font-semibold text-gray-700">Narrativa Relevante</Label>
        </div>
        <Textarea
          id="relevantNarrative"
          placeholder="Descreva narrativas relevantes compartilhadas pelo paciente..."
          value={localData?.relevantNarrative || ""}
          onChange={(e) => handleChange("relevantNarrative", e.target.value)}
          rows={3}
          className="border-pink-200 focus:border-pink-500"
        />
      </div>

      {/* Avaliação Clínica */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Stethoscope className="w-5 h-5 text-emerald-600" />
          <Label htmlFor="clinicalAssessment" className="font-semibold text-gray-700">Avaliação Clínica</Label>
        </div>
        <Textarea
          id="clinicalAssessment"
          placeholder="Sua avaliação clínica da sessão..."
          value={localData?.clinicalAssessment || ""}
          onChange={(e) => handleChange("clinicalAssessment", e.target.value)}
          rows={4}
          className="border-emerald-200 focus:border-emerald-500 bg-white"
        />
      </div>

      {/* Análise Técnica */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-cyan-600" />
          <Label htmlFor="technicalAnalysis" className="font-semibold text-gray-700">Análise Técnica</Label>
        </div>
        <Textarea
          id="technicalAnalysis"
          placeholder="Análise técnica da sessão..."
          value={localData?.technicalAnalysis || ""}
          onChange={(e) => handleChange("technicalAnalysis", e.target.value)}
          rows={4}
          className="border-cyan-200 focus:border-cyan-500 bg-white"
        />
      </div>
    </div>
  );
}
