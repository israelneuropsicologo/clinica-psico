import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface DocumentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  patientName: string;
  onGenerate: (data: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}

export function DocumentGenerationModal({
  isOpen,
  onClose,
  documentType,
  patientName,
  onGenerate,
  isLoading = false,
}: DocumentGenerationModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const getFieldsForDocumentType = (type: string) => {
    switch (type) {
      case "declaracao":
        return [
          { name: "attendanceType", label: "Tipo de Atendimento", placeholder: "Ex: presença, atendimento" },
          { name: "attendanceDate", label: "Data do Atendimento", placeholder: "DD/MM/YYYY", type: "text" },
          { name: "attendanceDuration", label: "Duração", placeholder: "Ex: 1 hora, 50 minutos" },
          { name: "observations", label: "Observações", placeholder: "Observações adicionais", isTextarea: true },
        ];
      case "atestado":
        return [
          { name: "diagnosis", label: "Diagnóstico (CID)", placeholder: "Ex: F41.1 - Transtorno de ansiedade" },
          { name: "startDate", label: "Data Inicial", placeholder: "DD/MM/YYYY", type: "text" },
          { name: "endDate", label: "Data Final", placeholder: "DD/MM/YYYY", type: "text" },
          { name: "restrictions", label: "Restrições e Recomendações", placeholder: "Descreva as restrições", isTextarea: true },
          { name: "clinicalJustification", label: "Justificativa Clínica", placeholder: "Justifique o atestado", isTextarea: true },
        ];
      case "laudo":
        return [
          { name: "referralReason", label: "Motivo do Encaminhamento", placeholder: "Por que foi encaminhado?", isTextarea: true },
          { name: "mainComplaint", label: "Queixa Principal", placeholder: "Qual é a queixa principal?", isTextarea: true },
          { name: "presentingProblem", label: "Problema Apresentado", placeholder: "Descreva o problema", isTextarea: true },
          { name: "clinicalAssessment", label: "Avaliação Clínica", placeholder: "Sua avaliação clínica", isTextarea: true },
          { name: "diagnosis", label: "Diagnóstico (CID)", placeholder: "Ex: F41.1 - Transtorno de ansiedade" },
          { name: "recommendations", label: "Recomendações", placeholder: "Recomendações para o paciente", isTextarea: true },
        ];
      case "parecer":
        return [
          { name: "clinicalQuestion", label: "Questão Clínica", placeholder: "Qual é a questão a ser respondida?", isTextarea: true },
          { name: "clinicalAnalysis", label: "Análise Clínica", placeholder: "Sua análise clínica", isTextarea: true },
          { name: "technicalOpinion", label: "Opinião Técnica", placeholder: "Sua opinião técnica", isTextarea: true },
          { name: "conclusion", label: "Conclusão", placeholder: "Conclusão do parecer", isTextarea: true },
        ];
      case "relatorio":
        return [
          { name: "treatmentPeriod", label: "Período de Acompanhamento", placeholder: "Ex: Janeiro a Março de 2026" },
          { name: "mainComplaint", label: "Queixa Principal", placeholder: "Qual era a queixa principal?", isTextarea: true },
          { name: "clinicalEvolution", label: "Evolução Clínica", placeholder: "Como evoluiu durante o tratamento?", isTextarea: true },
          { name: "currentStatus", label: "Estado Atual", placeholder: "Como está o paciente agora?", isTextarea: true },
          { name: "recommendations", label: "Recomendações", placeholder: "Recomendações para continuidade", isTextarea: true },
        ];
      case "relatorio_multiprofissional":
        return [
          { name: "involvedProfessionals", label: "Profissionais Envolvidos", placeholder: "Ex: Psicólogo, Psiquiatra, Fonoaudiólogo", isTextarea: true },
          { name: "treatmentPeriod", label: "Período de Acompanhamento", placeholder: "Ex: Janeiro a Março de 2026" },
          { name: "mainComplaint", label: "Queixa Principal", placeholder: "Qual era a queixa principal?", isTextarea: true },
          { name: "multidisciplinaryApproach", label: "Abordagem Multidisciplinar", placeholder: "Como foi a abordagem?", isTextarea: true },
          { name: "interventionsPerformed", label: "Intervenções Realizadas", placeholder: "Que intervenções foram feitas?", isTextarea: true },
          { name: "clinicalEvolution", label: "Evolução Clínica", placeholder: "Como evoluiu?", isTextarea: true },
          { name: "recommendations", label: "Recomendações", placeholder: "Recomendações finais", isTextarea: true },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForDocumentType(documentType);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    // Validate required fields
    const missingFields = fields
      .filter((f) => !formData[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos: ${missingFields.join(", ")}`);
      return;
    }

    try {
      await onGenerate(formData);
      setFormData({});
      onClose();
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
    }
  };

  const getDocumentTitle = (type: string) => {
    const titles: Record<string, string> = {
      declaracao: "Declaração",
      atestado: "Atestado Psicológico",
      laudo: "Laudo Psicológico",
      parecer: "Parecer Psicológico",
      relatorio: "Relatório Psicológico",
      relatorio_multiprofissional: "Relatório Multiprofissional",
    };
    return titles[type] || "Documento";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDocumentTitle(documentType)}</DialogTitle>
          <DialogDescription>
            Preencha os campos para gerar o documento de {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.isTextarea ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ""}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar e Baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
