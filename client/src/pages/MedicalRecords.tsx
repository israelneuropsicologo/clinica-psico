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

interface TimelineEntry {
  id: number;
  title: string;
  content: string;
  entryType: string;
  createdAt: Date | number;
  clinicalEvolution?: string | null;
}

export default function MedicalRecords() {
  const toast = (msg: any) => console.log(msg);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryType, setEntryType] = useState("session_note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: timeline } = trpc.medicalRecords.timeline.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const createEntry = trpc.medicalRecords.createEntry.useMutation({
    onSuccess: () => {
                    console.log("Entrada criada com sucesso");
      setShowNewEntry(false);
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      console.error("Erro:", error.message);
    },
  });

  const handleCreateEntry = async () => {
    if (!selectedPatientId || !title || !content) {
      console.error("Preencha todos os campos");
      return;
    }

    await createEntry.mutateAsync({
      patientId: selectedPatientId,
      entryType: entryType as any,
      title,
      content,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Prontuário Dinâmico</h1>
          <p className="text-gray-600">Gerencie a linha do tempo clínica dos pacientes</p>
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
            {/* Botão para nova entrada */}
            <Dialog open={showNewEntry} onOpenChange={setShowNewEntry}>
              <DialogTrigger asChild>
                <Button>+ Nova Entrada</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Entrada no Prontuário</DialogTitle>
                  <DialogDescription>Adicione uma nova entrada à linha do tempo clínica</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Entrada</Label>
                    <Select value={entryType} onValueChange={setEntryType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="session_note">Anotação de Sessão</SelectItem>
                        <SelectItem value="clinical_evolution">Evolução Clínica</SelectItem>
                        <SelectItem value="intervention">Intervenção</SelectItem>
                        <SelectItem value="assessment">Avaliação</SelectItem>
                        <SelectItem value="treatment_plan">Plano de Tratamento</SelectItem>
                        <SelectItem value="discharge_summary">Resumo de Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da entrada" />
                  </div>
                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Descreva a entrada" rows={5} />
                  </div>
                  <Button onClick={handleCreateEntry} disabled={createEntry.isPending}>
                    {createEntry.isPending ? "Criando..." : "Criar Entrada"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Timeline */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Linha do Tempo</h2>
              {timeline && timeline.length > 0 ? (
                timeline.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{entry.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(entry.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{entry.entryType}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{entry.content}</p>
                      {entry.clinicalEvolution && (
                        <div className="mt-3 p-2 bg-green-50 rounded">
                          <p className="text-sm font-semibold text-green-900">Evolução Clínica:</p>
                          <p className="text-sm text-green-800">{entry.clinicalEvolution}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">Nenhuma entrada no prontuário ainda</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
