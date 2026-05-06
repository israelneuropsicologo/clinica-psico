import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado Emocional */}
        <div className="space-y-2">
          <Label htmlFor="emotionalState">Estado Emocional</Label>
          <Select value={localData?.emotionalState || ""} onValueChange={(val) => handleChange("emotionalState", val)}>
            <SelectTrigger id="emotionalState">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="depressivo">Depressivo</SelectItem>
              <SelectItem value="ansioso">Ansioso</SelectItem>
              <SelectItem value="misto">Misto</SelectItem>
              <SelectItem value="eufórico">Eufórico</SelectItem>
              <SelectItem value="irritável">Irritável</SelectItem>
              <SelectItem value="apático">Apático</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Humor Predominante */}
        <div className="space-y-2">
          <Label htmlFor="predominantMood">Humor Predominante</Label>
          <Select value={localData?.predominantMood || ""} onValueChange={(val) => handleChange("predominantMood", val)}>
            <SelectTrigger id="predominantMood">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deprimido">Deprimido/Anedônico</SelectItem>
              <SelectItem value="eufórico">Eufórico</SelectItem>
              <SelectItem value="ansioso">Ansioso</SelectItem>
              <SelectItem value="irritável">Irritável</SelectItem>
              <SelectItem value="apático">Apático</SelectItem>
              <SelectItem value="neutro">Neutro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nível de Sofrimento */}
      <div className="space-y-4">
        <Label>Nível de Sofrimento: {localData?.sufferingLevel || 0}/10</Label>
        <Slider
          value={[localData?.sufferingLevel || 0]}
          onValueChange={(val) => handleChange("sufferingLevel", val[0])}
          min={0}
          max={10}
          step={1}
          className="w-full"
        />
      </div>

      {/* Medicações em Uso */}
      <div className="space-y-2">
        <Label htmlFor="medications">Medicações em Uso</Label>
        <Textarea
          id="medications"
          placeholder="Descreva as medicações em uso..."
          value={localData?.medications || ""}
          onChange={(e) => handleChange("medications", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Apresentação Geral */}
      <div className="space-y-2">
        <Label htmlFor="generalPresentation">Apresentação Geral</Label>
        <Textarea
          id="generalPresentation"
          placeholder="Chorosa, apática, triste..."
          value={localData?.generalPresentation || ""}
          onChange={(e) => handleChange("generalPresentation", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Demanda Principal */}
      <div className="space-y-2">
        <Label htmlFor="mainDemand">Demanda Principal</Label>
        <Textarea
          id="mainDemand"
          placeholder="Depressão e insônia..."
          value={localData?.mainDemand || ""}
          onChange={(e) => handleChange("mainDemand", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Temas Abordados */}
      <div className="space-y-2">
        <Label htmlFor="addressedTopics">Temas Abordados</Label>
        <Textarea
          id="addressedTopics"
          placeholder="Trabalho, família, casamento, vontade de ter filhos..."
          value={localData?.addressedTopics || ""}
          onChange={(e) => handleChange("addressedTopics", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Narrativa Relevante */}
      <div className="space-y-2">
        <Label htmlFor="relevantNarrative">Narrativa Relevante</Label>
        <Textarea
          id="relevantNarrative"
          placeholder="Razão pra viver, falta de foco, de sonhos. Frustração por não engravida..."
          value={localData?.relevantNarrative || ""}
          onChange={(e) => handleChange("relevantNarrative", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Avaliação Clínica */}
      <div className="space-y-2">
        <Label htmlFor="clinicalAssessment">Avaliação Clínica</Label>
        <Textarea
          id="clinicalAssessment"
          placeholder="Cliente apresenta estado emocional abalado, crise de ansiedade..."
          value={localData?.clinicalAssessment || ""}
          onChange={(e) => handleChange("clinicalAssessment", e.target.value)}
          className="min-h-24"
        />
      </div>

      {/* Análise Técnica */}
      <div className="space-y-2">
        <Label htmlFor="technicalAnalysis">Análise Técnica</Label>
        <Textarea
          id="technicalAnalysis"
          placeholder="TCC, escuta ativa, reestruturação cognitiva..."
          value={localData?.technicalAnalysis || ""}
          onChange={(e) => handleChange("technicalAnalysis", e.target.value)}
          className="min-h-24"
        />
      </div>
    </div>
  );
}
