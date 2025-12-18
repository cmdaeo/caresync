const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { PDFDocument: PDFLib } = require('pdf-lib');
const { DocumentMetadata } = require('../models');
const fs = require('fs');
const path = require('path');

// Color scheme constants
const COLORS = {
  PRIMARY: '#2E86C1',
  SECONDARY: '#1A5276', 
  ACCENT: '#5DADE2',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  LIGHT_GRAY: '#F8F9FA',
  DARK_GRAY: '#6c757d'
};

// Font configuration
const FONTS = {
  HEADING: 'Helvetica-Bold',
  SUBHEADING: 'Helvetica',
  BODY: 'Helvetica',
  MONOSPACE: 'Courier'
};

class EnhancedPdfService {
  constructor() {
    // Load logo if available
    this.logoPath = path.join(__dirname, '../assets/logo.png');
    this.logoExists = fs.existsSync(this.logoPath);
  }

  /**
   * Generate enhanced PDF report with all professional features
   */
  async generateEnhancedReport(userData, adherenceData, startDate, endDate, options = {}) {
    const {
      includeCharts = false,
      passwordProtect = false,
      signatureRequired = false
    } = options;

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 72, bottom: 72, left: 72, right: 72 },
          bufferPages: true,
          autoFirstPage: false
        });

        const buffers = [];
doc.on('data', buffers.push.bind(buffers));
doc.on('end', async () => {
  const pdfData = Buffer.concat(buffers);
  
  // Apply password protection if requested
  let finalPdfData = pdfData;
  if (passwordProtect) {
    finalPdfData = await this.addPasswordProtection(pdfData);
  }
  
  resolve(finalPdfData);
});

// Generate document ID and metadata
doc.on('pageAdded', () => {
  this.addWatermark(doc);
});

const documentId = crypto.randomUUID();
const generationTimestamp = new Date();
const expirationDate = new Date();
expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year validity

// Start document
doc.addPage();

// Add header
doc.font(FONTS.HEADING);
doc.fontSize(8);

// Left: Logo
if (this.logoExists) {
  doc.image(this.logoPath, 72, 72, { width: 100, align: 'left' });
} else {
  doc.text('CareSync', 72, 72, { align: 'left' });
}

// Center: Document title
doc.fontSize(24).font(FONTS.HEADING);
doc.text('PATIENT ADHERENCE REPORT', {
  align: 'center',
  underline: true
});

// Right: Generation timestamp
doc.fontSize(10).font(FONTS.BODY);
doc.text(`Generated: ${generationTimestamp.toLocaleString()}`, {
  align: 'right'
});

doc.moveDown(2);

// Add QR code for verification
const qrCodeDataUrl = await QRCode.toDataURL(
  `${process.env.BASE_URL || 'https://caresync.com'}/api/verify?docId=${documentId}`
);
const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
doc.image(qrCodeBuffer, doc.page.width - 150, 72, { width: 80 });

doc.moveDown(3);

// Patient demographic section
doc.fontSize(18).font(FONTS.HEADING).text('Patient Information', { underline: true });
doc.moveDown(0.5);

// Patient info table
doc.fontSize(12).font(FONTS.BODY);
this.drawInfoTable(doc, [
  ['Name', `${userData.firstName} ${userData.lastName}`],
  ['Email', userData.email || 'N/A'],
  ['Age', this.calculateAge(userData.dateOfBirth) || 'N/A'],
  ['Gender', userData.gender || 'N/A'],
  ['Primary Condition', userData.primaryCondition || 'N/A']
]);

doc.moveDown(2);

// Clinical summary section
doc.fontSize(18).font(FONTS.HEADING).text('Clinical Summary', { underline: true });
doc.moveDown(0.5);

// Key metrics
doc.fontSize(12).font(FONTS.BODY);
this.drawKeyMetrics(doc, adherenceData);

doc.moveDown(2);

