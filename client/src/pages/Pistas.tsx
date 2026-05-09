import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Lightbulb, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";

export default function Pistas() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: patients } = trpc.patients.list.useQuery({});
  const generateSuggestions = trpc.pistas.generateTreatmentSuggestions.useMutation();

  const handleGenerateSuggestions = async () => {
    if (!selectedPatientId) {
      setError("Selecione um paciente");
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await generateSuggestions.mutateAsync({
        patientId: parseInt(selectedPatientId),
      });
      setSuggestions(typeof result.suggestions === 'string' ? result.suggestions : JSON.stringify(result.suggestions));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar sugestões");
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
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Selection Card */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Selecione um paciente</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um paciente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateSuggestions}
                  disabled={!selectedPatientId || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando sugestões...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Gerar Sugestões com IA
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Error */}
            {error && (
              <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900">Erro</h3>
                    <p className="text-sm text-red-800 mt-1">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Suggestions */}
            {suggestions && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3 mb-4">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <h3 className="font-semibold text-blue-900">Sugestões de Tratamento</h3>
                </div>
                <div className="prose prose-sm max-w-none text-blue-900 whitespace-pre-wrap">
                  {suggestions}
                </div>
              </Card>
            )}

            {/* Empty State */}
            {!suggestions && !loading && !error && (
              <Card className="p-12 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">Nenhuma sugestão gerada</h3>
                <p className="text-muted-foreground">
                  Selecione um paciente e clique em "Gerar Sugestões com IA" para obter recomendações personalizadas
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
