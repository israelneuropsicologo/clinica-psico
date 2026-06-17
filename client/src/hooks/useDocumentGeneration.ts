import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useDocumentGeneration(patientId: number) {
  const [isLoading, setIsLoading] = useState(false);

  const generateDeclaracao = trpc.reports.generateDeclaracao.useMutation();
  const generateAtestado = trpc.reports.generateAtestado.useMutation();
  const generateLaudo = trpc.reports.generateLaudo.useMutation();
  const generateParecer = trpc.reports.generateParecer.useMutation();
  const generateRelatorio = trpc.reports.generateRelatorio.useMutation();
  const generateRelatorioMultiprofissional = trpc.reports.generateRelatorioMultiprofissional.useMutation();

  const generateDocument = async (
    documentType: string,
    data: Record<string, string>
  ) => {
    setIsLoading(true);
    try {
      let mutation;
      let payload: any = { patientId, ...data };

      switch (documentType) {
        case "declaracao":
          mutation = generateDeclaracao;
          break;
        case "atestado":
          mutation = generateAtestado;
          break;
        case "laudo":
          mutation = generateLaudo;
          break;
        case "parecer":
          mutation = generateParecer;
          break;
        case "relatorio":
          mutation = generateRelatorio;
          break;
        case "relatorio_multiprofissional":
          mutation = generateRelatorioMultiprofissional;
          break;
        default:
          throw new Error("Tipo de documento inválido");
      }

      const result = await mutation.mutateAsync(payload);

      if (result.success && result.data) {
        // Decode base64 and download
        const binaryString = atob(result.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Documento gerado com sucesso!");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao gerar documento";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateDocument,
    isLoading,
  };
}
