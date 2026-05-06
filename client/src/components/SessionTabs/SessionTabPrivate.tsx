import { useState, useEffect } from "react";
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
    const updated = { ...localData, [field]: value };
    setLocalData(updated);
    onUpdate(field, value);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-300 bg-blue-50">
        <Lock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          🔒 <strong>Confidencial:</strong> As anotações desta aba são de uso exclusivo do profissional e NUNCA serão incluídas em relatórios ou documentos compartilhados com o paciente.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="countertransference">Contratransferência</Label>
        <Textarea
          id="countertransference"
          placeholder="Descreva suas reações emocionais e contratransferência..."
          value={localData?.countertransference || ""}
          onChange={(e) => handleChange("countertransference", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clinicalHypotheses">Hipóteses Clínicas</Label>
        <Textarea
          id="clinicalHypotheses"
          placeholder="Quais são suas hipóteses clínicas?"
          value={localData?.clinicalHypotheses || ""}
          onChange={(e) => handleChange("clinicalHypotheses", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supervisionNotes">Dúvidas para Supervisão</Label>
        <Textarea
          id="supervisionNotes"
          placeholder="Quais dúvidas você gostaria de discutir em supervisão?"
          value={localData?.supervisionNotes || ""}
          onChange={(e) => handleChange("supervisionNotes", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referrals">Encaminhamentos</Label>
        <Textarea
          id="referrals"
          placeholder="Descreva encaminhamentos necessários..."
          value={localData?.referrals || ""}
          onChange={(e) => handleChange("referrals", e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="privateObservations">Observações Adicionais</Label>
        <Textarea
          id="privateObservations"
          placeholder="Outras observações clínicas relevantes..."
          value={localData?.privateObservations || ""}
          onChange={(e) => handleChange("privateObservations", e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );
}
