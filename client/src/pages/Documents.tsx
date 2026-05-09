import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Users,
} from "lucide-react";
import { DocumentGenerationWithPatientSelector } from "@/components/DocumentGenerationWithPatientSelector";

export interface DocumentType {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "declaracao",
    title: "Declaração",
    subtitle: "Registro objetivo",
    description:
      "Registra presença ou atendimento. Sem estados psicológicos. Objetiva e sucinta.",
    icon: <FileText className="w-12 h-12" />,
    color: "bg-yellow-50 border-yellow-200",
  },
  {
    id: "atestado",
    title: "Atestado Psicológico",
    subtitle: "Certificação clínica",
    description:
      "Certifica condições para justificar ausências. Baseado em diagnóstico clínico.",
    icon: <CheckCircle className="w-12 h-12" />,
    color: "bg-teal-50 border-teal-200",
  },
  {
    id: "laudo",
    title: "Laudo Psicológico",
    subtitle: "Avaliação técnica",
    description:
      "Resultado de avaliação psicológica. Inclui diagnóstico. Para decisões e processos.",
    icon: <ClipboardList className="w-12 h-12" />,
    color: "bg-blue-50 border-blue-200",
  },
  {
    id: "parecer",
    title: "Parecer Psicológico",
    subtitle: "Opinião técnica",
    description:
      "Opinião técnica sem avaliação direta. Sobre questões psicológicas específicas.",
    icon: <MessageSquare className="w-12 h-12" />,
    color: "bg-purple-50 border-purple-200",
  },
  {
    id: "relatorio",
    title: "Relatório Psicológico",
    subtitle: "Descritivo informativo",
    description:
      "Descritivo, sem diagnóstico. Considera contexto social. Caráter informativo.",
    icon: <BarChart3 className="w-12 h-12" />,
    color: "bg-amber-50 border-amber-200",
  },
  {
    id: "relatorio_multiprofissional",
    title: "Relatório Multiprofissional",
    subtitle: "Trabalho conjunto",
    description:
      "Trabalho conjunto com outros profissionais. Preserva autonomia técnica.",
    icon: <Users className="w-12 h-12" />,
    color: "bg-green-50 border-green-200",
  },
];

export default function Documents() {
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSelectDocument = (typeId: string) => {
    setSelectedDocumentType(typeId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDocumentType(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Documentos Psicológicos
        </h1>
        <p className="text-muted-foreground">
          Gere documentos profissionais personalizados para seus pacientes
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Selecione um tipo de documento para começar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DOCUMENT_TYPES.map((doc) => (
          <Card
            key={doc.id}
            className={`p-6 cursor-pointer transition-all duration-300 border-2 hover:shadow-lg hover:scale-105 ${doc.color}`}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="text-blue-600">{doc.icon}</div>

              <div>
                <h3 className="font-semibold text-foreground text-lg">
                  {doc.title}
                </h3>
                <p className="text-xs font-medium text-blue-600 mt-1">
                  {doc.subtitle}
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {doc.description}
              </p>

              <Button
                onClick={() => handleSelectDocument(doc.id)}
                className="w-full mt-4"
              >
                + CRIAR
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedDocumentType && (
        <DocumentGenerationWithPatientSelector
          isOpen={showModal}
          onClose={handleCloseModal}
          documentType={selectedDocumentType}
        />
      )}
    </div>
  );
}
