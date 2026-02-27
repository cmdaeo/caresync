const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class PemParserService {
  /**
   * Parses raw QR code data from Portuguese Prescriptions (Receita Sem Papel).
   * Usually follows formats like: A:<code>/O:<option>/V:<version>
   * or a simple URL string.
   */
  parse(rawData) {
    logger.info(`Parsing PEM data of length: ${rawData.length}`);

    // Scenario 1: Raw text format (Simulated standard)
    const accessCodeMatch = rawData.match(/A:([0-9]+)/);
    const optionMatch = rawData.match(/O:([0-9]+)/);
    
    // Scenario 2: URL format (e.g., https://sns.gov.pt/rx/...)
    const urlMatch = rawData.match(/rx\/([0-9]+)-([0-9]+)/);

    let prescriptionId = null;
    let accessCode = null;

    if (accessCodeMatch && optionMatch) {
      prescriptionId = optionMatch[1]; // Often the 'Option' acts as an ID in some formats
      accessCode = accessCodeMatch[1];
    } else if (urlMatch) {
      prescriptionId = urlMatch[1];
      accessCode = urlMatch[2];
    } else {
      // Fallback for simple numeric codes
      if (/^\d+$/.test(rawData) && rawData.length > 10) {
        prescriptionId = rawData.substring(0, 10);
        accessCode = rawData.substring(10);
      }
    }

    if (!prescriptionId || !accessCode) {
      throw new AppError('Invalid or unrecognized PEM QR format', 400);
    }

    return {
      prescriptionId,
      accessCode,
      scannedAt: new Date(),
      source: 'QR_SCAN',
      confidence: 1.0
    };
  }

  /**
   * MOCK: Since we cannot hit the real SNS API without certificates,
   * we simulate fetching the drug details based on the codes.
   */
  async fetchMedicationDetails(prescriptionId, accessCode) {
    // In production, this would make an HTTPS request to SPMS API
    // utilizing the client certificate.
    
    // Simulating lookup delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Deterministic mock based on ID
    const isAntibiotic = prescriptionId.endsWith('1');
    
    return {
      name: isAntibiotic ? 'Amoxicilina' : 'Paracetamol',
      dosage: isAntibiotic ? '1000' : '500',
      dosageUnit: 'mg',
      frequency: isAntibiotic ? 'Every 12 hours' : 'As needed',
      instructions: 'Ingerir após as refeições. Não exceder a dose recomendada.',
      prescriber: 'Dr. Silva (SNS)',
      region: 'ARS Norte'
    };
  }
}

module.exports = new PemParserService();