// @ts-nocheck
/**
 * PDF Generator Helper
 * Generates PDF reports from HTML content with charts and tables
 */

export async function generateReportPDF(
  reportTitle: string,
  reportContent: HTMLElement,
  fileName: string = "relatorio.pdf"
) {
  try {
    // Dynamically import html2pdf
    const html2pdf = (await import("html2pdf.js")).default;

    const options = {
      margin: 20, // Aumentado de 10 para 20 (margens maiores)
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    // Clone the content to avoid modifying the original
    const clonedContent = reportContent.cloneNode(true) as HTMLElement;

    // Add header with clinic info
    const header = document.createElement("div");
    header.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 10px;
    `;
    header.innerHTML = `
      <h1 style="margin: 0; color: #0c4a6e; font-size: 24px;">${reportTitle}</h1>
      <p style="margin: 5px 0; color: #666; font-size: 12px;">
        Gerado em ${new Date().toLocaleString("pt-BR")}
      </p>
    `;

    // Prepend header to content
    clonedContent.insertBefore(header, clonedContent.firstChild);

    // Generate PDF
    await html2pdf().set(options).from(clonedContent).save();

    return { success: true };
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    throw new Error("Falha ao gerar PDF. Por favor, tente novamente.");
  }
}

/**
 * Generate PDF with charts using jsPDF and Chart.js
 */
export async function generateChartPDF(
  reportTitle: string,
  chartCanvases: HTMLCanvasElement[],
  tables: HTMLTableElement[],
  fileName: string = "relatorio-graficos.pdf"
) {
  try {
    const jsPDF = (await import("jspdf")).jsPDF;
    const html2canvas = (await import("html2canvas")).default;

    // Detectar se precisa de landscape para tabelas grandes
    const needsLandscape = tables.some(t => t.offsetWidth > 800);
    const doc = new jsPDF({
      orientation: needsLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15; // Aumentado de 10 para 15 (margens maiores)
    const contentWidth = pageWidth - 2 * margin;

    // Add title
    doc.setFontSize(16);
    doc.text(reportTitle, margin, yPosition);
    yPosition += 15;

    // Add generation date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margin, yPosition);
    yPosition += 10;
    doc.setTextColor(0);

    // Add charts
    for (const canvas of chartCanvases) {
      if (yPosition + 80 > pageHeight) {
        doc.addPage();
        yPosition = margin;
      }

      const imgData = canvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", margin, yPosition, contentWidth, 80);
      yPosition += 90;
    }

    // Add tables
    for (const table of tables) {
      if (yPosition + 40 > pageHeight) {
        doc.addPage();
        yPosition = margin;
      }

      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");
      const tableHeight = (canvas.height * contentWidth) / canvas.width;

      if (yPosition + tableHeight > pageHeight) {
        doc.addPage();
        yPosition = margin;
      }

      doc.addImage(imgData, "PNG", margin, yPosition, contentWidth, tableHeight);
      yPosition += tableHeight + 10;
    }

    doc.save(fileName);
    return { success: true };
  } catch (error) {
    console.error("Erro ao gerar PDF com gráficos:", error);
    throw new Error("Falha ao gerar PDF com gráficos. Por favor, tente novamente.");
  }
}

/**
 * Export report data as CSV
 */
export function exportAsCSV(
  data: Record<string, any>[],
  fileName: string = "relatorio.csv"
) {
  try {
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado para exportar");
    }

    // Get headers
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = String(value ?? "").replace(/"/g, '""');
            return escaped.includes(",") ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    throw new Error("Falha ao exportar CSV. Por favor, tente novamente.");
  }
}
