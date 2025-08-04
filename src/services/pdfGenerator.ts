// PDF Generation Service for Weekly Grocery Lists
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface WeeklyListItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  bestStore: string;
  reasoning: string[];
  predictedRunOutDate?: Date;
}

interface PDFGenerationOptions {
  includeImages: boolean;
  includePricing: boolean;
  includeStoreInfo: boolean;
  includeReasoningDetails: boolean;
  colorScheme: 'standard' | 'colorful' | 'blackwhite';
  paperSize: 'a4' | 'letter';
}

export class PDFGeneratorService {
  private defaultOptions: PDFGenerationOptions = {
    includeImages: true,
    includePricing: true,
    includeStoreInfo: true,
    includeReasoningDetails: false,
    colorScheme: 'colorful',
    paperSize: 'letter'
  };

  // Generate PDF from weekly restock list
  async generateWeeklyListPDF(
    items: WeeklyListItem[], 
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: opts.paperSize === 'a4' ? 'a4' : 'letter'
      });

      // Set up page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add header
      this.addHeader(pdf, pageWidth, margin, opts);
      
      let yPosition = 60; // Start below header

      // Add summary section
      yPosition = this.addSummarySection(pdf, items, margin, yPosition, contentWidth, opts);
      
      // Add items by category
      yPosition = this.addItemsByCategory(pdf, items, margin, yPosition, contentWidth, pageHeight, opts);

      // Add footer
      this.addFooter(pdf, pageWidth, pageHeight, margin, opts);

      // Save the PDF
      const fileName = `Laurie's_Weekly_Grocery_List_${this.formatDateForFilename(new Date())}.pdf`;
      pdf.save(fileName);

      console.log(`✅ PDF saved as: ${fileName}`);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error('Failed to generate weekly grocery list PDF');
    }
  }

  private addHeader(pdf: jsPDF, pageWidth: number, margin: number, opts: PDFGenerationOptions): void {
    // Add forest green background for header if colorful
    if (opts.colorScheme === 'colorful') {
      pdf.setFillColor(16, 185, 129); // Forest green #10B981
      pdf.rect(0, 0, pageWidth, 50, 'F');
    }

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(opts.colorScheme === 'blackwhite' ? 0 : 255, 255, 255);
    
    const title = "🍳 Laurie's Weekly Grocery Adventure";
    const titleWidth = pdf.getTextWidth(title);
    pdf.text(title, (pageWidth - titleWidth) / 2, 25);

    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const subtitle = `Generated on ${new Date().toLocaleDateString()} • Predictive Restock System`;
    const subtitleWidth = pdf.getTextWidth(subtitle);
    pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 35);

    // Decorative line
    if (opts.colorScheme === 'colorful') {
      pdf.setDrawColor(255, 215, 0); // Gold
      pdf.setLineWidth(2);
      pdf.line(margin, 45, pageWidth - margin, 45);
    } else {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 45, pageWidth - margin, 45);
    }

    // Reset text color
    pdf.setTextColor(0, 0, 0);
  }

  private addSummarySection(
    pdf: jsPDF, 
    items: WeeklyListItem[], 
    margin: number, 
    yPos: number, 
    contentWidth: number, 
    opts: PDFGenerationOptions
  ): number {
    let yPosition = yPos + 10;

    // Summary box
    if (opts.colorScheme === 'colorful') {
      pdf.setFillColor(240, 248, 255); // Light blue background
      pdf.setDrawColor(16, 185, 129);
    } else {
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(0, 0, 0);
    }
    
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, contentWidth, 30, 'FD');

    // Summary stats
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(opts.colorScheme === 'colorful' ? 16 : 0, opts.colorScheme === 'colorful' ? 185 : 0, opts.colorScheme === 'colorful' ? 129 : 0);
    pdf.text('📊 Shopping Summary', margin + 5, yPosition + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    const totalItems = items.length;
    const criticalItems = items.filter(item => item.urgency === 'critical').length;
    const highPriorityItems = items.filter(item => item.urgency === 'high').length;

    const summaryText = [
      `Total Items: ${totalItems}`,
      `Critical Items: ${criticalItems}`,
      `High Priority: ${highPriorityItems}`
    ];

    summaryText.forEach((text, index) => {
      pdf.text(text, margin + 5, yPosition + 18 + (index * 4));
    });

    return yPosition + 40;
  }

  private addItemsByCategory(
    pdf: jsPDF, 
    items: WeeklyListItem[], 
    margin: number, 
    yPos: number, 
    contentWidth: number, 
    pageHeight: number, 
    opts: PDFGenerationOptions
  ): number {
    let yPosition = yPos;

    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
      const category = item.category || 'Miscellaneous';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, WeeklyListItem[]>);

    // Sort categories
    const sortedCategories = Object.keys(itemsByCategory).sort();

    for (const category of sortedCategories) {
      const categoryItems = itemsByCategory[category];
      
      // Check if we need a new page
      const requiredSpace = 20 + (categoryItems.length * 8);
      if (yPosition + requiredSpace > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      // Category header
      if (opts.colorScheme === 'colorful') {
        pdf.setFillColor(16, 185, 129, 0.1);
        pdf.setDrawColor(16, 185, 129);
      } else {
        pdf.setFillColor(240, 240, 240);
        pdf.setDrawColor(0, 0, 0);
      }
      
      pdf.rect(margin, yPosition, contentWidth, 12, 'FD');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(opts.colorScheme === 'colorful' ? 16 : 0, opts.colorScheme === 'colorful' ? 185 : 0, opts.colorScheme === 'colorful' ? 129 : 0);
      
      const categoryIcon = this.getCategoryIcon(category);
      const cleanCategory = this.cleanText(category);
      pdf.text(`${categoryIcon} ${cleanCategory} (${categoryItems.length} items)`, margin + 3, yPosition + 8);
      
      yPosition += 16;

      // Items in category
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      for (const item of categoryItems) {
        // Check if we need a new page
        if (yPosition + 12 > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        // Item box
        const itemHeight = opts.includeReasoningDetails ? 16 : 8;
        
        // Urgency color coding
        if (opts.colorScheme === 'colorful') {
          let urgencyColor: [number, number, number] = [255, 255, 255];
          switch (item.urgency) {
            case 'critical': urgencyColor = [254, 242, 242]; break; // Light red
            case 'high': urgencyColor = [255, 247, 237]; break; // Light orange
            case 'medium': urgencyColor = [254, 252, 232]; break; // Light yellow
            case 'low': urgencyColor = [240, 253, 244]; break; // Light green
          }
          pdf.setFillColor(...urgencyColor);
          pdf.rect(margin, yPosition, contentWidth, itemHeight, 'F');
        }

        // Item details
        const urgencyEmoji = this.getUrgencyEmoji(item.urgency);
        const quantityText = `${item.quantity} ${item.unit}`;
        const storeText = opts.includeStoreInfo ? ` • ${item.bestStore}` : '';
        
        // Clean up item name and add checkbox
        const cleanItemName = this.cleanText(item.name);
        const checkbox = '☐'; // Empty checkbox
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${checkbox} ${urgencyEmoji} ${cleanItemName}`, margin + 2, yPosition + 5);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${quantityText}${storeText}`, margin + 2, yPosition + 9);

        // Add reasoning if requested
        if (opts.includeReasoningDetails && item.reasoning.length > 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          const reasoningText = item.reasoning[0]; // First reason only for space
          pdf.text(`└ ${reasoningText}`, margin + 4, yPosition + 13);
        }

        yPosition += itemHeight + 2;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      }

      yPosition += 5; // Space between categories
    }

    return yPosition;
  }

  private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number, opts: PDFGenerationOptions): void {
    const footerY = pageHeight - 15;
    
    // Footer line
    if (opts.colorScheme === 'colorful') {
      pdf.setDrawColor(16, 185, 129);
    } else {
      pdf.setDrawColor(0, 0, 0);
    }
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Footer text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    
    const footerText = "Generated by Laurie's Legendary Kitchen • Predictive Restock & Dynamic Pricing Advisor";
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, footerY);

    const pageInfo = `Page 1`;
    pdf.text(pageInfo, pageWidth - margin - pdf.getTextWidth(pageInfo), footerY);
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Pantry – Staples': '🏺',
      'Pantry – Oils, Vinegars & Condiments': '🫒',
      'Pantry – Cereals': '🥣',
      'Pantry – Pasta': '🍝',
      'Pantry – Rice & Grains': '🌾',
      'Pantry – Baking & Misc. Dry Goods': '🧁',
      'Fridge': '🧊',
      'Produce': '🥬',
      'Dairy': '🥛',
      'Meat': '🥩',
      'Frozen': '❄️',
      'Snacks': '🍿',
      'Beverages': '🥤',
      'Cleaning': '🧽',
      'Personal Care': '🧴'
    };
    return icons[category] || '📦';
  }

  private getUrgencyEmoji(urgency: string): string {
    const emojis: Record<string, string> = {
      'critical': '🚨',
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return emojis[urgency] || '⚪';
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '_');
  }

  private cleanText(text: string): string {
    // Remove strange symbols and encoding artifacts
    return text
      .replace(/[Ø=ßá]/g, '') // Remove specific strange symbols
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  // Generate PDF from HTML element (alternative method)
  async generatePDFFromElement(elementId: string, filename: string = 'grocery_list.pdf'): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
      console.log(`✅ PDF saved as: ${filename}`);
    } catch (error) {
      console.error('❌ Error generating PDF from element:', error);
      throw error;
    }
  }
}

// Singleton instance
export const pdfGeneratorService = new PDFGeneratorService();