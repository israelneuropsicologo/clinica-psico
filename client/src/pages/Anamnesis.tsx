import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

export default function Anamnesis() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showNewIntake, setShowNewIntake] = useState(false);
  const [intakeType, setIntakeType] = useState("initial_assessment");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [familyHistory, setFamilyHistory] = useState("");
  const [stressFactors, setStressFactors] = useState("");

  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: intakes } = trpc.anamnesis.list.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const createIntake = trpc.anamnesis.create.useMutation({
    onSuccess: () => {
      console.log("Anamnese criada com sucesso");
      setShowNewIntake(false);
      setChiefComplaint("");
      setMedicalHistory("");
      setFamilyHistory("");
      setStressFactors("");
    },
    onError: (error) => {
      console.error("Erro:", error.message);
    },
  });

  const handleCreateIntake = async () => {
    if (!selectedPatientId || !chiefComplaint) {
      console.error("Preencha os campos obrigatórios");
      return;
    }

    await createIntake.mutateAsync({
      patientId: selectedPatientId,
      intakeType: intakeType as any,
      chiefComplaint,
      stressFactors,
    });
  };

  const intakeTypeLabels: Record<string, string> = {
    initial_assessment: "Avaliação Inicial",
    follow_up: "Acompanhamento",
    reassessment: "Reavaliação",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Anamnese e Triagem</h1>
          <p className="text-gray-600">Realize avaliações e triagens de pacientes</p>
        </div>

        {/* Seletor de Paciente */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedPatientId?.toString() || ""} onValueChange={(v) => setSelectedPatientId(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients?.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedPatientId && (
          <>
            {/* Botão para nova anamnese */}
            <Dialog open={showNewIntake} onOpenChange={setShowNewIntake}>
              <DialogTrigger asChild>
                <Button>+ Nova Anamnese</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Anamnese e Triagem</DialogTitle>
                  <DialogDescription>Preencha o formulário de avaliação do paciente</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Avaliação</Label>
                    <Select value={intakeType} onValueChange={setIntakeType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial_assessment">Avaliação Inicial</SelectItem>
                        <SelectItem value="follow_up">Acompanhamento</SelectItem>
                        <SelectItem value="reassessment">Reavaliação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Queixa Principal *</Label>
                    <Textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="Descreva a queixa principal do paciente"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>História Médica</Label>
                    <Textarea
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      placeholder="Histórico médico relevante"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>História Familiar</Label>
                    <Textarea
                      value={familyHistory}
                      onChange={(e) => setFamilyHistory(e.target.value)}
                      placeholder="Histórico familiar relevante"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Fatores de Estresse</Label>
                    <Textarea
                      value={stressFactors}
                      onChange={(e) => setStressFactors(e.target.value)}
                      placeholder="Identifique fatores de estresse"
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleCreateIntake} disabled={createIntake.isPending} className="w-full">
                    {createIntake.isPending ? "Criando..." : "Criar Anamnese"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Lista de Anamneses */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Histórico de Anamneses</h2>
              {intakes && intakes.length > 0 ? (
                intakes.map((intake) => (
                  <Card key={intake.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {intakeTypeLabels[intake.intakeType] || intake.intakeType}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(intake.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            intake.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {intake.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {intake.chiefComplaint && (
                          <div>
                            <p className="font-semibold text-sm">Queixa Principal:</p>
                            <p className="text-gray-700 text-sm">{intake.chiefComplaint}</p>
                          </div>
                        )}
                        {intake.stressFactors && (
                          <div>
                            <p className="font-semibold text-sm">Fatores de Estresse:</p>
                            <p className="text-gray-700 text-sm">{intake.stressFactors}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">Nenhuma anamnese criada ainda</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
