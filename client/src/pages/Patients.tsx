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
      <div className="p-3 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="flex items-start md:items-center justify-between gap-3 md:gap-4 flex-col md:flex-row">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold">Pacientes</h1>
            <p className="text-muted-foreground text-xs md:text-sm mt-1">
              {isLoading ? "Carregando..." : `${patients?.length ?? 0} paciente(s) encontrado(s)`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap w-full md:w-auto">
            <PDFExportButton
              label={selectedPatients.size > 0 ? `PDF (${selectedPatients.size})` : "PDF"}
              onExportPDF={handleExportPDF}
            />
            {selectedPatients.size > 0 && (
              <Button 
                onClick={handleDeleteSelected}
                variant="destructive"
                className="gap-2 text-xs md:text-sm"
                disabled={deleteMultipleMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Deletar {selectedPatients.size}</span>
                <span className="sm:hidden">Del</span>
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} className="gap-2 text-xs md:text-sm">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Novo Paciente</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Filters - Responsive */}
        <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, telefone ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs md:text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] text-xs md:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="discharged">Com Alta</SelectItem>
              <SelectItem value="archived">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Patient List */}
        {isLoading ? (
          <div className="space-y-2 md:space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 md:h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !patients?.length ? (
          <Card>
            <CardContent className="py-12 md:py-16 text-center">
              <User className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-2 md:mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground font-medium text-sm md:text-base">Nenhum paciente encontrado</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                {search ? "Tente ajustar os filtros de busca." : "Clique em 'Novo Paciente' para começar."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {patients && patients.length > 0 && (
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedPatients.size === patients.length && patients.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-xs md:text-sm text-muted-foreground">
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
                <CardContent className="p-3 md:p-4">
                  {/* Mobile: Stack vertical, Desktop: Horizontal */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                    {/* Left section: Checkbox + Avatar + Info */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
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
                        className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 cursor-pointer"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        <span className="text-primary font-semibold text-xs md:text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 cursor-pointer flex-1" onClick={() => navigate(`/patients/${patient.id}`)}>
                        <p className="font-semibold text-xs md:text-sm truncate">{patient.name}</p>
                        {/* Mobile: Show only essential info */}
                        <div className="flex items-center gap-1.5 md:gap-3 mt-0.5 flex-wrap text-xs">
                          {patient.email && (
                            <span className="text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="hidden md:inline truncate">{patient.email}</span>
                              <span className="md:hidden">Email</span>
                            </span>
                          )}
                          {patient.phone && (
                            <span className="text-muted-foreground flex items-center gap-1 hidden sm:flex">
                              <Phone className="h-3 w-3 shrink-0" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.birthDate && (
                            <span className="text-muted-foreground flex items-center gap-1 hidden md:flex">
                              <Calendar className="h-3 w-3 shrink-0" />
                              {patient.birthDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Right section: Actions */}
                    <div className="flex items-center gap-1.5 md:gap-3 shrink-0 justify-end">
                      {patient.sessionValue && (
                        <span className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                            Number(patient.sessionValue)
                          )}/sessão
                        </span>
                      )}
                      {getInvitationStatus(patient.id)?.status === "completed" && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium hidden md:inline whitespace-nowrap">
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
                        className="h-8 w-8 p-0 shrink-0"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
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

      <CreatePatientDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); refetch(); }}
      />
    </DashboardLayout>
  );
}

function CreatePatientDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    birthDate: "",
    status: "active",
  });

  const createMutation = trpc.patients.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Paciente criado com sucesso!");
        setFormData({ name: "", email: "", phone: "", cpf: "", birthDate: "", status: "active" });
        onSuccess();
      },
      onError: (error) => {
        toast.error(`Erro ao criar paciente: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="birthDate">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
