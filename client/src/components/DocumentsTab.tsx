import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2 } from "lucide-react";
import { DocumentTypeSelector, DOCUMENT_TYPES } from "./DocumentTypeSelector";
import { DocumentGenerationModal } from "./DocumentGenerationModal";
import { useDocumentGeneration } from "@/hooks/useDocumentGeneration";

interface Document {
  id: number;
  fileName: string;
  fileUrl: string;
  category: string;
  createdAt: string;
}

interface DocumentsTabProps {
  patientId: number;
  patientName: string;
  documents?: Document[];
  onShowUpload: () => void;
  onDeleteDocument: (id: number) => void;
  isDeleting?: boolean;
}

export function DocumentsTab({
  patientId,
  patientName,
  documents = [],
  onShowUpload,
  onDeleteDocument,
  isDeleting = false,
}: DocumentsTabProps) {
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const { generateDocument, isLoading: isGenerating } = useDocumentGeneration(patientId);

  const handleSelectDocumentType = (typeId: string) => {
    setSelectedDocumentType(typeId);
    setShowDocumentSelector(false);
    setShowGenerationModal(true);
  };

  const handleGenerateDocument = async (data: Record<string, string>) => {
    if (!selectedDocumentType) return;
    await generateDocument(selectedDocumentType, data);
    setShowGenerationModal(false);
    setSelectedDocumentType(null);
  };

  const getDocumentTypeTitle = (typeId: string) => {
    const doc = DOCUMENT_TYPES.find((d) => d.id === typeId);
    return doc?.title || "Documento";
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header with buttons */}
        <div className="flex justify-between items-center gap-2">
          <p className="text-sm text-muted-foreground">{documents.length} documento(s)</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setShowDocumentSelector(true)}
              className="gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Novo Documento
            </Button>
            <Button
              size="sm"
              onClick={onShowUpload}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" /> Anexar Documento
            </Button>
          </div>
        </div>

        {/* Document Selector Modal */}
        {showDocumentSelector && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <DocumentTypeSelector
              onSelectType={handleSelectDocumentType}
              selectedType={selectedDocumentType || undefined}
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDocumentSelector(false)}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {/* Documents List */}
        {!documents.length && !showDocumentSelector ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum documento anexado.</p>
              <p className="text-xs mt-1">
                Crie novos documentos psicológicos ou anexe laudos, exames e receitas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.category === "report"
                          ? "Laudo"
                          : doc.category === "exam"
                          ? "Exame"
                          : doc.category === "prescription"
                          ? "Receita"
                          : doc.category === "referral"
                          ? "Encaminhamento"
                          : doc.category === "consent"
                          ? "Consentimento"
                          : "Outro"}{" "}
                        • {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                        Ver
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Excluir documento?")) {
                          onDeleteDocument(doc.id);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generation Modal */}
      {selectedDocumentType && (
        <DocumentGenerationModal
          isOpen={showGenerationModal}
          onClose={() => {
            setShowGenerationModal(false);
            setSelectedDocumentType(null);
          }}
          documentType={selectedDocumentType}
          patientName={patientName}
          onGenerate={handleGenerateDocument}
          isLoading={isGenerating}
        />
      )}
    </>
  );
}
