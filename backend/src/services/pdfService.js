const PDFDocument = require('pdfkit');

const generateReport = (userData, adherenceData, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header
      doc.fontSize(20).text('CareSync Adherence Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Patient: ${userData.firstName} ${userData.lastName}`);
      doc.text(`Period: ${startDate} to ${endDate}`);
      doc.moveDown(2);

      // Stats
      doc.fontSize(16).text('Summary');
      doc.fontSize(12).text(`Adherence Rate: ${adherenceData.rate}%`);
      doc.text(`Total Doses: ${adherenceData.total}`);
      doc.text(`Missed Doses: ${adherenceData.missed}`);
      doc.moveDown(2);

      // List
      doc.fontSize(16).text('Detailed History');
      adherenceData.history.forEach(record => {
        const date = new Date(record.takenAt).toLocaleString();
        const status = record.status.toUpperCase();
        doc.fontSize(10).text(`${date} - ${record.Medication?.name || 'Medication'} - ${status}`);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateReport };
