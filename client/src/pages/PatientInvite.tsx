import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export function PatientInvite() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({});

  // Validar token
  const validateQuery = trpc.invitations.validateToken.useQuery(
    { token: token || "" },
    {
      enabled: !!token,
    }
  );

  useEffect(() => {
    if (validateQuery.isError) {
      setError((validateQuery.error as any)?.message || "Token inválido ou expirado");
      setIsLoading(false);
    }
  }, [validateQuery.isError, validateQuery.error]);

  // Obter dados do paciente
  const getPatientQuery = trpc.invitations.getPatientData.useQuery(
    { token: token || "" },
    {
      enabled: validateQuery.data?.valid === true,
    }
  );

  useEffect(() => {
    if (getPatientQuery.data) {
      setFormData(getPatientQuery.data.patient);
      setIsLoading(false);
    }
    if (getPatientQuery.isError) {
      setError((getPatientQuery.error as any)?.message || "Erro ao carregar dados");
      setIsLoading(false);
    }
  }, [getPatientQuery.data, getPatientQuery.isError, getPatientQuery.error]);

  // Mutation para atualizar dados
  const updateMutation = trpc.invitations.updatePatientData.useMutation({
    onSuccess: () => {
      setCompleted(true);
      alert("Sucesso! Seus dados foram salvos com sucesso. O psicólogo será notificado.");
      setTimeout(() => {
        navigate("/");
      }, 3000);
    },
    onError: (err: any) => {
      alert(`Erro: ${err?.message || "Erro ao salvar dados"}`);
    },
  });

  const handleInputChange = (field: string, value: any): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateMutation.mutateAsync({
        token: token || "",
        data: formData,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Carregando formulário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !validateQuery.data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600 text-center mb-6">{error || "Este link expirou ou não é válido"}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Voltar para a página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Cadastro Concluído!</h2>
            <p className="text-gray-600 text-center mb-6">Seus dados foram salvos com sucesso. O psicólogo será notificado.</p>
            <p className="text-sm text-gray-500">Redirecionando em alguns segundos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Preencha seus Dados</CardTitle>
            <CardDescription>
              Complete o seu cadastro na clínica. Os campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dados Pessoais</h3>

                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu.email@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender || ""} onValueChange={(value) => handleInputChange("gender", value)}>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Estado Civil</Label>
                    <Select
                      value={formData.maritalStatus || ""}
                      onValueChange={(value) => handleInputChange("maritalStatus", value)}
                    >
                      <SelectTrigger id="maritalStatus">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Solteiro(a)</SelectItem>
                        <SelectItem value="married">Casado(a)</SelectItem>
                        <SelectItem value="divorced">Divorciado(a)</SelectItem>
                        <SelectItem value="widowed">Viúvo(a)</SelectItem>
                        <SelectItem value="stable_union">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>

                <div>
                  <Label htmlFor="address">Rua</Label>
                  <Input
                    id="address"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Rua/Avenida"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="addressNumber">Número</Label>
                    <Input
                      id="addressNumber"
                      value={formData.addressNumber || ""}
                      onChange={(e) => handleInputChange("addressNumber", e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="addressComplement">Complemento</Label>
                    <Input
                      id="addressComplement"
                      value={formData.addressComplement || ""}
                      onChange={(e) => handleInputChange("addressComplement", e.target.value)}
                      placeholder="Apto, bloco, etc"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood || ""}
                      onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode || ""}
                      onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      placeholder="12345-678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city || ""}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      value={formData.state || ""}
                      onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>

              {/* Contato de Emergência */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Contato de Emergência</h3>

                <div>
                  <Label htmlFor="emergencyContact">Nome</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact || ""}
                    onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                    placeholder="Nome do contato"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Telefone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone || ""}
                    onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              {/* Informações Profissionais */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Informações Profissionais</h3>

                <div>
                  <Label htmlFor="occupation">Profissão</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation || ""}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    placeholder="Sua profissão"
                  />
                </div>

                <div>
                  <Label htmlFor="schooling">Escolaridade</Label>
                  <Select value={formData.schooling || ""} onValueChange={(value) => handleInputChange("schooling", value)}>
                    <SelectTrigger id="schooling">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_schooling">Sem escolaridade</SelectItem>
                      <SelectItem value="elementary">Ensino Fundamental</SelectItem>
                      <SelectItem value="middle">Ensino Médio</SelectItem>
                      <SelectItem value="high_school">Ensino Médio Completo</SelectItem>
                      <SelectItem value="college">Ensino Superior</SelectItem>
                      <SelectItem value="postgrad">Pós-Graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="religion">Religião</Label>
                  <Input
                    id="religion"
                    value={formData.religion || ""}
                    onChange={(e) => handleInputChange("religion", e.target.value)}
                    placeholder="Sua religião (opcional)"
                  />
                </div>
              </div>

              {/* Convênio */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Informações de Convênio</h3>

                <div>
                  <Label htmlFor="insuranceName">Nome do Convênio</Label>
                  <Input
                    id="insuranceName"
                    value={formData.insuranceName || ""}
                    onChange={(e) => handleInputChange("insuranceName", e.target.value)}
                    placeholder="Ex: Unimed, Bradesco Saúde"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insuranceNumber">Número da Carteira</Label>
                    <Input
                      id="insuranceNumber"
                      value={formData.insuranceNumber || ""}
                      onChange={(e) => handleInputChange("insuranceNumber", e.target.value)}
                      placeholder="Número"
                    />
                  </div>
                  <div>
                    <Label htmlFor="insurancePlan">Plano</Label>
                    <Input
                      id="insurancePlan"
                      value={formData.insurancePlan || ""}
                      onChange={(e) => handleInputChange("insurancePlan", e.target.value)}
                      placeholder="Tipo de plano"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="insuranceExpiry">Data de Validade</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={formData.insuranceExpiry || ""}
                    onChange={(e) => handleInputChange("insuranceExpiry", e.target.value)}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 border-t pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending}
                  className="flex-1"
                >
                  {isSubmitting || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Dados"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
