import DashboardLayout from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Search, User, Phone, Mail, Calendar, Trash2, Link as LinkIcon, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PDFExportButton from "@/components/PDFExportButton";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [, navigate] = useLocation();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPatientForInvite, setSelectedPatientForInvite] = useState<number | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const { data: patients, isLoading, refetch } = trpc.patients.list.useQuery({
    search: search || undefined,
    status: statusFilter,
  });

  const generatePDFMutation = trpc.reports.generatePatientPDF.useMutation();
  const deleteTestDataMutation = trpc.patients.deleteTestData.useMutation();
  const deleteMultipleMutation = trpc.patients.deleteMultiple.useMutation();
  const generateInviteLinkMutation = trpc.invitations.generateLink.useMutation();
  const listInvitationsMutation = trpc.invitations.listByUser.useQuery();

  const togglePatientSelection = (patientId: number) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPatients.size === patients?.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(patients?.map(p => p.id) || []));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedPatients.size === 0) return;
    
    const confirmed = confirm(`Tem certeza que deseja deletar ${selectedPatients.size} paciente(s)?`);
    if (!confirmed) return;

    deleteMultipleMutation.mutate(
      { ids: Array.from(selectedPatients) },
      {
        onSuccess: () => {
          toast.success(`${selectedPatients.size} paciente(s) deletado(s) com sucesso`);
          setSelectedPatients(new Set());
          refetch();
        },
        onError: (error) => {
          toast.error('Erro ao deletar pacientes: ' + error.message);
        },
      }
    );
  };

  const handleExportPDF = async () => {
    const result = await generatePDFMutation.mutateAsync({
      status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive"),
      patientIds: selectedPatients.size > 0 ? Array.from(selectedPatients) : undefined,
    });
    return result;
  };

  const handleGenerateInviteLink = (patientId: number) => {
    setSelectedPatientForInvite(patientId);
    generateInviteLinkMutation.mutate(
      { patientId, expiresInDays: 30 },
      {
        onSuccess: (data: any) => {
          setInviteLink(data.inviteUrl);
          setShowInviteModal(true);
          toast.success("Link de convite gerado com sucesso!");
        },
        onError: (error: any) => {
          toast.error("Erro ao gerar link: " + error.message);
        },
      }
    );
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getInvitationStatus = (patientId: number) => {
    const invitation = listInvitationsMutation.data?.find((inv: any) => inv.patientId === patientId);
    return invitation;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLoading ? "Carregando..." : `${patients?.length ?? 0} paciente(s) encontrado(s)`}
            </p>
          </div>
          <div className="flex gap-2">
            <PDFExportButton
              label={selectedPatients.size > 0 ? `Exportar PDF (${selectedPatients.size})` : "Exportar PDF"}
              onExportPDF={handleExportPDF}
            />
            {selectedPatients.size > 0 && (
              <Button 
                onClick={handleDeleteSelected}
                variant="destructive"
                className="gap-2"
                disabled={deleteMultipleMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Deletar {selectedPatients.size}
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, telefone ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="discharged">Com Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !patients?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium">Nenhum paciente encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Paciente' para começar."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {patients && patients.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedPatients.size === patients.length && patients.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedPatients.size > 0 ? `${selectedPatients.size} selecionado(s)` : 'Selecionar todos'}
                </span>
              </div>
            )}
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className={`transition-all ${
                  selectedPatients.has(patient.id)
                    ? 'border-primary bg-primary/5'
                    : 'cursor-pointer hover:shadow-md hover:border-primary/30'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(patient.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          togglePatientSelection(patient.id);
                        }}
                        className="w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <span className="text-primary font-semibold text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/patients/${patient.id}`)}>
                        <p className="font-semibold text-sm truncate">{patient.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {patient.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </span>
                          )}
                          {patient.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.birthDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {patient.birthDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {patient.sessionValue && (
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            Number(patient.sessionValue)
                          )}/sessão
                        </span>
                      )}
                      {getInvitationStatus(patient.id)?.status === "completed" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          ✓ Preenchido
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateInviteLink(patient.id);
                        }}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      <div onClick={() => navigate(`/patients/${patient.id}`)}>
                        <StatusBadge status={patient.status} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreatePatientDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link de Convite para Paciente</DialogTitle>
          </DialogHeader>
          {inviteLink && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Compartilhe este link com o paciente para que ele preencha seus dados:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md text-sm bg-white"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopyLink(inviteLink)}
                    variant={copiedToken === inviteLink ? "default" : "outline"}
                  >
                    {copiedToken === inviteLink ? (
                      <>
                        <Check className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">O paciente poderá:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Acessar o link sem fazer login</li>
                  <li>Preencher seus dados pessoais e de contato</li>
                  <li>Salvar as informações de forma segura</li>
                  <li>Você será notificado quando terminar</li>
                </ul>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function CreatePatientDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    occupation: "",
    mainComplaint: "",
    sessionValue: "",
  }));

  const createMutation = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      onSuccess();
      setForm({ name: "", email: "", phone: "", birthDate: "", cpf: "", occupation: "", mainComplaint: "", sessionValue: "" });
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" value={form.name} onChange={set("name")} required placeholder="Nome do paciente" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input id="birthDate" type="date" value={form.birthDate} onChange={set("birthDate")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="occupation">Profissão</Label>
                <Input id="occupation" value={form.occupation} onChange={set("occupation")} placeholder="Profissão" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sessionValue">Valor da sessão (R$)</Label>
                <Input id="sessionValue" value={form.sessionValue} onChange={set("sessionValue")} placeholder="200.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mainComplaint">Queixa principal</Label>
              <textarea
                id="mainComplaint"
                value={form.mainComplaint}
                onChange={set("mainComplaint")}
                placeholder="Descreva a queixa principal do paciente..."
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
