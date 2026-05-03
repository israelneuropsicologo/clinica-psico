import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Users,
} from "lucide-react";

export interface DocumentType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "declaracao",
    title: "Declaração",
    subtitle: "Registro objetivo",
    description:
      "Registra presença ou atendimento. Sem estados psicológicos. Objetiva e sucinta.",
    icon: <FileText className="w-8 h-8" />,
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "atestado",
    title: "Atestado Psicológico",
    subtitle: "Certificação clínica",
    description:
      "Certifica condições para justificar ausências. Baseado em diagnóstico clínico.",
    icon: <CheckCircle className="w-8 h-8" />,
    color: "bg-teal-50 border-teal-200",
  },
  {
    id: "laudo",
    title: "Laudo Psicológico",
    subtitle: "Avaliação técnica",
    description:
      "Resultado de avaliação psicológica. Inclui diagnóstico. Para decisões e processos.",
    icon: <ClipboardList className="w-8 h-8" />,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "parecer",
    title: "Parecer Psicológico",
    subtitle: "Opinião técnica",
    description:
      "Opinião técnica sem avaliação direta. Sobre questões psicológicas específicas.",
    icon: <MessageSquare className="w-8 h-8" />,
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "relatorio",
    title: "Relatório Psicológico",
    subtitle: "Descritivo informativo",
    description:
      "Descritivo, sem diagnóstico. Considera contexto social. Caráter informativo.",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "bg-amber-50 border-amber-200",
  },
  {
    id: "relatorio_multiprofissional",
    title: "Relatório Multiprofissional",
    subtitle: "Trabalho conjunto",
    description:
      "Trabalho conjunto com outros profissionais. Preserva autonomia técnica.",
    icon: <Users className="w-8 h-8" />,
    color: "bg-green-50 border-green-200",
  },
];

interface DocumentTypeSelectorProps {
  onSelectType: (typeId: string) => void;
  selectedType?: string;
}

export function DocumentTypeSelector({
  onSelectType,
  selectedType,
}: DocumentTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Novo Documento
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecione o tipo de documento psicológico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCUMENT_TYPES.map((doc) => (
          <Card
            key={doc.id}
            className={`p-6 cursor-pointer transition-all border-2 ${
              selectedType === doc.id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : doc.color + " hover:shadow-md hover:border-opacity-100"
            }`}
            onClick={() => onSelectType(doc.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-blue-600">{doc.icon}</div>
            </div>

            <h3 className="font-semibold text-foreground mb-1">{doc.title}</h3>
            <p className="text-xs font-medium text-blue-600 mb-3">
              {doc.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {doc.description}
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelectType(doc.id);
              }}
            >
              + CRIAR
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
