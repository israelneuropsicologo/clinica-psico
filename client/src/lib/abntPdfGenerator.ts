/**
 * ABNT PDF Generator for Clinical Analysis
 * Generates professional ABNT-formatted PDFs with proper styling and colors
 */

export function generateABNTFormattedPDF(note: any, aiFeedback: string): string {
  const pacienteName = note?.patientName || "Paciente";
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  const horaAtual = new Date().toLocaleTimeString("pt-BR");
  
  // Parse feedback to extract sections
  const feedbackText = aiFeedback || "";
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Análise Clínica - ${pacienteName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          line-height: 1.5;
          color: #333;
          background: white;
          padding: 40px;
          font-size: 12pt;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        
        /* Header */
        .header {
          text-align: center;
          border-bottom: 2px solid #0c4a6e;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #0c4a6e;
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header-info {
          font-size: 10pt;
          color: #666;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        
        .header-info span {
          margin: 0 10px;
        }
        
        /* Patient Info */
        .patient-info {
          background: #f0f9ff;
          border-left: 4px solid #0c4a6e;
          padding: 15px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        
        .patient-info p {
          margin: 5px 0;
          font-size: 11pt;
        }
        
        .patient-info strong {
          color: #0c4a6e;
        }
        
        /* Sections */
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          color: #0c4a6e;
          font-size: 13pt;
          font-weight: bold;
          margin-bottom: 10px;
          border-bottom: 1px solid #0c4a6e;
          padding-bottom: 5px;
        }
        
        .section-content {
          margin-left: 20px;
          font-size: 11pt;
          line-height: 1.6;
          text-align: justify;
        }
        
        .section-content p {
          margin-bottom: 10px;
        }
        
        /* Bullet points */
        .bullet-list {
          margin: 10px 0 10px 40px;
          list-style-type: disc;
        }
        
        .bullet-list li {
          margin: 8px 0;
        }
        
        .bullet-list strong {
          color: #0c4a6e;
        }
        
        /* Emphasis */
        .emphasis {
          color: #f59e0b;
          font-weight: bold;
        }
        
        .highlight {
          background-color: #fef3c7;
          padding: 2px 4px;
        }
        
        /* Footer */
        .footer {
          border-top: 1px solid #ccc;
          margin-top: 40px;
          padding-top: 20px;
          font-size: 9pt;
          color: #666;
          text-align: center;
        }
        
        /* Page break */
        .page-break {
          page-break-after: always;
          margin-bottom: 40px;
        }
        
        /* Print styles */
        @media print {
          body {
            padding: 0;
          }
          .container {
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>ANÁLISE CLÍNICA - PRONTUÁRIO</h1>
          <div class="header-info">
            <span><strong>Paciente:</strong> ${pacienteName}</span>
            <span><strong>Data:</strong> ${dataAtual}</span>
            <span><strong>Hora:</strong> ${horaAtual}</span>
          </div>
        </div>
        
        <!-- Patient Info -->
        <div class="patient-info">
          <p><strong>Paciente:</strong> ${pacienteName}</p>
          <p><strong>Data da Análise:</strong> ${dataAtual}</p>
          <p><strong>Tipo:</strong> Feedback Técnico do Prontuário</p>
        </div>
        
        <!-- Main Content -->
        <div class="section">
          <div class="section-title">FEEDBACK TÉCNICO DO PRONTUÁRIO</div>
          <div class="section-content">
            ${formatFeedbackContent(feedbackText)}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema E-Saúde</p>
          <p>Data: ${dataAtual} | Hora: ${horaAtual}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format feedback content with proper HTML structure
 */
function formatFeedbackContent(feedbackText: string): string {
  if (!feedbackText) return "<p>Nenhuma análise disponível.</p>";
  
  const lines = feedbackText.split("\n");
  let html = "";
  let inBulletList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      html += "<p></p>";
      continue;
    }
    
    // Check for section headers (lines with ** at start and end)
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      const title = trimmed.replace(/\*\*/g, "");
      html += `<p style="font-weight: bold; color: #0c4a6e; margin-top: 15px; margin-bottom: 10px;">${title}</p>`;
      continue;
    }
    
    // Check for bullet points
    if (trimmed.startsWith("- ")) {
      if (!inBulletList) {
        html += '<ul class="bullet-list">';
        inBulletList = true;
      }
      const content = trimmed.substring(2);
      const formatted = formatInlineMarkdown(content);
      html += `<li>${formatted}</li>`;
      continue;
    }
    
    // Regular paragraph
    if (inBulletList) {
      html += "</ul>";
      inBulletList = false;
    }
    
    const formatted = formatInlineMarkdown(trimmed);
    html += `<p>${formatted}</p>`;
  }
  
  if (inBulletList) {
    html += "</ul>";
  }
  
  return html;
}

/**
 * Format inline markdown (bold, emphasis, etc.)
 */
function formatInlineMarkdown(text: string): string {
  // Replace **text** with <strong class="emphasis">text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="emphasis">$1</strong>');
  
  // Replace *text* with <em>text</em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  return text;
}