// Adherence statistics section
doc.fontSize(18).font(FONTS.HEADING).text('Adherence Statistics', { underline: true });
doc.moveDown(0.5);

// Adherence rate visualization
if (includeCharts) {
  this.drawAdherenceVisualization(doc, adherenceData);
  doc.moveDown(2);
}

// Detailed statistics
doc.fontSize(12).font(FONTS.BODY);
this.drawStatsTable(doc, adherenceData);

doc.moveDown(2);

// Medication history section
doc.fontSize(18).font(FONTS.HEADING).text('Medication History', { underline: true });
doc.moveDown(0.5);

// Structured medication table
this.drawMedicationTable(doc, adherenceData.history);

doc.moveDown(2);

// Disclaimer section
doc.fontSize(10).font(FONTS.BODY);
this.addDisclaimer(doc);

// Add footer
doc.fontSize(8);
doc.text(`Document ID: ${documentId}`, 72, doc.page.height - 50, { align: 'left' });
doc.text(`Valid until: ${expirationDate.toLocaleDateString()}`, 72, doc.page.height - 40, { align: 'left' });
doc.text(`Page 1 of ${doc.bufferedPageRange().count}`, 0, doc.page.height - 40, { align: 'center' });
doc.text('CONFIDENTIAL - For authorized healthcare professionals only', 0, doc.page.height - 30, { align: 'center' });

// Store document metadata
const metadata = {
  documentId,
  userId: userData.id,
  documentType: 'ADHERENCE_REPORT',
  documentHash: crypto.createHash('sha256').update(pdfData).digest('hex'),
  fileName: `CareSync_Adherence_Report_${startDate}_to_${endDate}.pdf`,
  fileSize: pdfData.length,
  generationTimestamp,
  expirationDate,
  passwordProtected,
  signatureRequired,
  includeCharts,
  metadata: {
    userId: userData.id,
    reportPeriod: { startDate, endDate },
    adherenceRate: adherenceData.rate
  }
};

// Save metadata to database
try {
  await DocumentMetadata.create(metadata);
} catch (error) {
  console.error('Failed to save document metadata:', error);
}

doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add password protection to PDF
   */
  async addPasswordProtection(pdfBuffer) {
    const pdfDoc = await PDFLib.load(pdfBuffer);
    
    // Set password (in production, use environment variables)
    const ownerPassword = process.env.PDF_OWNER_PASSWORD || 'caresync-admin-2024';
    const userPassword = process.env.PDF_USER_PASSWORD || 'patient-view-2024';
    
    pdfDoc.setOwnerPassword(ownerPassword);
    pdfDoc.setUserPassword(userPassword);
    
    const protectedPdfBytes = await pdfDoc.save();
    return Buffer.from(protectedPdfBytes);
  }

  /**
   * Add watermark to all pages
   */
  addWatermark(doc) {
    doc.save();
    doc.rotate(45);
    doc.fontSize(40);
    doc.font(FONTS.HEADING);
    doc.fillColor('gray', 0.3); // 30% opacity
    doc.text('CONFIDENTIAL - PATIENT RECORD', 
      doc.page.width / 2 - 200, 
      doc.page.height / 2 - 50,
      { align: 'center', oblique: true }
    );
    doc.restore();
  }

  /**
   * Draw patient info table
   */
  drawInfoTable(doc, rows) {
    const tableTop = doc.y;
    const rowHeight = 25;
    const colWidth = 200;
    
    // Table headers
    doc.fillColor(COLORS.PRIMARY);
    doc.rect(doc.x, tableTop, colWidth, rowHeight).fill();
    doc.fillColor('white');
    doc.text('Attribute', doc.x + 10, tableTop + 10);
    doc.text('Value', doc.x + colWidth + 10, tableTop + 10);
    
    // Table rows
    doc.fillColor('black');
    rows.forEach((row, i) => {
      const y = tableTop + rowHeight * (i + 1);
      const fillColor = i % 2 === 0 ? COLORS.LIGHT_GRAY : 'white';
      
      doc.fillColor(fillColor);
      doc.rect(doc.x, y, doc.page.width - 144, rowHeight).fill();
      doc.fillColor('black');
      
      doc.text(row[0], doc.x + 10, y + 10);
      doc.text(row[1], doc.x + colWidth + 10, y + 10);
    });
    
    doc.moveDown(rows.length + 2);
  }

  /**
   * Draw key metrics boxes
   */
  drawKeyMetrics(doc, adherenceData) {
    const metrics = [
      { label: 'Adherence Rate', value: adherenceData.rate, color: this.getAdherenceColor(adherenceData.rate) },
      { label: 'Total Doses', value: adherenceData.total, color: COLORS.PRIMARY },
      { label: 'Missed Doses', value: adherenceData.missed, color: COLORS.DANGER },
      { label: 'On-Time Doses', value: adherenceData.total - adherenceData.missed, color: COLORS.SUCCESS }
    ];
    
    const boxWidth = 150;
    const boxHeight = 80;
    const spacing = 20;
    
    metrics.forEach((metric, i) => {
      const x = 72 + (i % 2) * (boxWidth + spacing);
      const y = doc.y + (Math.floor(i / 2) * (boxHeight + spacing));
      
      // Draw box
      doc.fillColor(metric.color);
      doc.rect(x, y, boxWidth, boxHeight).fill();
      doc.fillColor('white');
      
      // Metric value
      doc.fontSize(24).font(FONTS.HEADING);
      doc.text(metric.value, x + boxWidth / 2, y + 30, { align: 'center' });
      
      // Metric label
      doc.fontSize(10).font(FONTS.BODY);
      doc.text(metric.label, x + boxWidth / 2, y + 55, { align: 'center' });
    });
    
    doc.moveDown(metrics.length / 2 + 2);
  }

  /**
   * Draw adherence visualization
   */
  drawAdherenceVisualization(doc, adherenceData) {
    const rate = parseInt(adherenceData.rate);
    const color = this.getAdherenceColor(rate);
    
    // Progress bar
    doc.fontSize(12).text('Adherence Progress:', { continued: true });
    doc.text(` ${rate}%`, { align: 'right' });
    
    // Draw progress bar background
    const barWidth = 300;
    const barHeight = 20;
    doc.fillColor('#e9ecef');
    doc.rect(doc.x, doc.y, barWidth, barHeight).fill();
    
    // Draw progress bar fill
    const fillWidth = (rate / 100) * barWidth;
    doc.fillColor(color);
    doc.rect(doc.x, doc.y, fillWidth, barHeight).fill();
    
    doc.moveDown(2);
    
    // Donut chart (simplified representation)
    doc.fontSize(12).text('Overall Adherence:', { continued: true });
    doc.text(` ${rate}%`, { align: 'right' });
    
    // Draw donut chart
    const centerX = doc.x + 150;
    const centerY = doc.y + 30;
    const radius = 50;
    
    // Background circle
    doc.fillColor('#e9ecef');
    doc.circle(centerX, centerY, radius).fill();
    
    // Filled arc
    doc.fillColor(color);
    doc.moveTo(centerX, centerY);
    doc.arc(centerX, centerY, radius, 0, (rate / 100) * 2 * Math.PI).fill();
    
    // Center text
    doc.fillColor('black');
    doc.fontSize(14).font(FONTS.HEADING);
    doc.text(`${rate}%`, centerX, centerY - 5, { align: 'center' });
    
    doc.moveDown(3);
  }

  /**
   * Draw statistics table
   */
  drawStatsTable(doc, adherenceData) {
    const stats = [
      ['Adherence Rate', adherenceData.rate],
      ['Total Doses', adherenceData.total],
      ['Missed Doses', adherenceData.missed],
      ['On-Time Doses', adherenceData.total - adherenceData.missed],
      ['Report Period', `${adherenceData.startDate} to ${adherenceData.endDate}`]
    ];
    
    const tableTop = doc.y;
    const rowHeight = 20;
    
    stats.forEach((stat, i) => {
      const y = tableTop + rowHeight * i;
      const fillColor = i % 2 === 0 ? COLORS.LIGHT_GRAY : 'white';
      
      doc.fillColor(fillColor);
      doc.rect(doc.x, y, doc.page.width - 144, rowHeight).fill();
      doc.fillColor('black');
      
      doc.fontSize(12).font(FONTS.BODY);
      doc.text(stat[0], doc.x + 10, y + 5, { width: 200 });
      doc.text(stat[1].toString(), doc.x + 220, y + 5);
    });
    
    doc.moveDown(stats.length + 1);
  }

  /**
   * Draw medication history table
   */
  drawMedicationTable(doc, history) {
    // Table headers
    const headers = ['Date/Time', 'Medication', 'Status', 'Notes'];
    const colWidths = [120, 150, 80, 150];
    const rowHeight = 25;
    
    // Draw headers
    doc.fillColor(COLORS.PRIMARY);
    doc.rect(doc.x, doc.y, doc.page.width - 144, rowHeight).fill();
    doc.fillColor('white');
    
    headers.forEach((header, i) => {
      doc.text(header, doc.x + 10 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), doc.y + 5);
    });
    
    // Draw rows
    doc.fillColor('black');
    history.forEach((record, rowIndex) => {
      const y = doc.y + rowHeight * (rowIndex + 1);
      const fillColor = rowIndex % 2 === 0 ? COLORS.LIGHT_GRAY : 'white';
      
      doc.fillColor(fillColor);
      doc.rect(doc.x, y, doc.page.width - 144, rowHeight).fill();
      doc.fillColor('black');
      
      // Date/Time
      const date = new Date(record.takenAt).toLocaleString();
      doc.fontSize(10).text(date, doc.x + 10, y + 5, { width: colWidths[0] });
      
      // Medication
      doc.text(record.Medication?.name || 'N/A', doc.x + 10 + colWidths[0], y + 5, { width: colWidths[1] });
      
      // Status
      const statusColor = record.status === 'taken' ? COLORS.SUCCESS : COLORS.DANGER;
      doc.fillColor(statusColor);
      doc.text(record.status.toUpperCase(), doc.x + 10 + colWidths[0] + colWidths[1], y + 5, { width: colWidths[2] });
      doc.fillColor('black');
      
      // Notes
      doc.text(record.notes || '-', doc.x + 10 + colWidths[0] + colWidths[1] + colWidths[2], y + 5, { width: colWidths[3] });
    });
    
    doc.moveDown(history.length + 2);
  }

  /**
   * Add disclaimer section
   */
  addDisclaimer(doc) {
    doc.fontSize(10).font(FONTS.BODY);
    doc.text('DISCLAIMER:', { underline: true });
    doc.moveDown(0.3);
    doc.text('This document contains confidential patient information and is intended solely for authorized healthcare professionals.');
    doc.text('Unauthorized access, distribution, or use is strictly prohibited by law.');
    doc.moveDown(0.3);
    doc.text('For questions or verification, contact: support@caresync.com | +1 (555) 123-4567');
    doc.text('Document Version: 2.1 | Effective Date: 2024-01-15');
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge(dob) {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get adherence color based on rate
   */
  getAdherenceColor(rate) {
    const numericRate = parseInt(rate);
    if (numericRate >= 90) return COLORS.SUCCESS;
    if (numericRate >= 70) return COLORS.WARNING;
    return COLORS.DANGER;
  }

  /**
   * Generate verification QR code
   */
  async generateVerificationQR(documentId) {
    return await QRCode.toDataURL(
      `${process.env.BASE_URL || 'https://caresync.com'}/api/verify?docId=${documentId}`
    );
  }
}

module.exports = new EnhancedPdfService();