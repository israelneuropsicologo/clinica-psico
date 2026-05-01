import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  onExport: (format: "csv" | "json") => Promise<{
    content: string;
    filename: string;
    mimeType: string;
  }> | { content: string; filename: string; mimeType: string };
  label?: string;
}

export default function ExportButton({ onExport, label = "Exportar" }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (format: "csv" | "json") => {
    try {
      setIsLoading(true);
      const result = await Promise.resolve(onExport(format));

      // Criar blob e download usando método seguro
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      
      // Usar fetch + download sem manipular DOM
      const response = await fetch(url);
      const data = await response.blob();
      
      // Criar link temporário apenas para o download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(data);
      link.download = result.filename;
      
      // Disparar download sem adicionar ao DOM
      link.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      
      // Limpar URLs
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(link.href);

      toast.success(`Arquivo ${result.filename} baixado com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          Exportar JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
