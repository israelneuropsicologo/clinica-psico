import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    setLocalData((prev: any) => ({ ...prev, [field]: value }));
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paciente */}
        <div className="space-y-2">
          <Label htmlFor="patient">Paciente *</Label>
          <Select value={localData?.patientId || ""} onValueChange={(val) => handleChange("patientId", val)}>
            <SelectTrigger id="patient">
              <SelectValue placeholder="Selecione um paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data da Sessão */}
        <div className="space-y-2">
          <Label htmlFor="date">Data da Sessão *</Label>
          <Input
            id="date"
            type="date"
            value={localData?.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
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

        {/* Duração */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duração (min)</Label>
          <Input
            id="duration"
            type="number"
            value={localData?.duration || ""}
            onChange={(e) => handleChange("duration", parseInt(e.target.value))}
          />
        </div>

        {/* Nº da Sessão */}
        <div className="space-y-2">
          <Label htmlFor="sessionNumber">Nº da Sessão</Label>
          <Input
            id="sessionNumber"
            type="number"
            value={localData?.sessionNumber || ""}
            onChange={(e) => handleChange("sessionNumber", parseInt(e.target.value))}
          />
        </div>

        {/* Tipo de Sessão */}
        <div className="space-y-2">
          <Label htmlFor="sessionType">Tipo de Sessão</Label>
          <Select value={localData?.sessionType || ""} onValueChange={(val) => handleChange("sessionType", val)}>
            <SelectTrigger id="sessionType">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="casal">Casal</SelectItem>
              <SelectItem value="familia">Família</SelectItem>
              <SelectItem value="grupo">Grupo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidade */}
        <div className="space-y-2">
          <Label htmlFor="modality">Modalidade</Label>
          <Select value={localData?.modality || ""} onValueChange={(val) => handleChange("modality", val)}>
            <SelectTrigger id="modality">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
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
            placeholder="Consultório, sala de atendimento, etc"
            value={localData?.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
