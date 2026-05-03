import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "sonner";
import {
  Loader2, Save, Building2, User, Globe, Settings2, Calendar,
  Phone, Mail, MapPin, CreditCard, Clock, DollarSign,
  Instagram, Linkedin, MessageCircle, ExternalLink, Info,
  Shield, Stethoscope
} from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading, refetch } = trpc.settings.get.useQuery();
  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const [formData, setFormData] = useState({
    // Clínica
    clinicName: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
    clinicCity: "",
    clinicState: "",
    clinicZipCode: "",
    // Profissional
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerCPF: "",
    ownerCRPNumber: "",
    ownerSpecialty: "",
    ownerBio: "",
    // Redes Sociais
    ownerWhatsapp: "",
    ownerInstagram: "",
    ownerLinkedin: "",
    ownerWebsite: "",
    // Sistema
    systemTitle: "",
    systemSubtitle: "",
    // Sessões
    sessionDefaultDuration: "60",
    sessionDefaultPrice: "200.00",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
  });

  const [cepLoading, setCepLoading] = useState(false);

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
        ownerSpecialty: (settings as any).ownerSpecialty || "",
        ownerBio: (settings as any).ownerBio || "",
        ownerWhatsapp: (settings as any).ownerWhatsapp || "",
        ownerInstagram: (settings as any).ownerInstagram || "",
        ownerLinkedin: (settings as any).ownerLinkedin || "",
        ownerWebsite: (settings as any).ownerWebsite || "",
        systemTitle: (settings as any).systemTitle || "",
        systemSubtitle: (settings as any).systemSubtitle || "",
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

  const fetchCep = async () => {
    const cep = formData.clinicZipCode.replace(/\D/g, "");
    if (cep.length !== 8) {
      toast.error("CEP inválido. Digite 8 dígitos.");
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        clinicAddress: data.logradouro || prev.clinicAddress,
        clinicCity: data.localidade || prev.clinicCity,
        clinicState: data.uf || prev.clinicState,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        clinicName: formData.clinicName || undefined,
        clinicEmail: formData.clinicEmail || undefined,
        clinicPhone: formData.clinicPhone,
        clinicAddress: formData.clinicAddress,
        clinicCity: formData.clinicCity,
        clinicState: formData.clinicState,
        clinicZipCode: formData.clinicZipCode,
        ownerName: formData.ownerName || undefined,
        ownerEmail: formData.ownerEmail || undefined,
        ownerPhone: formData.ownerPhone,
        ownerCPF: formData.ownerCPF,
        ownerCRPNumber: formData.ownerCRPNumber,
        ownerSpecialty: formData.ownerSpecialty,
        ownerBio: formData.ownerBio,
        ownerWhatsapp: formData.ownerWhatsapp,
        ownerInstagram: formData.ownerInstagram,
        ownerLinkedin: formData.ownerLinkedin,
        ownerWebsite: formData.ownerWebsite,
        systemTitle: formData.systemTitle,
        systemSubtitle: formData.systemSubtitle,
        sessionDefaultDuration: parseInt(formData.sessionDefaultDuration) || 60,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-1">Gerencie todas as informações do sistema, clínica e perfil profissional</p>
          </div>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending} className="gap-2">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Tudo
          </Button>
        </div>

        <Tabs defaultValue="clinic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinic" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clínica</span>
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profissional</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sessões</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Aba Clínica ── */}
          <TabsContent value="clinic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informações da Clínica / Consultório
                </CardTitle>
                <CardDescription>Dados que aparecem nos documentos, PDFs e prontuários</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica / Consultório *</Label>
                  <Input
                    id="clinicName"
                    value={formData.clinicName}
                    onChange={(e) => handleChange("clinicName", e.target.value)}
                    placeholder="Ex: Consultório Israel Mendes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicEmail">
                      <Mail className="h-3.5 w-3.5 inline mr-1" />Email
                    </Label>
                    <Input
                      id="clinicEmail"
                      type="email"
                      value={formData.clinicEmail}
                      onChange={(e) => handleChange("clinicEmail", e.target.value)}
                      placeholder="contato@clinica.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicPhone">
                      <Phone className="h-3.5 w-3.5 inline mr-1" />Telefone
                    </Label>
                    <Input
                      id="clinicPhone"
                      value={formData.clinicPhone}
                      onChange={(e) => handleChange("clinicPhone", e.target.value)}
                      placeholder="(21) 99999-9999"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />Endereço
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.clinicZipCode}
                      onChange={(e) => handleChange("clinicZipCode", e.target.value)}
                      placeholder="CEP (ex: 01310-100)"
                      className="w-40"
                    />
                    <Button variant="outline" onClick={fetchCep} disabled={cepLoading} className="gap-1">
                      {cepLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Buscar CEP
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicAddress">Rua / Logradouro</Label>
                  <Input
                    id="clinicAddress"
                    value={formData.clinicAddress}
                    onChange={(e) => handleChange("clinicAddress", e.target.value)}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinicCity">Cidade</Label>
                    <Input
                      id="clinicCity"
                      value={formData.clinicCity}
                      onChange={(e) => handleChange("clinicCity", e.target.value)}
                      placeholder="Rio de Janeiro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicState">Estado</Label>
                    <Input
                      id="clinicState"
                      value={formData.clinicState}
                      onChange={(e) => handleChange("clinicState", e.target.value)}
                      placeholder="RJ"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clinicZipCode2">CEP</Label>
                    <Input
                      id="clinicZipCode2"
                      value={formData.clinicZipCode}
                      onChange={(e) => handleChange("clinicZipCode", e.target.value)}
                      placeholder="01234-567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Aba Profissional ── */}
          <TabsContent value="professional" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Dados do Profissional
                </CardTitle>
                <CardDescription>Informações que aparecem nos prontuários, PDFs e cabeçalhos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Nome Completo *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => handleChange("ownerName", e.target.value)}
                      placeholder="Israel Mendes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerCRPNumber">
                      <Shield className="h-3.5 w-3.5 inline mr-1" />Número do CRP
                    </Label>
                    <Input
                      id="ownerCRPNumber"
                      value={formData.ownerCRPNumber}
                      onChange={(e) => handleChange("ownerCRPNumber", e.target.value)}
                      placeholder="Ex: 05/85230"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerSpecialty">Especialidade / Título Profissional</Label>
                  <Input
                    id="ownerSpecialty"
                    value={formData.ownerSpecialty}
                    onChange={(e) => handleChange("ownerSpecialty", e.target.value)}
                    placeholder="Ex: Psicólogo Clínico | Especialista em Neuropsicologia"
                  />
                  <p className="text-xs text-muted-foreground">Aparece abaixo do nome nos documentos</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">
                      <Mail className="h-3.5 w-3.5 inline mr-1" />Email Profissional
                    </Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => handleChange("ownerEmail", e.target.value)}
                      placeholder="israelneuropsicologo@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">
                      <Phone className="h-3.5 w-3.5 inline mr-1" />Telefone
                    </Label>
                    <Input
                      id="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={(e) => handleChange("ownerPhone", e.target.value)}
                      placeholder="(21) 96402-6931"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerCPF">
                    <CreditCard className="h-3.5 w-3.5 inline mr-1" />CPF
                  </Label>
                  <Input
                    id="ownerCPF"
                    value={formData.ownerCPF}
                    onChange={(e) => handleChange("ownerCPF", e.target.value)}
                    placeholder="000.000.000-00"
                    className="max-w-xs"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="ownerBio">
                    <Info className="h-3.5 w-3.5 inline mr-1" />Bio / Apresentação Profissional
                  </Label>
                  <Textarea
                    id="ownerBio"
                    value={formData.ownerBio}
                    onChange={(e) => handleChange("ownerBio", e.target.value)}
                    placeholder="Descreva sua formação, especialidades e abordagem terapêutica..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">Usado em relatórios e documentos profissionais</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Aba Contatos/Redes Sociais ── */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Contatos e Redes Sociais
                </CardTitle>
                <CardDescription>Links e contatos que aparecem no sistema e documentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerWhatsapp">
                    <MessageCircle className="h-3.5 w-3.5 inline mr-1 text-green-500" />WhatsApp
                  </Label>
                  <Input
                    id="ownerWhatsapp"
                    value={formData.ownerWhatsapp}
                    onChange={(e) => handleChange("ownerWhatsapp", e.target.value)}
                    placeholder="(21) 96402-6931"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerInstagram">
                    <Instagram className="h-3.5 w-3.5 inline mr-1 text-pink-500" />Instagram
                  </Label>
                  <Input
                    id="ownerInstagram"
                    value={formData.ownerInstagram}
                    onChange={(e) => handleChange("ownerInstagram", e.target.value)}
                    placeholder="@israelneuropsicologo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerLinkedin">
                    <Linkedin className="h-3.5 w-3.5 inline mr-1 text-blue-600" />LinkedIn
                  </Label>
                  <Input
                    id="ownerLinkedin"
                    value={formData.ownerLinkedin}
                    onChange={(e) => handleChange("ownerLinkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/israel-mendes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerWebsite">
                    <ExternalLink className="h-3.5 w-3.5 inline mr-1" />Site Profissional
                  </Label>
                  <Input
                    id="ownerWebsite"
                    value={formData.ownerWebsite}
                    onChange={(e) => handleChange("ownerWebsite", e.target.value)}
                    placeholder="https://psicologo.manus.space"
                  />
                  {formData.ownerWebsite && (
                    <a
                      href={formData.ownerWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abrir site
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Aba Sistema ── */}
          <TabsContent value="system" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Aparência do Sistema
                </CardTitle>
                <CardDescription>Textos e títulos exibidos no painel de controle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemTitle">Título do Sistema</Label>
                  <Input
                    id="systemTitle"
                    value={formData.systemTitle}
                    onChange={(e) => handleChange("systemTitle", e.target.value)}
                    placeholder="E-Saúde | Gestão Clínica"
                  />
                  <p className="text-xs text-muted-foreground">Aparece no cabeçalho e aba do navegador</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemSubtitle">Subtítulo / Slogan</Label>
                  <Input
                    id="systemSubtitle"
                    value={formData.systemSubtitle}
                    onChange={(e) => handleChange("systemSubtitle", e.target.value)}
                    placeholder="Sistema de Gestão para Psicólogos"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Preferências Regionais
                </CardTitle>
                <CardDescription>Idioma, moeda e fuso horário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={formData.language} onValueChange={(v) => handleChange("language", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (USA)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select value={formData.currency} onValueChange={(v) => handleChange("currency", v)}>
                      <SelectTrigger>
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
                    <Label>Fuso Horário</Label>
                    <Select value={formData.timezone} onValueChange={(v) => handleChange("timezone", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (AMT)</SelectItem>
                        <SelectItem value="America/Fortaleza">Fortaleza (BRT)</SelectItem>
                        <SelectItem value="America/Recife">Recife (BRT)</SelectItem>
                        <SelectItem value="America/Belem">Belém (BRT)</SelectItem>
                        <SelectItem value="America/Rio_Branco">Rio Branco (ACT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Aba Sessões ── */}
          <TabsContent value="sessions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Configurações Padrão de Sessão
                </CardTitle>
                <CardDescription>Valores usados ao criar novas sessões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionDefaultDuration">
                      <Clock className="h-3.5 w-3.5 inline mr-1" />Duração Padrão (minutos)
                    </Label>
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
                    <Label htmlFor="sessionDefaultPrice">
                      <DollarSign className="h-3.5 w-3.5 inline mr-1" />Valor Padrão (R$)
                    </Label>
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

                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Como funciona</p>
                  <p>Esses valores são usados como padrão ao criar novas sessões. Você pode alterar individualmente em cada sessão.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo das Configurações Atuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Profissional</span>
                    <Badge variant="outline">{formData.ownerName || "—"}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">CRP</span>
                    <Badge variant="outline">{formData.ownerCRPNumber || "—"}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Clínica</span>
                    <Badge variant="outline">{formData.clinicName || "—"}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Duração padrão</span>
                    <Badge variant="outline">{formData.sessionDefaultDuration} min</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Valor padrão</span>
                    <Badge variant="outline">R$ {formData.sessionDefaultPrice}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Fuso horário</span>
                    <Badge variant="outline">{formData.timezone}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Aviso */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Informações Importantes:</strong> Todas as alterações são salvas imediatamente ao clicar em "Salvar Tudo". Certifique-se de que os dados estão corretos antes de salvar.
            </p>
          </CardContent>
        </Card>

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
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
