import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateAnalysisPDF(
  patientName: string,
  feedback: string,
  chartsHTML: string
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  pdf.setFontSize(16);
  (pdf as any).setFont(undefined, 'bold');
  pdf.text('ANÁLISE CLÍNICA POR INTELIGÊNCIA ARTIFICIAL', margin, yPosition);
  yPosition += 10;

  // Patient name
  pdf.setFontSize(11);
  (pdf as any).setFont(undefined, 'normal');
  pdf.text(`Paciente: ${patientName}`, margin, yPosition);
  yPosition += 8;

  // Date
  const today = new Date().toLocaleDateString('pt-BR');
  pdf.text(`Data: ${today}`, margin, yPosition);
  yPosition += 12;

  // Separator line
  pdf.setDrawColor(200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Charts section
  if (chartsHTML) {
    try {
      const chartsElement = document.createElement('div');
      chartsElement.innerHTML = chartsHTML;
      chartsElement.style.padding = '10px';
      chartsElement.style.backgroundColor = 'white';

      const canvas = await html2canvas(chartsElement, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (yPosition + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;
    } catch (error) {
      console.error('Error adding charts to PDF:', error);
    }
  }

  // Feedback section
  if (yPosition > pageHeight - margin - 20) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(12);
  (pdf as any).setFont(undefined, 'bold');
  pdf.text('FEEDBACK TÉCNICO DO PRONTUÁRIO', margin, yPosition);
  yPosition += 8;

  // Parse markdown and add feedback text
  pdf.setFontSize(10);
  (pdf as any).setFont(undefined, 'normal');

  const lines = feedback.split('\n');
  for (const line of lines) {
    if (yPosition > pageHeight - margin - 5) {
      pdf.addPage();
      yPosition = margin;
    }

    if (line.trim() === '') {
      yPosition += 4;
    } else if (line.startsWith('**') && line.endsWith('**')) {
      // Bold text
      (pdf as any).setFont(undefined, 'bold');
      const text = line.replace(/\*\*/g, '');
      const wrappedText = pdf.splitTextToSize(text, contentWidth) as any;
      pdf.text(wrappedText, margin, yPosition);
      yPosition += (wrappedText as any).length * 5 + 2;
      (pdf as any).setFont(undefined, 'normal');
    } else if (line.startsWith('- ')) {
      // Bullet point
      const text = line.substring(2);
      const wrappedText = pdf.splitTextToSize(text, contentWidth - 5) as any;
      pdf.text('•', margin + 2, yPosition);
      pdf.text(wrappedText, margin + 8, yPosition);
      yPosition += (wrappedText as any).length * 5 + 2;
    } else {
      // Regular text
      const wrappedText = pdf.splitTextToSize(line, contentWidth) as any;
      pdf.text(wrappedText, margin, yPosition);
      yPosition += wrappedText.length * 5 + 2;
    }
  }

  // Footer
  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' } as any
    );
  }

  return pdf.output('blob');
}

export async function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function viewPDFInBrowser(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export async function printPDF(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
  };
}
