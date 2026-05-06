import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface SessionTabPrivateProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
}

export function SessionTabPrivate({ data, onUpdate }: SessionTabPrivateProps) {
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
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          Estas anotações são de uso exclusivo do profissional. Não são incluídas em relatórios ou documentos compartilhados com o paciente.
        </AlertDescription>
      </Alert>

      {/* Contratransferência */}
      <div className="space-y-2">
        <Label htmlFor="countertransference">Contratransferência</Label>
        <Textarea
          id="countertransference"
          placeholder="Sentimentos e reações do profissional durante a sessão..."
          value={localData?.countertransference || ""}
          onChange={(e) => handleChange("countertransference", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Hipóteses Clínicas */}
      <div className="space-y-2">
        <Label htmlFor="clinicalHypotheses">Hipóteses Clínicas</Label>
        <Textarea
          id="clinicalHypotheses"
          placeholder="Hipóteses diagnósticas e de compreensão do caso..."
          value={localData?.clinicalHypotheses || ""}
          onChange={(e) => handleChange("clinicalHypotheses", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Dúvidas para Supervisão */}
      <div className="space-y-2">
        <Label htmlFor="supervisionQuestions">Dúvidas para Supervisão</Label>
        <Textarea
          id="supervisionQuestions"
          placeholder="Pontos a levar para supervisão clínica..."
          value={localData?.supervisionQuestions || ""}
          onChange={(e) => handleChange("supervisionQuestions", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Medicações em Uso */}
      <div className="space-y-2">
        <Label htmlFor="privateMedications">Medicações em Uso</Label>
        <Textarea
          id="privateMedications"
          placeholder="Anotações sobre medicações e efeitos observados..."
          value={localData?.privateMedications || ""}
          onChange={(e) => handleChange("privateMedications", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Encaminhamentos */}
      <div className="space-y-2">
        <Label htmlFor="referrals">Encaminhamentos</Label>
        <Textarea
          id="referrals"
          placeholder="Encaminhamentos realizados ou necessários..."
          value={localData?.referrals || ""}
          onChange={(e) => handleChange("referrals", e.target.value)}
          className="min-h-32"
        />
      </div>

      {/* Observações Adicionais */}
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Observações Adicionais</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Qualquer informação adicional relevante..."
          value={localData?.additionalNotes || ""}
          onChange={(e) => handleChange("additionalNotes", e.target.value)}
          className="min-h-32"
        />
      </div>
    </div>
  );
}
