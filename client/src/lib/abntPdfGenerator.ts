/**
 * Professional Modern PDF Generator for Clinical Analysis
 * Generates modern, professional PDFs with blue headers, colored charts, and structured layout
 */

export function generateABNTFormattedPDF(note: any, aiFeedback: string): string {
  const pacienteName = note?.patientName || "Paciente";
  const dataAtual = new Date().toLocaleDateString("pt-BR");
  const horaAtual = new Date().toLocaleTimeString("pt-BR");
  const clinicName = "E-Saúde | Gestão Clínica";
  const crp = "CRP 11/99999";
  
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
          font-family: 'Segoe UI', 'Calibri', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
          padding: 20px;
          font-size: 11pt;
        }
        
        .container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        /* Blue Header Section */
        .header-blue {
          background: linear-gradient(135deg, #0c4a6e 0%, #164e8a 100%);
          color: white;
          padding: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
        }
        
        .header-blue-left h1 {
          font-size: 32pt;
          font-weight: 300;
          letter-spacing: 2px;
          margin-bottom: 5px;
        }
        
        .header-blue-left p {
          font-size: 10pt;
          opacity: 0.9;
          letter-spacing: 1px;
        }
        
        .header-blue-right {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        
        .icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24pt;
          border: 2px solid white;
        }
        
        /* Main Title */
        .main-title {
          font-size: 24pt;
          font-weight: bold;
          color: #0c4a6e;
          text-align: center;
          padding: 30px 40px 20px;
          border-bottom: 3px solid #0c4a6e;
          margin-bottom: 30px;
        }
        
        /* Content Area */
        .content {
          padding: 40px;
          background: white;
        }
        
        /* Patient Info Card */
        .patient-card {
          background: #f0f9ff;
          border-left: 5px solid #0c4a6e;
          padding: 20px;
          margin-bottom: 30px;
          border-radius: 4px;
        }
        
        .patient-card p {
          margin: 8px 0;
          font-size: 11pt;
        }
        
        .patient-card strong {
          color: #0c4a6e;
          font-weight: 600;
        }
        
        /* Sections */
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #0c4a6e;
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #0c4a6e;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .section-number {
          background: #0c4a6e;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12pt;
        }
        
        .section-content {
          margin-left: 20px;
          font-size: 11pt;
          line-height: 1.7;
          text-align: justify;
        }
        
        .section-content p {
          margin-bottom: 12px;
          color: #444;
        }
        
        /* Bullet points */
        .bullet-list {
          margin: 15px 0 15px 40px;
          list-style-type: none;
        }
        
        .bullet-list li {
          margin: 10px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .bullet-list li:before {
          content: "•";
          color: #f59e0b;
          font-weight: bold;
          position: absolute;
          left: 0;
        }
        
        .bullet-list strong {
          color: #0c4a6e;
          font-weight: 600;
        }
        
        /* Emphasis */
        .emphasis {
          color: #0c4a6e;
          font-weight: 600;
        }
        
        .highlight {
          background-color: #fef3c7;
          padding: 3px 6px;
          border-radius: 2px;
        }
        
        /* Info Box */
        .info-box {
          background: linear-gradient(135deg, #0c4a6e 0%, #164e8a 100%);
          color: white;
          padding: 20px;
          border-radius: 4px;
          margin: 20px 0;
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }
        
        .info-box-icon {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20pt;
          flex-shrink: 0;
        }
        
        .info-box-content strong {
          display: block;
          margin-bottom: 5px;
          font-size: 12pt;
        }
        
        /* Table */
        .table-container {
          margin: 20px 0;
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        table thead {
          background: #0c4a6e;
          color: white;
        }
        
        table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 11pt;
        }
        
        table td {
          padding: 10px 12px;
          border-bottom: 1px solid #ddd;
          font-size: 11pt;
        }
        
        table tbody tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        table tbody tr:hover {
          background: #f0f9ff;
        }
        
        /* Footer */
        .footer {
          background: #f5f5f5;
          border-top: 2px solid #0c4a6e;
          padding: 20px 40px;
          font-size: 9pt;
          color: #666;
          text-align: center;
          margin-top: 40px;
        }
        
        .footer p {
          margin: 5px 0;
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
            background: white;
          }
          .container {
            box-shadow: none;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Blue Header -->
        <div class="header-blue">
          <div class="header-blue-left">
            <h1>Relatório</h1>
            <p>ANÁLISE CLÍNICA</p>
          </div>
          <div class="header-blue-right">
            <div class="icon-circle">🔒</div>
            <div class="icon-circle">⋮</div>
          </div>
        </div>
        
        <!-- Main Title -->
        <div class="main-title">ANÁLISE TÉCNICA DO PRONTUÁRIO</div>
        
        <!-- Content -->
        <div class="content">
          <!-- Patient Info Card -->
          <div class="patient-card">
            <p><strong>👤 Paciente:</strong> ${pacienteName}</p>
            <p><strong>📅 Data da Análise:</strong> ${dataAtual}</p>
            <p><strong>🕐 Hora:</strong> ${horaAtual}</p>
            <p><strong>🏥 Clínica:</strong> ${clinicName}</p>
            <p><strong>📋 Tipo:</strong> Feedback Técnico do Prontuário</p>
          </div>
          
          <!-- Main Feedback Section -->
          <div class="section">
            <div class="section-title">
              <div class="section-number">1</div>
              FEEDBACK TÉCNICO DO PRONTUÁRIO
            </div>
            <div class="section-content">
              ${formatFeedbackContent(feedbackText)}
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>Documento Gerado Automaticamente</strong></p>
          <p>Sistema E-Saúde | Gestão Clínica</p>
          <p>Data: ${dataAtual} | Hora: ${horaAtual}</p>
          <p style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
            Este documento é confidencial e destinado apenas ao uso profissional autorizado.
          </p>
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
  let sectionNumber = 2;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      continue;
    }
    
    // Check for section headers (lines with ** at start and end or starting with "Seção")
    if ((trimmed.startsWith("**") && trimmed.endsWith("**")) || trimmed.startsWith("Seção")) {
      if (inBulletList) {
        html += "</ul>";
        inBulletList = false;
      }
      const title = trimmed.replace(/\*\*/g, "").replace(/^Seção \d+ - /, "");
      html += `<div class="section" style="margin-top: 25px;">
        <div class="section-title">
          <div class="section-number">${sectionNumber}</div>
          ${title}
        </div>
        <div class="section-content">`;
      sectionNumber++;
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
  
  html += "</div></div>";
  
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
