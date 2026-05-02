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

export default function TechnicalDocuments() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [docType, setDocType] = useState("certificate");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: patients } = trpc.patients.list.useQuery({});
  const { data: documents } = trpc.technicalDocuments.list.useQuery(
    { patientId: selectedPatientId! },
    { enabled: !!selectedPatientId }
  );

  const createDoc = trpc.technicalDocuments.create.useMutation({
    onSuccess: () => {
      console.log("Documento criado com sucesso");
      setShowNewDoc(false);
      setTitle("");
      setContent("");
    },
    onError: (error) => {
      console.error("Erro:", error.message);
    },
  });

  const handleCreateDoc = async () => {
    if (!selectedPatientId || !title || !content) {
      console.error("Preencha todos os campos");
      return;
    }

    await createDoc.mutateAsync({
      patientId: selectedPatientId,
      documentType: docType as any,
      title,
      content,
      issuedDate: Date.now(),
    });
  };

  const documentTypeLabels: Record<string, string> = {
    certificate: "Atestado",
    report: "Relatório",
    opinion: "Parecer",
    referral: "Encaminhamento",
    prescription: "Prescrição",
    evaluation: "Avaliação",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Documentação Técnica</h1>
          <p className="text-gray-600">Gere atestados, laudos, pareceres e outros documentos</p>
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
            {/* Botão para novo documento */}
            <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
              <DialogTrigger asChild>
                <Button>+ Novo Documento</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Documento Técnico</DialogTitle>
                  <DialogDescription>Crie um novo atestado, relatório ou parecer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Documento</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="certificate">Atestado</SelectItem>
                        <SelectItem value="report">Relatório</SelectItem>
                        <SelectItem value="opinion">Parecer</SelectItem>
                        <SelectItem value="referral">Encaminhamento</SelectItem>
                        <SelectItem value="prescription">Prescrição</SelectItem>
                        <SelectItem value="evaluation">Avaliação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do documento" />
                  </div>
                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Conteúdo do documento" rows={5} />
                  </div>
                  <Button onClick={handleCreateDoc} disabled={createDoc.isPending}>
                    {createDoc.isPending ? "Criando..." : "Criar Documento"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Lista de Documentos */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Documentos</h2>
              {documents && documents.length > 0 ? (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{doc.title}</CardTitle>
                          <CardDescription>
                            {format(new Date(doc.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {documentTypeLabels[doc.documentType] || doc.documentType}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${doc.status === "signed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 line-clamp-3">{doc.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">Nenhum documento criado ainda</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
