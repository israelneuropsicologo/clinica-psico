import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SessionTabSessionProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  patients: any[];
}

export function SessionTabSession({ data, onUpdate, patients }: SessionTabSessionProps) {
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
        {/* Paciente * */}
        <div className="space-y-2">
          <Label htmlFor="patientId">
            Paciente <span className="text-red-600">*</span>
          </Label>
          <Select
            value={localData?.patientId || ""}
            onValueChange={(val) => handleChange("patientId", val)}
          >
            <SelectTrigger id="patientId">
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients && patients.length > 0 ? (
                patients.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  Nenhum paciente disponível
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Data da Sessão * */}
        <div className="space-y-2">
          <Label htmlFor="sessionDate">
            Data da Sessão <span className="text-red-600">*</span>
          </Label>
          <Input
            id="sessionDate"
            type="date"
            value={localData?.sessionDate || ""}
            onChange={(e) => handleChange("sessionDate", e.target.value)}
          />
        </div>

        {/* Hora de Início */}
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de Início</Label>
          <Input
            id="startTime"
            type="time"
            value={localData?.startTime || ""}
            onChange={(e) => handleChange("startTime", e.target.value)}
          />
        </div>

        {/* Duração (min) */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duração (min)</Label>
          <Input
            id="duration"
            type="number"
            min="0"
            value={localData?.duration || ""}
            onChange={(e) => handleChange("duration", parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Nº da Sessão */}
        <div className="space-y-2">
          <Label htmlFor="sessionNumber">Nº da Sessão</Label>
          <Input
            id="sessionNumber"
            type="number"
            min="0"
            value={localData?.sessionNumber || ""}
            onChange={(e) => handleChange("sessionNumber", parseInt(e.target.value) || 0)}
          />
        </div>

        {/* Tipo de Sessão */}
        <div className="space-y-2">
          <Label htmlFor="sessionType">Tipo de Sessão</Label>
          <Select
            value={localData?.sessionType || ""}
            onValueChange={(val) => handleChange("sessionType", val)}
          >
            <SelectTrigger id="sessionType">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="couple">Casal</SelectItem>
              <SelectItem value="family">Família</SelectItem>
              <SelectItem value="group">Grupo</SelectItem>
              <SelectItem value="evaluation">Avaliação</SelectItem>
              <SelectItem value="feedback">Devolutiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidade */}
        <div className="space-y-2">
          <Label htmlFor="modality">Modalidade</Label>
          <Select
            value={localData?.modality || ""}
            onValueChange={(val) => handleChange("modality", val)}
          >
            <SelectTrigger id="modality">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presential">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Local */}
        <div className="space-y-2">
          <Label htmlFor="location">Local</Label>
          <Input
            id="location"
            type="text"
            placeholder="ex: Consultório, Tele atendimento"
            value={localData?.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t text-xs text-muted-foreground">
        <p>Campos marcados com <span className="text-red-600">*</span> são obrigatórios</p>
      </div>
    </div>
  );
}
