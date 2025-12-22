const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { PDFDocument: PDFLib } = require('pdf-lib');
const { DocumentMetadata } = require('../models');
const fs = require('fs');
const path = require('path');

// Modern professional color scheme
const COLORS = {
  PRIMARY: '#1565C0',
  PRIMARY_LIGHT: '#E3F2FD',
  SECONDARY: '#0D47A1',
  ACCENT: '#42A5F5',
  SUCCESS: '#2E7D32',
  WARNING: '#F57C00',
  DANGER: '#C62828',
  TEXT_PRIMARY: '#212121',
  TEXT_SECONDARY: '#757575',
  BORDER: '#E0E0E0',
  BACKGROUND: '#FAFAFA',
  WHITE: '#FFFFFF'
};

const FONTS = {
  HEADING: 'Helvetica-Bold',
  BODY: 'Helvetica',
  BODY_BOLD: 'Helvetica-Bold',
  LIGHT: 'Helvetica'
};

const MARGIN = 50;

class EnhancedPdfService {
  constructor() {
    this.logoPath = path.join(__dirname, '../assets/logo.png');
    this.logoExists = fs.existsSync(this.logoPath);
  }

  async generateEnhancedReport(userData, adherenceData, startDate, endDate, options = {}) {
    const {
      includeCharts = false,
      passwordProtect = false,
      signatureRequired = false
    } = options;

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          bufferPages: true,
          autoFirstPage: false
        });

        const documentId = crypto.randomUUID();
        const generationTimestamp = new Date();
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        
        doc.on('end', async () => {
          const pdfData = Buffer.concat(buffers);
          let finalPdfData = pdfData;
          if (passwordProtect) {
            finalPdfData = await this.addPasswordProtection(pdfData);
          }

          try {
            await DocumentMetadata.create({
              documentId,
              userId: userData.id,
              documentType: 'ADHERENCE_REPORT',
              documentHash: crypto.createHash('sha256').update(finalPdfData).digest('hex'),
              fileName: `CareSync_Adherence_Report_${startDate}_to_${endDate}.pdf`,
              fileSize: finalPdfData.length,
              generationTimestamp,
              expirationDate,
              passwordProtected: !!passwordProtect,
              signatureRequired: !!signatureRequired,
              includeCharts: !!includeCharts,
              metadata: {
                userId: userData.id,
                reportPeriod: { startDate, endDate },
                adherenceRate: adherenceData.rate
              }
            });
          } catch (error) {
            console.error('Failed to save metadata:', error);
          }

          resolve(finalPdfData);
        });

        doc.addPage();

        (async () => {
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(
              `${process.env.BASE_URL || 'https://caresync.com'}/api/verify?docId=${documentId}`
            );
            const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            
            // Draw content
            this.drawProfessionalDocument(doc, userData, adherenceData, includeCharts, 
              generationTimestamp, qrCodeBuffer);
            
            // Post-processing: Add Footers and Page Numbers to ALL pages
            this.addGlobalElements(doc, documentId, expirationDate);

            doc.end();
          } catch (err) {
            reject(err);
          }
        })();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper to handle page breaks centrally
   * Returns the new Y coordinate (reset to top if new page added)
   * @param {Object} doc - PDFKit document instance
   * @param {number} currentY - Current Y position
   * @param {number} heightNeeded - Height required for the next element
   * @param {Function} [onPageBreak] - Optional callback to run after page break (e.g., redraw table headers)
   */
  checkPageBreak(doc, currentY, heightNeeded, onPageBreak = null) {
    const bottomLimit = doc.page.height - MARGIN - 80; // Leave 80px space for footer
    
    if (currentY + heightNeeded > bottomLimit) {
      doc.addPage();
      let newY = MARGIN + 20; // Start slightly below margin on new page
      
      if (onPageBreak) {
        // Run callback (e.g., redraw table headers) and update Y
        // The callback should return the new Y after drawing headers
        const resultY = onPageBreak(doc, newY);
        if (resultY) newY = resultY;
      }
      
      return newY;
    }
    return currentY;
  }

  drawProfessionalDocument(doc, userData, adherenceData, includeCharts, 
    generationTimestamp, qrCodeBuffer) {
    
    let y = MARGIN;

    // === HEADER ===
    y = this.drawModernHeader(doc, y, generationTimestamp, qrCodeBuffer);
    y += 40;

    // === TITLE ===
    y = this.drawDocumentTitle(doc, y);
    y += 30;

    // === PATIENT CARD ===
    y = this.checkPageBreak(doc, y, 80);
    y = this.drawPatientInfoCard(doc, y, userData);
    y += 30;

    // === METRICS ===
    y = this.checkPageBreak(doc, y, 100);
    y = this.drawMetricsDashboard(doc, y, adherenceData);
    y += 30;

    // === VISUALIZATION ===
    if (includeCharts) {
      y = this.checkPageBreak(doc, y, 60);
      y = this.drawVisualization(doc, y, adherenceData);
      y += 30;
    }

    // === STATS TABLE ===
    y = this.checkPageBreak(doc, y, 180);
    y = this.drawStatsSection(doc, y, adherenceData);
    y += 30;

    // === MEDICATION HISTORY ===
    // This handles its own internal page breaks row-by-row
    y = this.drawMedicationSection(doc, y, adherenceData.history);
  }

  drawModernHeader(doc, y, timestamp, qrCodeBuffer) {
    doc.fillColor(COLORS.PRIMARY).rect(0, 0, doc.page.width, 3).fill();

    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(24)
       .text('CareSync', MARGIN, y);
    
    doc.fillColor(COLORS.TEXT_SECONDARY)
       .font(FONTS.LIGHT)
       .fontSize(9)
       .text('Healthcare Adherence Platform', MARGIN, y + 28);
    
    doc.text('www.caresync.com', MARGIN, y + 40);

    doc.image(qrCodeBuffer, doc.page.width - 110, y, { width: 60 });
    
    doc.fillColor(COLORS.TEXT_SECONDARY)
       .fontSize(8)
       .text('Scan to verify', doc.page.width - 110, y + 65, { width: 60, align: 'center' });

    doc.fillColor(COLORS.TEXT_SECONDARY)
       .fontSize(9)
       .text(`Generated: ${timestamp.toLocaleDateString('en-US', { 
         year: 'numeric', month: 'short', day: 'numeric' 
       })}`, doc.page.width - 200, y + 25, { width: 80, align: 'right' });

    doc.strokeColor(COLORS.BORDER)
       .lineWidth(1)
       .moveTo(MARGIN, y + 85)
       .lineTo(doc.page.width - MARGIN, y + 85)
       .stroke();

    return y + 95;
  }

  drawDocumentTitle(doc, y) {
    doc.fillColor(COLORS.TEXT_PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(20)
       .text('Patient Medication Adherence Report', MARGIN, y);
    
    doc.fillColor(COLORS.TEXT_SECONDARY)
       .font(FONTS.LIGHT)
       .fontSize(10)
       .text('Comprehensive Analysis & Clinical Summary', MARGIN, y + 25);

    return y + 45;
  }

  drawPatientInfoCard(doc, y, userData) {
    const cardHeight = 70;
    doc.fillColor(COLORS.PRIMARY_LIGHT)
       .rect(MARGIN, y, doc.page.width - (MARGIN * 2), cardHeight)
       .fill();

    doc.fillColor(COLORS.PRIMARY)
       .rect(MARGIN, y, 4, cardHeight)
       .fill();

    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(12)
       .text('PATIENT INFORMATION', MARGIN + 15, y + 15);

    const detailsY = y + 35;
    doc.fillColor(COLORS.TEXT_PRIMARY)
       .font(FONTS.BODY_BOLD)
       .fontSize(10)
       .text('Name:', MARGIN + 15, detailsY);
    
    doc.font(FONTS.BODY)
       .text(`${userData.firstName} ${userData.lastName}`, MARGIN + 70, detailsY);

    doc.font(FONTS.BODY_BOLD)
       .text('Email:', MARGIN + 15, detailsY + 15);
    
    doc.font(FONTS.BODY)
       .text(userData.email || 'N/A', MARGIN + 70, detailsY + 15);

    return y + cardHeight;
  }

  drawMetricsDashboard(doc, y, adherenceData) {
    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(14)
       .text('Clinical Summary', MARGIN, y);

    y += 25;

    const metrics = [
      { label: 'Adherence Rate', value: adherenceData.rate, color: this.getAdherenceColor(adherenceData.rate) },
      { label: 'Total Doses', value: adherenceData.total, color: COLORS.PRIMARY },
      { label: 'Doses Taken', value: adherenceData.total - adherenceData.missed, color: COLORS.SUCCESS },
      { label: 'Doses Missed', value: adherenceData.missed, color: COLORS.DANGER }
    ];

    const cardWidth = 120;
    const cardHeight = 75;
    const spacing = 15;
    const startX = MARGIN;

    metrics.forEach((metric, i) => {
      const x = startX + (i % 4) * (cardWidth + spacing);
      const cardY = y + (Math.floor(i / 4) * (cardHeight + spacing));

      if (cardY + cardHeight > doc.page.height - MARGIN) return;

      doc.fillColor(COLORS.WHITE)
         .rect(x, cardY, cardWidth, cardHeight)
         .fill();

      doc.strokeColor(COLORS.BORDER)
         .lineWidth(1)
         .rect(x, cardY, cardWidth, cardHeight)
         .stroke();

      doc.fillColor(metric.color)
         .rect(x, cardY, cardWidth, 3)
         .fill();

      doc.fillColor(metric.color)
         .font(FONTS.HEADING)
         .fontSize(22)
         .text(String(metric.value), x, cardY + 20, { 
           width: cardWidth, 
           align: 'center' 
         });

      doc.fillColor(COLORS.TEXT_SECONDARY)
         .font(FONTS.BODY)
         .fontSize(9)
         .text(metric.label, x, cardY + 50, { 
           width: cardWidth, 
           align: 'center' 
         });
    });

    return y + cardHeight + 10;
  }

  drawVisualization(doc, y, adherenceData) {
    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(14)
       .text('Adherence Visualization', MARGIN, y);

    y += 25;

    const rate = parseInt(adherenceData.rate) || 0;
    const color = this.getAdherenceColor(rate);

    const barWidth = doc.page.width - (MARGIN * 2) - 50;
    const barHeight = 24;
    const barX = MARGIN;

    doc.fillColor(COLORS.BACKGROUND)
       .rect(barX, y, barWidth, barHeight)
       .fill();

    doc.strokeColor(COLORS.BORDER)
       .lineWidth(1)
       .rect(barX, y, barWidth, barHeight)
       .stroke();

    const fillWidth = ((rate / 100) * barWidth) || 0;
    if (fillWidth > 0) {
      doc.fillColor(color)
         .rect(barX, y, fillWidth, barHeight)
         .fill();
    }

    doc.fillColor(COLORS.WHITE)
       .font(FONTS.BODY_BOLD)
       .fontSize(11)
       .text(`${rate}%`, barX + fillWidth - 35, y + 7);

    doc.fillColor(COLORS.TEXT_SECONDARY)
       .font(FONTS.BODY)
       .fontSize(9)
       .text('Overall Adherence Performance', doc.page.width - 150, y + 7);

    return y + barHeight + 20;
  }

  drawStatsSection(doc, y, adherenceData) {
    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(14)
       .text('Detailed Statistics', MARGIN, y);

    y += 25;

    const stats = [
      ['Report Period', `${adherenceData.startDate} to ${adherenceData.endDate}`],
      ['Adherence Rate', adherenceData.rate],
      ['Total Scheduled Doses', adherenceData.total],
      ['Successfully Taken', adherenceData.total - adherenceData.missed],
      ['Missed Doses', adherenceData.missed]
    ];

    const rowHeight = 32;

    stats.forEach((stat, i) => {
      const rowY = y + (i * rowHeight);

      if (i % 2 === 0) {
        doc.fillColor(COLORS.BACKGROUND)
           .rect(MARGIN, rowY, doc.page.width - (MARGIN * 2), rowHeight)
           .fill();
      }

      doc.fillColor(COLORS.TEXT_SECONDARY)
         .font(FONTS.BODY)
         .fontSize(10)
         .text(stat[0], MARGIN + 10, rowY + 10);

      doc.fillColor(COLORS.TEXT_PRIMARY)
         .font(FONTS.BODY_BOLD)
         .fontSize(10)
         .text(String(stat[1]), MARGIN + 220, rowY + 10);

      doc.strokeColor(COLORS.BORDER)
         .lineWidth(0.5)
         .moveTo(MARGIN, rowY + rowHeight)
         .lineTo(doc.page.width - MARGIN, rowY + rowHeight)
         .stroke();
    });

    return y + (stats.length * rowHeight) + 10;
  }

  drawMedicationSection(doc, y, history) {
    const rowHeight = 28;
    
    // Check space for Title + Header + at least 1 row
    y = this.checkPageBreak(doc, y, 60 + rowHeight);

    doc.fillColor(COLORS.PRIMARY)
       .font(FONTS.HEADING)
       .fontSize(14)
       .text('Medication History', MARGIN, y);

    y += 25;

    // Helper to draw headers (called initially and on new pages)
    const drawHeaders = (d, currentY) => {
      const headers = ['Date & Time', 'Medication', 'Status', 'Notes'];
      const colWidths = [110, 140, 70, 135];
      const startX = MARGIN;

      d.fillColor(COLORS.PRIMARY)
         .rect(startX, currentY, d.page.width - (MARGIN * 2), rowHeight)
         .fill();

      let x = startX + 8;
      headers.forEach((header, i) => {
        d.fillColor(COLORS.WHITE)
           .font(FONTS.BODY_BOLD)
           .fontSize(9)
           .text(header, x, currentY + 9);
        x += colWidths[i];
      });
      
      return currentY + rowHeight; // Return next Y position
    };

    // Draw initial headers
    y = drawHeaders(doc, y);

    // Draw rows
    const colWidths = [110, 140, 70, 135];
    const startX = MARGIN;

    history.forEach((record, i) => {
      // Check page break for EACH row, passing drawHeaders as callback
      y = this.checkPageBreak(doc, y, rowHeight, drawHeaders);

      if (i % 2 === 1) {
        doc.fillColor(COLORS.BACKGROUND)
           .rect(startX, y, doc.page.width - (MARGIN * 2), rowHeight)
           .fill();
      }

      const date = new Date(record.takenAt).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      let x = startX + 8;

      doc.fillColor(COLORS.TEXT_PRIMARY)
         .font(FONTS.BODY)
         .fontSize(8)
         .text(date, x, y + 9, { width: colWidths[0] - 8 });
      x += colWidths[0];

      doc.text(record.Medication?.name || 'N/A', x, y + 9, { width: colWidths[1] - 8 });
      x += colWidths[1];

      const statusColor = record.status === 'taken' ? COLORS.SUCCESS : COLORS.DANGER;
      doc.fillColor(statusColor)
         .font(FONTS.BODY_BOLD)
         .fontSize(8)
         .text((record.status || '').toUpperCase(), x, y + 9);
      x += colWidths[2];

      doc.fillColor(COLORS.TEXT_SECONDARY)
         .font(FONTS.BODY)
         .fontSize(8)
         .text(record.notes || '-', x, y + 9, { width: colWidths[3] - 8 });

      doc.strokeColor(COLORS.BORDER)
         .lineWidth(0.5)
         .moveTo(startX, y + rowHeight)
         .lineTo(doc.page.width - MARGIN, y + rowHeight)
         .stroke();

      y += rowHeight;
    });

    return y + 10;
  }

  addGlobalElements(doc, documentId, expirationDate) {
    const range = doc.bufferedPageRange();
    const footerY = doc.page.height - 80;

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Footer Lines
      doc.strokeColor(COLORS.BORDER)
         .lineWidth(1)
         .moveTo(MARGIN, footerY)
         .lineTo(doc.page.width - MARGIN, footerY)
         .stroke();

      // Footer Text
      doc.fillColor(COLORS.TEXT_SECONDARY)
         .font(FONTS.BODY)
         .fontSize(8)
         .text('CONFIDENTIAL MEDICAL DOCUMENT', MARGIN, footerY + 15);

      doc.text(`Document ID: ${documentId}`, MARGIN, footerY + 28);
      doc.text(`Valid Until: ${expirationDate.toLocaleDateString()}`, MARGIN, footerY + 40);

      // Center Disclaimer
      doc.text(
        'This document contains protected health information. Unauthorized access or distribution is prohibited.',
        MARGIN,
        footerY + 52,
        { width: doc.page.width - (MARGIN * 2), align: 'center' }
      );

      // Contact
      doc.fillColor(COLORS.PRIMARY)
         .text('support@caresync.com | +1 (555) 123-4567', 0, footerY + 28, {
           width: doc.page.width - MARGIN,
           align: 'right'
         });

      // Page Numbers
      doc.fillColor(COLORS.TEXT_SECONDARY)
         .font(FONTS.BODY)
         .fontSize(8)
         .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 30, {
           width: doc.page.width - MARGIN,
           align: 'right'
         });
    }
  }

  async addPasswordProtection(pdfBuffer) {
    const pdfDoc = await PDFLib.load(pdfBuffer);
    pdfDoc.setOwnerPassword(process.env.PDF_OWNER_PASSWORD || 'admin');
    pdfDoc.setUserPassword(process.env.PDF_USER_PASSWORD || 'patient');
    return Buffer.from(await pdfDoc.save());
  }

  getAdherenceColor(rate) {
    const n = parseInt(rate);
    if (isNaN(n)) return COLORS.DANGER;
    if (n >= 90) return COLORS.SUCCESS;
    if (n >= 70) return COLORS.WARNING;
    return COLORS.DANGER;
  }
}

module.exports = new EnhancedPdfService();
