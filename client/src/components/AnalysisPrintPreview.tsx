import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface AnalysisPrintPreviewProps {
  aiFeedback: string;
  patientName: string;
  sessionDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample data for charts
const moodData = [
  { name: "Anterior", value: 3 },
  { name: "Atual", value: 5 },
];

const riskData = [
  { name: "Suicídio", value: 2 },
  { name: "Auto-agressão", value: 1 },
  { name: "Abuso", value: 1 },
];

const riskDistribution = [
  { name: "Risco Baixo", value: 60, fill: "#10b981" },
  { name: "Risco Moderado", value: 35, fill: "#f59e0b" },
  { name: "Risco Alto", value: 5, fill: "#ef4444" },
];

const wellbeingData = [
  { subject: "Humor", value: 7 },
  { subject: "Sono", value: 4 },
  { subject: "Energia", value: 6 },
  { subject: "Estabilidade", value: 7 },
  { subject: "Relacionamentos", value: 6 },
];

export function AnalysisPrintPreview({
  aiFeedback,
  patientName,
  sessionDate,
  open,
  onOpenChange,
}: AnalysisPrintPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!contentRef.current) return;

    try {
      // Create canvas from HTML
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // ABNT margin
      const contentWidth = pageWidth - 2 * margin;

      // Calculate image dimensions to fit page
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let yPosition = margin;
      const imgData = canvas.toDataURL("image/png");

      // Add pages as needed
      let remainingHeight = imgHeight;
      let pageIndex = 0;

      while (remainingHeight > 0) {
        const canFit = pageHeight - 2 * margin;

        if (pageIndex > 0) {
          pdf.addPage();
          yPosition = margin;
        }

        const heightToDraw = Math.min(remainingHeight, canFit);
        const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);

        pdf.addImage(
          imgData,
          "PNG",
          margin,
          yPosition,
          imgWidth,
          heightToDraw
        );

        remainingHeight -= heightToDraw;
        pageIndex++;
      }

      // Download PDF
      pdf.save(`analise-clinica-${patientName}-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const handlePrint = () => {
    if (!contentRef.current) return;

    const printWindow = window.open("", "", "height=800,width=900");
    if (printWindow) {
      printWindow.document.write(contentRef.current.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pré-visualizar Análise para Impressão</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={generatePDF}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>

        {/* Print Content - ABNT Compliant */}
        <div
          ref={contentRef}
          className="bg-white p-12 text-black"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            lineHeight: "1.5",
            color: "#000",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-4">
            <h1 className="text-xl font-bold mb-1">ANÁLISE CLÍNICA POR INTELIGÊNCIA ARTIFICIAL</h1>
            <p className="text-sm text-gray-600">
              Paciente: <strong>{patientName}</strong>
            </p>
            <p className="text-sm text-gray-600">
              Data da Sessão: <strong>{sessionDate.toLocaleDateString("pt-BR")}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Documento gerado automaticamente pelo sistema E-Saúde
            </p>
          </div>

          {/* Charts Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-6 border-b-2 border-gray-300 pb-2">
              RESULTADO DA ANÁLISE
            </h2>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Mood Evolution */}
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="text-sm font-bold mb-3 text-blue-600">
                  📈 Evolução do Humor
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Risk Assessment */}
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="text-sm font-bold mb-3 text-red-600">
                  ⚠️ Avaliação de Riscos
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Risk Distribution */}
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="text-sm font-bold mb-3 text-yellow-600">
                  🥧 Distribuição de Riscos
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Wellbeing Profile */}
              <div className="border border-gray-300 p-4 rounded">
                <h3 className="text-sm font-bold mb-3 text-purple-600">
                  💎 Perfil de Bem-estar
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={wellbeingData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Bem-estar"
                      dataKey="value"
                      stroke="#a855f7"
                      fill="#a855f7"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analysis Text Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 border-b-2 border-gray-300 pb-2">
              ANÁLISE COMPLETA
            </h2>
            <h3 className="text-sm font-bold mb-3">FEEDBACK TÉCNICO DO PRONTUÁRIO</h3>
            <div
              className="text-justify whitespace-pre-wrap text-xs leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: aiFeedback
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br />"),
              }}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t-2 border-gray-300 pt-4 mt-8">
            <p>Documento confidencial - Uso exclusivamente profissional</p>
            <p>Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
