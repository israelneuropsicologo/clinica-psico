// @ts-nocheck
import React, { useState, useMemo } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, Download, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface DocumentGenerationWithPatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
}

export function DocumentGenerationWithPatientSelector({
  isOpen,
  onClose,
  documentType,
}: DocumentGenerationWithPatientSelectorProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all patients
  const { data: patientsData } = trpc.patients.list.useQuery({});
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Fetch selected patient details
  const { data: patientDetails } = trpc.patients.getById.useQuery(
    { id: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  // Initialize all mutations at component level
  const declaracaoMutation = trpc.reports.generateDeclaracao.useMutation();
  const atestadoMutation = trpc.reports.generateAtestado.useMutation();
  const laudoMutation = trpc.reports.generateLaudo.useMutation();
  const parecerMutation = trpc.reports.generateParecer.useMutation();
  const relatorioMutation = trpc.reports.generateRelatorio.useMutation();
  const relatorioMultiprofissionalMutation = trpc.reports.generateRelatorioMultiprofissional.useMutation();

  // Auto-fill form when patient is selected
  React.useEffect(() => {
    if (patientDetails) {
      const age = new Date().getFullYear() - new Date(patientDetails.birthDate).getFullYear();
      setFormData((prev) => ({
        ...prev,
        patientName: patientDetails.name,
        patientAge: age.toString(),
        patientBirthDate: new Date(patientDetails.birthDate).toLocaleDateString("pt-BR"),
      }));
    }
  }, [patientDetails]);

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
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateDocument = async () => {
    if (!selectedPatientId) {
      toast.error("Selecione um paciente");
      return;
    }

    const missingFields = fields
      .filter((f) => !formData[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos: ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);
    try {
      // Call the appropriate mutation based on document type
      let mutation;
      let payload: any = { patientId: selectedPatientId, ...formData };

      switch (documentType) {
        case "declaracao":
          mutation = declaracaoMutation;
          break;
        case "atestado":
          mutation = atestadoMutation;
          break;
        case "laudo":
          mutation = laudoMutation;
          break;
        case "parecer":
          mutation = parecerMutation;
          break;
        case "relatorio":
          mutation = relatorioMutation;
          break;
        case "relatorio_multiprofissional":
          mutation = relatorioMultiprofissionalMutation;
          break;
        default:
          throw new Error("Tipo de documento inválido");
      }

      const result = await mutation.mutateAsync(payload);

      if (result.success && result.data) {
        // Decode base64 and download
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Documento gerado com sucesso!");
        onClose();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao gerar documento";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDocumentTitle(documentType)}</DialogTitle>
          <DialogDescription>
            Selecione um paciente e preencha os dados para gerar o documento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Patient Selector */}
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {selectedPatient
                    ? selectedPatient.name
                    : "Selecione um paciente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar paciente..." />
                  <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {patients.map((patient) => (
                      <CommandItem
                        key={patient.id}
                        value={patient.name}
                        onSelect={() => {
                          setSelectedPatientId(patient.id);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPatientId === patient.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {patient.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient Info Display */}
          {selectedPatient && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm">
              <p className="text-foreground font-medium">{formData.patientName}</p>
              <p className="text-muted-foreground text-xs">
                {formData.patientAge} anos • {formData.patientBirthDate}
              </p>
            </div>
          )}

          {/* Form Fields */}
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
          <Button onClick={handleGenerateDocument} disabled={isLoading || !selectedPatientId}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
