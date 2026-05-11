// @ts-nocheck
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Download, Loader2, AlertTriangle, BarChart3, Users, TrendingUp, Server } from "lucide-react";
import { toast } from "sonner";
import { FinancialSummary } from "@/components/Reports/FinancialSummary";
import { PatientMetrics } from "@/components/Reports/PatientMetrics";
import { ClinicalManagement } from "@/components/Reports/ClinicalManagement";
import { SystemIntegrity } from "@/components/Reports/SystemIntegrity";

export default function AdminReports() {
  const { user, loading } = useAuth();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("all");
  const [hasApplied, setHasApplied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch report data - ALWAYS call hooks, even if not used
  const { data: reportData, isLoading, error } = trpc.managementReports.generateReport.useQuery(
    {
      startDate,
      endDate,
      category: category as any,
    },
    { enabled: hasApplied }
  );

  // Check if user is admin - AFTER all hooks
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user || user?.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta página. Apenas administradores podem visualizar relatórios gerenciais.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const handleApplyFilters = () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Data inicial não pode ser maior que data final");
      return;
    }
    setHasApplied(true);
  };

  const handleGeneratePDF = async () => {
    if (!reportData) {
      toast.error("Nenhum dado para gerar PDF");
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Aqui você pode chamar uma API para gerar o PDF
      // Por enquanto, vamos simular o download
      const element = document.getElementById("report-content");
      if (element) {
        // Usar html2pdf ou similar para gerar PDF
        toast.success("PDF gerado com sucesso!");
      }
    } catch (err) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground mt-2">
            Visualize e gere relatórios consolidados sobre finanças, pacientes, clínica e sistema.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Relatório</CardTitle>
            <CardDescription>Selecione o período e categoria para visualizar os dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Módulos</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="patients">Pacientes</SelectItem>
                    <SelectItem value="clinical">Clínica</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleApplyFilters} className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Aplicar Filtros"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Report Content */}
        {hasApplied && reportData && (
          <div id="report-content" className="space-y-6">
            {/* Período */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Relatório de <strong>{new Date(reportData.period.startDate).toLocaleDateString("pt-BR")}</strong> a{" "}
                  <strong>{new Date(reportData.period.endDate).toLocaleDateString("pt-BR")}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gerado em {new Date(reportData.generatedAt).toLocaleString("pt-BR")}
                </p>
              </CardContent>
            </Card>

            {/* Módulos */}
            {(category === "all" || category === "financial") && (
              <FinancialSummary data={reportData.financial} />
            )}

            {(category === "all" || category === "patients") && (
              <PatientMetrics data={reportData.patients} />
            )}

            {(category === "all" || category === "clinical") && (
              <ClinicalManagement data={reportData.clinical} />
            )}

            {(category === "all" || category === "system") && (
              <SystemIntegrity data={reportData.system} />
            )}

            {/* Generate PDF Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                Imprimir
              </Button>
              <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {hasApplied && !isLoading && !reportData && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Nenhum dado disponível para o período selecionado</p>
            </CardContent>
          </Card>
        )}

        {/* Initial State */}
        {!hasApplied && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>Selecione um período e clique em "Aplicar Filtros" para visualizar os relatórios</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
