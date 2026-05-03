import { PDFPage, rgb, PDFDocument } from "pdf-lib";

export interface HeaderInfo {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  professionalName: string;
  professionalCRP: string;
  professionalEmail: string;
  professionalPhone: string;
  patientName: string;
  patientAge: number;
  patientBirthDate: string;
}

export interface DocumentConfig {
  title: string;
  subtitle: string;
  headerInfo: HeaderInfo;
  city: string;
  date: string;
}

/**
 * Professional PDF Layout Helper
 * Implements grid structure: 15% header, 70% body, 15% footer
 * Margins: 2.5cm (70px) on all sides
 */
export class ProfessionalPDFLayout {
  private page: PDFPage;
  private width: number;
  private height: number;
  private marginX = 70; // 2.5cm
  private marginY = 70; // 2.5cm
  private contentWidth: number;
  private contentHeight: number;
  private currentY: number;

  constructor(page: PDFPage) {
    this.page = page;
    const { width, height } = page.getSize();
    this.width = width;
    this.height = height;
    this.contentWidth = width - this.marginX * 2;
    this.contentHeight = height - this.marginY * 2;
    this.currentY = height - this.marginY;
  }

  /**
   * Draw professional header (15% of page)
   */
  drawHeader(config: DocumentConfig): void {
    const headerHeight = this.height * 0.15;

    // Blue background rectangle
    this.page.drawRectangle({
      x: 0,
      y: this.height - headerHeight,
      width: this.width,
      height: headerHeight,
      color: rgb(0.1, 0.4, 0.7),
    });

    let headerY = this.height - 25;

    // Clinic name (large, bold)
    this.page.drawText(config.headerInfo.clinicName, {
      x: this.marginX,
      y: headerY,
      size: 18,
      color: rgb(1, 1, 1),
      maxWidth: this.contentWidth,
    });

    headerY -= 20;

    // Professional info line: Name | CRP | Phone | Email
    const professionalLine = `${config.headerInfo.professionalName} | CRP: ${config.headerInfo.professionalCRP} | ${config.headerInfo.professionalPhone}`;
    this.page.drawText(professionalLine, {
      x: this.marginX,
      y: headerY,
      size: 9,
      color: rgb(1, 1, 1),
      maxWidth: this.contentWidth,
    });

    headerY -= 15;

    // Location: City, State
    this.page.drawText(`${config.headerInfo.clinicCity}, ${config.headerInfo.clinicState}`, {
      x: this.marginX,
      y: headerY,
      size: 9,
      color: rgb(1, 1, 1),
    });

    headerY -= 15;

    // Patient info: Name | Age | Birth Date
    const patientLine = `Paciente: ${config.headerInfo.patientName} | ${config.headerInfo.patientAge} anos | Nascimento: ${config.headerInfo.patientBirthDate}`;
    this.page.drawText(patientLine, {
      x: this.marginX,
      y: headerY,
      size: 9,
      color: rgb(1, 1, 1),
      maxWidth: this.contentWidth,
    });

    this.currentY = this.height - headerHeight - this.marginY;
  }

  /**
   * Draw document title
   */
  drawTitle(title: string, subtitle: string): void {
    // Title (bold-like with larger size)
    this.page.drawText(title, {
      x: this.marginX,
      y: this.currentY,
      size: 18,
      color: rgb(0.1, 0.4, 0.7),
    });

    this.currentY -= 20;

    // Subtitle
    this.page.drawText(subtitle, {
      x: this.marginX,
      y: this.currentY,
      size: 11,
      color: rgb(0.5, 0.5, 0.5),
    });

    this.currentY -= 15;

    // Thin divider line
    this.page.drawLine({
      start: { x: this.marginX, y: this.currentY },
      end: { x: this.width - this.marginX, y: this.currentY },
      color: rgb(0.1, 0.4, 0.7),
      thickness: 0.75,
    });

    this.currentY -= 20;
  }

  /**
   * Draw section header (bold, blue color)
   */
  drawSectionHeader(sectionNumber: number, sectionTitle: string): void {
    this.currentY -= 5; // Extra spacing before section

    const headerText = `${sectionNumber}. ${sectionTitle}`;
    this.page.drawText(headerText, {
      x: this.marginX,
      y: this.currentY,
      size: 12,
      color: rgb(0.1, 0.4, 0.7),
    });

    this.currentY -= 18;
  }

  /**
   * Draw body text with proper spacing
   */
  drawText(text: string, fontSize = 11, isBold = false): void {
    const lines = this.wrapText(text, 100);
    for (const line of lines) {
      this.page.drawText(line, {
        x: this.marginX,
        y: this.currentY,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      this.currentY -= 16; // 1.5 line spacing
    }
  }

  /**
   * Draw bullet point list
   */
  drawBulletList(items: string[]): void {
    for (const item of items) {
      const lines = this.wrapText(item, 95);
      let isFirstLine = true;

      for (const line of lines) {
        const x = isFirstLine ? this.marginX : this.marginX + 15;
        const bulletText = isFirstLine ? `• ${line}` : line;

        this.page.drawText(bulletText, {
          x: x,
          y: this.currentY,
          size: 11,
          color: rgb(0, 0, 0),
        });

        this.currentY -= 16;
        isFirstLine = false;
      }
    }
  }

  /**
   * Draw footer with signature block
   */
  drawFooter(professionalName: string, professionalCRP: string): void {
    const footerStartY = this.marginY + 80;

    // Signature line (centered)
    const lineStartX = this.marginX + 50;
    const lineEndX = this.marginX + 200;
    this.page.drawLine({
      start: { x: lineStartX, y: footerStartY },
      end: { x: lineEndX, y: footerStartY },
      color: rgb(0, 0, 0),
      thickness: 1,
    });

    // Professional name (centered under line)
    this.page.drawText(professionalName, {
      x: lineStartX,
      y: footerStartY - 20,
      size: 11,
      color: rgb(0, 0, 0),
    });

    // CRP (centered under name)
    this.page.drawText(`CRP: ${professionalCRP}`, {
      x: lineStartX,
      y: footerStartY - 35,
      size: 10,
      color: rgb(0, 0, 0),
    });

    // Footer text
    this.page.drawText("Documento gerado pelo E-Saúde | Gestão Clínica — Uso exclusivo do profissional", {
      x: this.marginX,
      y: this.marginY - 10,
      size: 8,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  /**
   * Draw date and location
   */
  drawDateLocation(city: string, date: string): void {
    this.currentY -= 15;
    this.page.drawText(`${city}, ${date}`, {
      x: this.marginX,
      y: this.currentY,
      size: 11,
      color: rgb(0, 0, 0),
    });
  }

  /**
   * Get current Y position
   */
  getCurrentY(): number {
    return this.currentY;
  }

  /**
   * Set current Y position
   */
  setCurrentY(y: number): void {
    this.currentY = y;
  }

  /**
   * Check if we need a new page
   */
  needsNewPage(requiredSpace: number): boolean {
    return this.currentY - requiredSpace < this.marginY + 100;
  }

  /**
   * Wrap text to fit within content width
   */
  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? " " : "") + word;
      }
    }

    if (currentLine) lines.push(currentLine.trim());
    return lines;
  }
}
