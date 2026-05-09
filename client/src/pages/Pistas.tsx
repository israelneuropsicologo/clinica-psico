import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, Lightbulb, Loader2, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";

export default function Pistas() {
  const [selectedPatientIds, setSelectedPatientIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPatientName, setCurrentPatientName] = useState<string>("");

  const { data: patients } = trpc.patients.list.useQuery({});
  const generateSuggestions = trpc.pistas.generateTreatmentSuggestions.useMutation();

  // Filtrar pacientes pela busca
  const filteredPatients = patients?.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Toggle seleção de paciente
  const togglePatient = (patientId: number) => {
    setSelectedPatientIds((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  // Selecionar/desselecionar todos
  const toggleAll = () => {
    if (selectedPatientIds.length === filteredPatients.length) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(filteredPatients.map((p) => p.id));
    }
  };

  // Gerar sugestões
  const handleGenerateSuggestions = async () => {
    if (selectedPatientIds.length === 0) {
      setError("Selecione pelo menos um paciente");
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      // Gerar sugestões para o primeiro paciente selecionado
      const patientId = selectedPatientIds[0];
      const selectedPatient = patients?.find((p) => p.id === patientId);
      
      if (!selectedPatient) {
        setError("Paciente não encontrado");
        return;
      }

      setCurrentPatientName(selectedPatient.name);

      const result = await generateSuggestions.mutateAsync({
        patientId: patientId,
      });
      
      setSuggestions(
        typeof result.suggestions === "string"
          ? result.suggestions
          : JSON.stringify(result.suggestions)
      );
      
      toast.success("Sugestões geradas com sucesso!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao gerar sugestões";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pistas de Tratamento</h1>
              <p className="text-muted-foreground mt-1">
                Sugestões de IA para próximos passos no tratamento
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Search and Actions */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleGenerateSuggestions}
                disabled={selectedPatientIds.length === 0 || loading}
                size="lg"
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    Gerar Sugestões ({selectedPatientIds.length})
                  </>
                )}
              </Button>
            </div>

            {/* Patients List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {filteredPatients.length} Paciente{filteredPatients.length !== 1 ? "s" : ""}
                  </CardTitle>
                  {filteredPatients.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAll}
                    >
                      {selectedPatientIds.length === filteredPatients.length
                        ? "Desselecionar Todos"
                        : "Selecionar Todos"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Nenhum paciente encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => togglePatient(patient.id)}
                      >
                        <Checkbox
                          checked={selectedPatientIds.includes(patient.id)}
                          onCheckedChange={() => togglePatient(patient.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{patient.name}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            {patient.email && <span>{patient.email}</span>}
                            {patient.phone && <span>{patient.phone}</span>}
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Ativo
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-900">Erro</h3>
                      <p className="text-sm text-red-800 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {suggestions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <CardTitle className="text-blue-900">
                        Sugestões de Tratamento para {currentPatientName}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-wrap">
                    {suggestions}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!suggestions && !loading && !error && selectedPatientIds.length === 0 && (
              <Card className="text-center">
                <CardContent className="pt-12 pb-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold text-lg mb-2">Nenhuma sugestão gerada</h3>
                  <p className="text-muted-foreground">
                    Selecione um ou mais pacientes e clique em "Gerar Sugestões" para obter recomendações personalizadas
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
