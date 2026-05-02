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
import { Plus, Search, User, Phone, Mail, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PDFExportButton from "@/components/PDFExportButton";

export default function Patients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [, navigate] = useLocation();

  const { data: patients, isLoading, refetch } = trpc.patients.list.useQuery({
    search: search || undefined,
    status: statusFilter,
  });

  const generatePDFMutation = trpc.reports.generatePatientPDF.useMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === patients?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(patients?.map(p => p.id) || []));
    }
  };

  const handleExportPDF = async () => {
    const result = await generatePDFMutation.mutateAsync({
      status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive"),
    });
    return result;
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja deletar ${selectedIds.size} paciente(s)? Esta ação não pode ser desfeita.`)) return;
    
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await trpc.patients.delete.mutate({ id });
      }
      toast.success(`${selectedIds.size} paciente(s) deletado(s)`);
      setSelectedIds(new Set());
      refetch();
    } catch (error) {
      toast.error('Erro ao deletar pacientes');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
              label="Exportar PDF"
              onExportPDF={handleExportPDF}
            />
            {selectedIds.size > 0 && (
              <Button 
                onClick={handleDeleteSelected}
                variant="destructive"
                className="gap-2"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deletando...' : `Deletar ${selectedIds.size}`}
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
            {patients.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedIds.size === patients.length && patients.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? `${selectedIds.size} selecionado(s)` : 'Selecionar Todos'}
                </span>
              </div>
            )}
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className={`transition-all ${selectedIds.has(patient.id) ? 'border-primary bg-primary/5' : 'hover:shadow-md hover:border-primary/30'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(patient.id)}
                      onChange={() => toggleSelect(patient.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer shrink-0"
                    />
                    <div 
                      className="flex-1 cursor-pointer min-w-0"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
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
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={patient.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Patient Dialog */}
      </div>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
          </DialogHeader>
          <CreatePatientForm onSuccess={() => {
            setShowCreate(false);
            refetch();
          }} />
        </DialogContent>
      </Dialog>
  );
}

function CreatePatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    occupation: "",
    referredBy: "",
    mainComplaint: "",
    medicalHistory: "",
    medications: "",
    notes: "",
    sessionValue: "",
  });

  const createMutation = trpc.patients.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Paciente criado com sucesso");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao criar paciente");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
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
      </div>
      <div>
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyContact">Contato de Emergência</Label>
          <Input
            id="emergencyContact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
          <Input
            id="emergencyPhone"
            value={formData.emergencyPhone}
            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="occupation">Ocupação</Label>
          <Input
            id="occupation"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="referredBy">Indicado por</Label>
          <Input
            id="referredBy"
            value={formData.referredBy}
            onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="mainComplaint">Queixa Principal</Label>
        <Input
          id="mainComplaint"
          value={formData.mainComplaint}
          onChange={(e) => setFormData({ ...formData, mainComplaint: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="medicalHistory">Histórico Médico</Label>
        <Input
          id="medicalHistory"
          value={formData.medicalHistory}
          onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="medications">Medicações</Label>
        <Input
          id="medications"
          value={formData.medications}
          onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="sessionValue">Valor da Sessão</Label>
        <Input
          id="sessionValue"
          value={formData.sessionValue}
          onChange={(e) => setFormData({ ...formData, sessionValue: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? "Criando..." : "Criar Paciente"}
      </Button>
    </form>
  );
}
