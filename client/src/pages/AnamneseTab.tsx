import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface AnamneseTabProps {
  patientId: number;
}

export function AnamneseTab({ patientId }: AnamneseTabProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    patientId,
    mainComplaintDetail: "",
    therapeuticGoals: "",
    cidCode: "",
    cidDescription: "",
    therapeuticApproach: "",
    currentDiseaseHistory: "",
    personalHistory: "",
    familyHistory: "",
    psychiatricHistory: "",
    previousTreatments: "",
    childhoodHistory: "",
    relationshipHistory: "",
    professionalHistory: "",
    substanceUse: "",
    sleepAndEating: "",
    sexualAffectiveLife: "",
    riskFactors: "",
    protectiveFactors: "",
    additionalNotes: "",
  });

  // Fetch anamnese data
  const { data: anamneseData, refetch } = trpc.anamnese.get.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  // Load data when fetched
  useEffect(() => {
    if (anamneseData) {
      setForm((prev) => ({
        ...prev,
        mainComplaintDetail: anamneseData.mainComplaintDetail || "",
        therapeuticGoals: anamneseData.therapeuticGoals || "",
        cidCode: anamneseData.cidCode || "",
        cidDescription: anamneseData.cidDescription || "",
        therapeuticApproach: anamneseData.therapeuticApproach || "",
        currentDiseaseHistory: anamneseData.currentDiseaseHistory || "",
        personalHistory: anamneseData.personalHistory || "",
        familyHistory: anamneseData.familyHistory || "",
        psychiatricHistory: anamneseData.psychiatricHistory || "",
        previousTreatments: anamneseData.previousTreatments || "",
        childhoodHistory: anamneseData.childhoodHistory || "",
        relationshipHistory: anamneseData.relationshipHistory || "",
        professionalHistory: anamneseData.professionalHistory || "",
        substanceUse: anamneseData.substanceUse || "",
        sleepAndEating: anamneseData.sleepAndEating || "",
        sexualAffectiveLife: anamneseData.sexualAffectiveLife || "",
        riskFactors: anamneseData.riskFactors || "",
        protectiveFactors: anamneseData.protectiveFactors || "",
        additionalNotes: anamneseData.additionalNotes || "",
      }));
    }
  }, [anamneseData]);

  const saveMutation = trpc.anamnese.save.useMutation({
    onSuccess: () => {
      alert("✅ Anamnese salva com sucesso!");
      setEditing(false);
      refetch();
    },
    onError: (e) => {
      alert(`❌ Erro ao salvar: ${e.message}`);
    },
  });

  const handleFieldChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ficha de Anamnese</h2>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>Editar</Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Salvando..." : "Salvar Anamnese"}
            </Button>
          </div>
        )}
      </div>

      {/* Queixa e Objetivos Terapêuticos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          QUEIXA E OBJETIVOS TERAPÊUTICOS
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Queixa Principal Detalhada</label>
            {editing ? (
              <Textarea
                value={form.mainComplaintDetail}
                onChange={handleFieldChange("mainComplaintDetail")}
                placeholder="Descreva a queixa principal do paciente..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.mainComplaintDetail || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Objetivos Terapêuticos</label>
            {editing ? (
              <Textarea
                value={form.therapeuticGoals}
                onChange={handleFieldChange("therapeuticGoals")}
                placeholder="Descreva os objetivos terapêuticos..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.therapeuticGoals || "Não informado"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">CID-10 / CID-11</label>
              {editing ? (
                <Input
                  value={form.cidCode}
                  onChange={handleFieldChange("cidCode")}
                  placeholder="Ex: F41.1"
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-gray-600">{form.cidCode || "Não informado"}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Descrição do CID</label>
              {editing ? (
                <Input
                  value={form.cidDescription}
                  onChange={handleFieldChange("cidDescription")}
                  placeholder="Descrição do código CID..."
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-gray-600">
                  {form.cidDescription || "Não informado"}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Abordagem Terapêutica</label>
            {editing ? (
              <Textarea
                value={form.therapeuticApproach}
                onChange={handleFieldChange("therapeuticApproach")}
                placeholder="Descreva a abordagem terapêutica proposta..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.therapeuticApproach || "Não informado"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Histórico Clínico */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">HISTÓRICO CLÍNICO</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">História da Doença Atual (HDA)</label>
            {editing ? (
              <Textarea
                value={form.currentDiseaseHistory}
                onChange={handleFieldChange("currentDiseaseHistory")}
                placeholder="Descreva a história da doença atual..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.currentDiseaseHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Histórico Pessoal</label>
            {editing ? (
              <Textarea
                value={form.personalHistory}
                onChange={handleFieldChange("personalHistory")}
                placeholder="Descreva o histórico pessoal..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.personalHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Histórico Familiar</label>
            {editing ? (
              <Textarea
                value={form.familyHistory}
                onChange={handleFieldChange("familyHistory")}
                placeholder="Descreva o histórico familiar..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.familyHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Histórico Psiquiátrico / Tratamentos Anteriores</label>
            {editing ? (
              <Textarea
                value={form.psychiatricHistory}
                onChange={handleFieldChange("psychiatricHistory")}
                placeholder="Descreva o histórico psiquiátrico..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.psychiatricHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Outros Tratamentos Anteriores</label>
            {editing ? (
              <Textarea
                value={form.previousTreatments}
                onChange={handleFieldChange("previousTreatments")}
                placeholder="Descreva outros tratamentos anteriores..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.previousTreatments || "Não informado"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Desenvolvimento e Contexto de Vida */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          DESENVOLVIMENTO E CONTEXTO DE VIDA
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Histórico da Infância e Adolescência</label>
            {editing ? (
              <Textarea
                value={form.childhoodHistory}
                onChange={handleFieldChange("childhoodHistory")}
                placeholder="Descreva o histórico da infância e adolescência..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.childhoodHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Histórico Afetivo e Relacional</label>
            {editing ? (
              <Textarea
                value={form.relationshipHistory}
                onChange={handleFieldChange("relationshipHistory")}
                placeholder="Descreva o histórico afetivo e relacional..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.relationshipHistory || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Histórico Profissional e Acadêmico</label>
            {editing ? (
              <Textarea
                value={form.professionalHistory}
                onChange={handleFieldChange("professionalHistory")}
                placeholder="Descreva o histórico profissional e acadêmico..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.professionalHistory || "Não informado"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Hábitos e Estilo de Vida */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">HÁBITOS E ESTILO DE VIDA</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Uso de Substâncias (álcool, tabaco, drogas)</label>
            {editing ? (
              <Textarea
                value={form.substanceUse}
                onChange={handleFieldChange("substanceUse")}
                placeholder="Descreva o uso de substâncias..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.substanceUse || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Sono e Alimentação</label>
            {editing ? (
              <Textarea
                value={form.sleepAndEating}
                onChange={handleFieldChange("sleepAndEating")}
                placeholder="Descreva padrões de sono e alimentação..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.sleepAndEating || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Vida Sexual e Afetiva</label>
            {editing ? (
              <Textarea
                value={form.sexualAffectiveLife}
                onChange={handleFieldChange("sexualAffectiveLife")}
                placeholder="Descreva a vida sexual e afetiva..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.sexualAffectiveLife || "Não informado"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Fatores de Risco e Proteção */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">
          FATORES DE RISCO E PROTEÇÃO
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Fatores de Risco</label>
            {editing ? (
              <Textarea
                value={form.riskFactors}
                onChange={handleFieldChange("riskFactors")}
                placeholder="Descreva os fatores de risco..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.riskFactors || "Não informado"}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Fatores Protetivos</label>
            {editing ? (
              <Textarea
                value={form.protectiveFactors}
                onChange={handleFieldChange("protectiveFactors")}
                placeholder="Descreva os fatores protetivos..."
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-gray-600">
                {form.protectiveFactors || "Não informado"}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Observações Adicionais */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-600">OBSERVAÇÕES ADICIONAIS</h3>
        <div>
          <label className="text-sm font-medium">Notas Adicionais</label>
          {editing ? (
            <Textarea
              value={form.additionalNotes}
              onChange={handleFieldChange("additionalNotes")}
              placeholder="Adicione observações importantes..."
              className="mt-2"
            />
          ) : (
            <p className="mt-2 text-gray-600">
              {form.additionalNotes || "Não informado"}
            </p>
          )}
        </div>
      </Card>

      {/* Save/Cancel buttons at bottom */}
      {editing && (
        <div className="flex gap-2 justify-end sticky bottom-0 bg-white p-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar Anamnese"}
          </Button>
        </div>
      )}
    </div>
  );
}
