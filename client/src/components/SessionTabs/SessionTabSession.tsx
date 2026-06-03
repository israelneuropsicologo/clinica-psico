import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SessionTabSessionProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  patients: any[];
  preSelectedPatientId?: number;
  preSelectedPatientName?: string;
}

export function SessionTabSession({ data, onUpdate, patients, preSelectedPatientId, preSelectedPatientName }: SessionTabSessionProps) {
  const [localData, setLocalData] = useState(data);

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Auto-select patient if preSelectedPatientId is provided
  useEffect(() => {
    if (preSelectedPatientId && !data?.patientId) {
      handleChange("patientId", preSelectedPatientId.toString());
    }
  }, [preSelectedPatientId]);

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
          {preSelectedPatientId && preSelectedPatientName ? (
            <div className="flex items-center h-10 px-3 border border-input rounded-md bg-muted">
              <span className="text-sm font-medium">{preSelectedPatientName}</span>
            </div>
          ) : (
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
          )}
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
          <Label htmlFor="sessionType2">Tipo de Sessão</Label>
          <Select
            value={localData?.sessionType2 || ""}
            onValueChange={(val) => handleChange("sessionType2", val)}
          >
            <SelectTrigger id="sessionType2">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="couple">Casal</SelectItem>
              <SelectItem value="group">Grupo</SelectItem>
              <SelectItem value="evaluation">Avaliação</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidade */}
        <div className="space-y-2">
          <Label htmlFor="modality2">Modalidade</Label>
          <Select
            value={localData?.modality2 || ""}
            onValueChange={(val) => handleChange("modality2", val)}
          >
            <SelectTrigger id="modality2">
              <SelectValue placeholder="Selecione a modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Local */}
        <div className="space-y-2">
          <Label htmlFor="sessionLocation">Local</Label>
          <Input
            id="sessionLocation"
            type="text"
            placeholder="ex: Consultório, Tele atendimento"
            value={localData?.sessionLocation || ""}
            onChange={(e) => handleChange("sessionLocation", e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 border-t text-xs text-muted-foreground">
        <p>Campos marcados com <span className="text-red-600">*</span> são obrigatórios</p>
      </div>
    </div>
  );
}
