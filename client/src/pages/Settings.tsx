import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar configurações");
    },
  });

  const [formData, setFormData] = useState({
    clinicName: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
    clinicCity: "",
    clinicState: "",
    clinicZipCode: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerCPF: "",
    ownerCRPNumber: "",
    sessionDefaultDuration: "60",
    sessionDefaultPrice: "200.00",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  // Sincronizar formulário com dados carregados
  React.useEffect(() => {
    if (settings) {
      setFormData({
        clinicName: settings.clinicName || "",
        clinicEmail: settings.clinicEmail || "",
        clinicPhone: settings.clinicPhone || "",
        clinicAddress: settings.clinicAddress || "",
        clinicCity: settings.clinicCity || "",
        clinicState: settings.clinicState || "",
        clinicZipCode: settings.clinicZipCode || "",
        ownerName: settings.ownerName || "",
        ownerEmail: settings.ownerEmail || "",
        ownerPhone: settings.ownerPhone || "",
        ownerCPF: settings.ownerCPF || "",
        ownerCRPNumber: settings.ownerCRPNumber || "",
        sessionDefaultDuration: settings.sessionDefaultDuration?.toString() || "60",
        sessionDefaultPrice: settings.sessionDefaultPrice || "200.00",
        currency: settings.currency || "BRL",
        timezone: settings.timezone || "America/Sao_Paulo",
        language: settings.language || "pt-BR",
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        clinicName: formData.clinicName,
        clinicEmail: formData.clinicEmail,
        clinicPhone: formData.clinicPhone,
        clinicAddress: formData.clinicAddress,
        clinicCity: formData.clinicCity,
        clinicState: formData.clinicState,
        clinicZipCode: formData.clinicZipCode,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        ownerCPF: formData.ownerCPF,
        ownerCRPNumber: formData.ownerCRPNumber,
        sessionDefaultDuration: parseInt(formData.sessionDefaultDuration),
        sessionDefaultPrice: formData.sessionDefaultPrice,
        currency: formData.currency,
        timezone: formData.timezone,
        language: formData.language,
      });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">Gerencie as informações da sua clínica e perfil</p>
        </div>

        <Tabs defaultValue="clinic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clinic">Clínica</TabsTrigger>
            <TabsTrigger value="owner">Proprietário</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          {/* Aba Clínica */}
          <TabsContent value="clinic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Clínica</CardTitle>
                <CardDescription>Dados principais da sua clínica</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica *</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => handleChange("clinicName", e.target.value)}
                    placeholder="Ex: Clínica Psicológica Centro"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail">Email</Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      value={formData.clinicEmail}
                      onChange={(e) => handleChange("clinicEmail", e.target.value)}
                      placeholder="contato@clinica.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">Telefone</Label>
                    <Input
                      id="clinicPhone"
                      value={formData.clinicPhone}
                      onChange={(e) => handleChange("clinicPhone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Endereço</Label>
                  <Textarea
                    id="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={(e) => handleChange("clinicAddress", e.target.value)}
                    placeholder="Rua, número, complemento"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicCity">Cidade</Label>
                    <Input
                      id="clinicCity"
                      value={formData.clinicCity}
                      onChange={(e) => handleChange("clinicCity", e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicState">Estado</Label>
                    <Input
                      id="clinicState"
                      value={formData.clinicState}
                      onChange={(e) => handleChange("clinicState", e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicZipCode">CEP</Label>
                    <Input
                      id="clinicZipCode"
                      value={formData.clinicZipCode}
                      onChange={(e) => handleChange("clinicZipCode", e.target.value)}
                      placeholder="01234-567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Proprietário */}
          <TabsContent value="owner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Informações do proprietário/psicólogo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nome Completo *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleChange("ownerEmail", e.target.value)}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Telefone</Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => handleChange("ownerPhone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerCPF">CPF</Label>
                    <Input
                      id="ownerCPF"
                      value={formData.ownerCPF}
                      onChange={(e) => handleChange("ownerCPF", e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerCRPNumber">Número do CRP</Label>
                    <Input
                      id="ownerCRPNumber"
                      value={formData.ownerCRPNumber}
                      onChange={(e) => handleChange("ownerCRPNumber", e.target.value)}
                      placeholder="Ex: 06/123456"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Sistema */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Sessão</CardTitle>
                <CardDescription>Padrões para novas sessões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionDefaultDuration">Duração Padrão (minutos)</Label>
                    <Input
                      id="sessionDefaultDuration"
                      type="number"
                      value={formData.sessionDefaultDuration}
                      onChange={(e) => handleChange("sessionDefaultDuration", e.target.value)}
                      placeholder="60"
                      min="15"
                      step="15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionDefaultPrice">Valor Padrão (R$)</Label>
                    <Input
                      id="sessionDefaultPrice"
                      type="number"
                      value={formData.sessionDefaultPrice}
                      onChange={(e) => handleChange("sessionDefaultPrice", e.target.value)}
                      placeholder="200.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preferências Regionais</CardTitle>
                <CardDescription>Idioma, moeda e fuso horário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={formData.language} onValueChange={(v) => handleChange("language", v)}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (USA)</SelectItem>
                        <SelectItem value="es-ES">Español (España)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", v)}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                        <SelectItem value="America/Fortaleza">Fortaleza (BRT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão Salvar */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => refetch()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending} className="gap-2">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        {/* Aviso */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Informações Importantes</p>
              <p className="mt-1">Todas as alterações são salvas imediatamente. Certifique-se de que os dados estão corretos antes de salvar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
