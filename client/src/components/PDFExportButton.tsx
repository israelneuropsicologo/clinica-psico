import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface PDFExportButtonProps {
  onExportPDF: () => Promise<{
    success: boolean;
    filename: string;
    data: string; // base64
    mimeType: string;
  }>;
  label?: string;
  disabled?: boolean;
}

export default function PDFExportButton({ 
  onExportPDF, 
  label = "Exportar PDF",
  disabled = false 
}: PDFExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsLoading(true);
      const result = await onExportPDF();

      if (!result.success) {
        toast.error("Erro ao gerar PDF");
        return;
      }

      // Decodificar base64 para blob
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.mimeType });

      // Criar link e disparar download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.dispatchEvent(new MouseEvent("click", { bubbles: true }));

      // Limpar
      URL.revokeObjectURL(url);

      toast.success(`${result.filename} baixado com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório em PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleExportPDF}
      variant="outline" 
      size="sm" 
      disabled={isLoading || disabled}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
