import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado Emocional */}
        <div className="space-y-2">
          <Label htmlFor="emotionalState">Estado Emocional</Label>
          <Select
            value={localData?.emotionalState || ""}
            onValueChange={(val) => handleChange("emotionalState", val)}
          >
            <SelectTrigger id="emotionalState">
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="very_sad">Muito Triste</SelectItem>
              <SelectItem value="sad">Triste</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
              <SelectItem value="good">Bem</SelectItem>
              <SelectItem value="very_good">Muito Bem</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Humor Predominante */}
        <div className="space-y-2">
          <Label htmlFor="predominantMood">Humor Predominante</Label>
          <Select
            value={localData?.predominantMood || ""}
            onValueChange={(val) => handleChange("predominantMood", val)}
          >
            <SelectTrigger id="predominantMood">
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
        </div>
      </div>

      {/* Nível de Sofrimento (Slider 0-10) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Nível de Sofrimento</Label>
          <span className="text-sm font-semibold text-blue-600">
            {localData?.sufferingLevel || 0}/10
          </span>
        </div>
        <Slider
          min={0}
          max={10}
          step={1}
          value={[localData?.sufferingLevel || 0]}
          onValueChange={(val) => handleChange("sufferingLevel", val[0])}
          className="w-full"
        />
      </div>

      {/* Uso de Medicamentos */}
      <div className="space-y-2">
        <Label htmlFor="medications">Uso de Medicamentos</Label>
        <Textarea
          id="medications"
          placeholder="Descreva os medicamentos em uso..."
          value={localData?.medications || ""}
          onChange={(e) => handleChange("medications", e.target.value)}
          rows={3}
        />
      </div>

      {/* Apresentação Geral */}
      <div className="space-y-2">
        <Label htmlFor="generalPresentation">Apresentação Geral</Label>
        <Textarea
          id="generalPresentation"
          placeholder="Descreva a apresentação geral do paciente..."
          value={localData?.generalPresentation || ""}
          onChange={(e) => handleChange("generalPresentation", e.target.value)}
          rows={3}
        />
      </div>

      {/* Demanda Principal */}
      <div className="space-y-2">
        <Label htmlFor="mainDemand">Demanda Principal</Label>
        <Textarea
          id="mainDemand"
          placeholder="Qual é a demanda principal do paciente?"
          value={localData?.mainDemand || ""}
          onChange={(e) => handleChange("mainDemand", e.target.value)}
          rows={3}
        />
      </div>

      {/* Temas Abordados */}
      <div className="space-y-2">
        <Label htmlFor="addressedThemes">Temas Abordados</Label>
        <Textarea
          id="addressedThemes"
          placeholder="Quais temas foram abordados na sessão?"
          value={localData?.addressedThemes || ""}
          onChange={(e) => handleChange("addressedThemes", e.target.value)}
          rows={3}
        />
      </div>

      {/* Narrativa Relevante */}
      <div className="space-y-2">
        <Label htmlFor="relevantNarrative">Narrativa Relevante</Label>
        <Textarea
          id="relevantNarrative"
          placeholder="Descreva narrativas relevantes compartilhadas pelo paciente..."
          value={localData?.relevantNarrative || ""}
          onChange={(e) => handleChange("relevantNarrative", e.target.value)}
          rows={3}
        />
      </div>

      {/* Avaliação Clínica */}
      <div className="space-y-2">
        <Label htmlFor="clinicalAssessment">Avaliação Clínica</Label>
        <Textarea
          id="clinicalAssessment"
          placeholder="Sua avaliação clínica da sessão..."
          value={localData?.clinicalAssessment || ""}
          onChange={(e) => handleChange("clinicalAssessment", e.target.value)}
          rows={4}
        />
      </div>

      {/* Análise Técnica */}
      <div className="space-y-2">
        <Label htmlFor="technicalAnalysis">Análise Técnica</Label>
        <Textarea
          id="technicalAnalysis"
          placeholder="Análise técnica da sessão..."
          value={localData?.technicalAnalysis || ""}
          onChange={(e) => handleChange("technicalAnalysis", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
