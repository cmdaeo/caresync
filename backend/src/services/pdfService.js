const pdfParse = require('pdf-parse');
// 1. Destructure the import to get the 'fromPath' function
const { fromPath } = require('pdf2pic');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class PDFService {
  constructor() {
    // 2. Store the options in the constructor to be reused later
    this.conversion_options = {
      density: 100,
      saveFilename: "untitled",
      savePath: path.join(__dirname, '../../uploads/temp'),
      format: "png",
      width: 600,
      height: 600
    };
  }

  /**
   * Extract text content from PDF prescription
   * @param {string} pdfPath - Path to the PDF file
   * @returns {Object} Extracted medication data
   */
  async extractPrescriptionData(pdfPath) {
    try {
      logger.info(`Processing PDF prescription: ${pdfPath}`);
      
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text.toLowerCase();

      const medications = this.extractMedications(text);
      const patientInfo = this.extractPatientInfo(text);
      const doctorInfo = this.extractDoctorInfo(text);

      logger.info(`Successfully extracted data from PDF: ${medications.length} medications found`);

      return {
        medications,
        patient: patientInfo,
        doctor: doctorInfo,
        extractedAt: new Date(),
        rawText: text
      };

    } catch (error) {
      logger.error('Error extracting prescription data:', error);
      throw new Error('Failed to process PDF prescription');
    }
  }

  /**
   * Extract medication information from text
   * @param {string} text - Extracted text from PDF
   * @returns {Array} Array of medication objects
   */
  extractMedications(text) {
    const medications = [];
    
    // Common medication patterns
    const medicationPatterns = [
      // Pattern 1: "Medication name X mg/Y times daily"
      /([a-zA-Z\s]+)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units)\s*\/?\s*(\d+(?:\.\d+)?)?\s*(times?|times\s+per\s+day|daily|bid|tid|qid)/gi,
      
      // Pattern 2: "X units of Medication name every Y hours"
      /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units)\s*of\s+([a-zA-Z\s]+)\s+every\s+(\d+)\s*hours?/gi,
      
      // Pattern 3: "Take X tablets/capsules of Medication name"
      /(take|take\s+the)\s+(\d+)\s*(tablets?|capsules?|pills?)\s*of\s+([a-zA-Z\s]+)/gi,
      
      // Pattern 4: "Medication name - X mg - Y times per day"
      /([a-zA-Z\s]+)\s*-\s*(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml)\s*-\s*(\d+)\s*(times?|times\s+per\s+day|daily)/gi
    ];

    const medicationKeywords = [
      'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'omeprazole',
      'metformin', 'lisinopril', 'amlodipine', 'atorvastatin', 'simvastatin',
      'sertraline', 'fluoxetine', 'escitalopram', 'levothyroxine', 'losartan'
    ];

    // Try patterns first
    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const medication = this.parseMedicationMatch(match);
        if (medication && this.isValidMedication(medication, medicationKeywords)) {
          medications.push(medication);
        }
      }
    });

    // If no medications found with patterns, try keyword-based extraction
    if (medications.length === 0) {
      const keywordMedications = this.extractByKeywords(text, medicationKeywords);
      medications.push(...keywordMedications);
    }

    return this.deduplicateMedications(medications);
  }

  /**
   * Parse medication match from regex pattern
   * @param {Array} match - Regex match result
   * @returns {Object} Medication object
   */
  parseMedicationMatch(match) {
    try {
      const fullMatch = match[0].toLowerCase();
      
      // Extract name (usually the first meaningful word(s))
      let name = '';
      let dosage = '';
      let frequency = '';
      let form = 'tablet'; // default

      // Identify medication name based on pattern
      if (fullMatch.includes('mg') || fullMatch.includes('mcg') || fullMatch.includes('g')) {
        // Pattern with dosage
        const parts = fullMatch.split(/\s+/);
        const mgIndex = parts.findIndex(part => part.includes('mg') || part.includes('mcg') || part.includes('g'));
        if (mgIndex > 0) {
          name = parts.slice(0, mgIndex).join(' ').trim();
          dosage = parts[mgIndex];
        }
      } else {
        // Pattern with tablets/capsules
        const parts = fullMatch.split(/\s+/);
        const tabletIndex = parts.findIndex(part => 
          part.includes('tablet') || part.includes('capsule') || part.includes('pill')
        );
        if (tabletIndex > 0) {
          name = parts.slice(tabletIndex + 1).join(' ').trim();
          dosage = parts[tabletIndex - 2]; // number before tablet
          form = parts[tabletIndex - 1];
        }
      }

      // Extract frequency
      const frequencyPatterns = {
        'daily': 'once daily',
        'bid': 'twice daily',
        'tid': 'three times daily',
        'qid': 'four times daily',
        'every 8 hours': 'every 8 hours',
        'every 12 hours': 'every 12 hours',
        'every 24 hours': 'once daily'
      };

      for (const [pattern, frequencyText] of Object.entries(frequencyPatterns)) {
        if (fullMatch.includes(pattern)) {
          frequency = frequencyText;
          break;
        }
      }

      // Clean up medication name
      name = this.cleanMedicationName(name);

      if (!name || !dosage) {
        return null;
      }

      return {
        name: this.capitalizeWords(name),
        dosage: dosage.replace(/[^0-9.]/g, '') + dosage.replace(/[0-9.]/g, ''),
        frequency: frequency || 'as directed',
        form: form.replace(/s$/, ''), // remove plural
        instructions: this.generateInstructions(name, dosage, frequency)
      };

    } catch (error) {
      logger.error('Error parsing medication match:', error);
      return null;
    }
  }

  /**
   * Extract medications using keywords when patterns fail
   * @param {string} text - PDF text
   * @param {Array} keywords - Known medication keywords
   * @returns {Array} Array of medication objects
   */
  extractByKeywords(text, keywords) {
    const medications = [];
    
    keywords.forEach(keyword => {
      const pattern = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(pattern);
      
      if (matches) {
        medications.push({
          name: this.capitalizeWords(keyword),
          dosage: 'as directed',
          frequency: 'once daily',
          form: 'tablet',
          instructions: `Take as prescribed by your doctor`
        });
      }
    });

    return medications;
  }

  /**
   * Clean medication name by removing common prefixes/suffixes
   * @param {string} name - Raw medication name
   * @returns {string} Cleaned medication name
   */
  cleanMedicationName(name) {
    return name
      .replace(/^(take|take the|of|the|medication|tablet|capsule)\s+/gi, '')
      .replace(/\s+(tablet|capsule|pill|mg|mcg|g)\b/gi, '')
      .replace(/\d+/g, '')
      .trim();
  }

  /**
   * Capitalize words in medication name
   * @param {string} text - Text to capitalize
   * @returns {string} Capitalized text
   */
  capitalizeWords(text) {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  /**
   * Generate instructions based on medication details
   * @param {string} name - Medication name
   * @param {string} dosage - Dosage amount
   * @param {string} frequency - Frequency
   * @returns {string} Instructions
   */
  generateInstructions(name, dosage, frequency) {
    if (frequency.includes('daily')) {
      return `Take ${dosage} of ${name} ${frequency}`;
    } else if (frequency.includes('every')) {
      return `Take ${dosage} of ${name} ${frequency}`;
    }
    return `Take ${dosage} of ${name} ${frequency}`;
  }

  /**
   * Check if extracted medication is valid
   * @param {Object} medication - Medication object
   * @param {Array} knownMedications - Known medication names
   * @returns {boolean} Is valid medication
   */
  isValidMedication(medication, knownMedications) {
    if (!medication.name || medication.name.length < 2) {
      return false;
    }

    // Check if name contains known medication keywords
    const nameLower = medication.name.toLowerCase();
    return knownMedications.some(med => nameLower.includes(med)) || 
           nameLower.match(/^[a-zA-Z\s]+$/); // contains only letters and spaces
  }

  /**
   * Remove duplicate medications
   * @param {Array} medications - Array of medications
   * @returns {Array} Array with duplicates removed
   */
  deduplicateMedications(medications) {
    const seen = new Set();
    return medications.filter(med => {
      const key = `${med.name.toLowerCase()}-${med.dosage}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract patient information from text
   * @param {string} text - PDF text
   * @returns {Object} Patient information
   */
  extractPatientInfo(text) {
    const patientInfo = {
      name: '',
      dateOfBirth: '',
      patientId: ''
    };

    // Patient name patterns
    const namePatterns = [
      /patient[:\s]+([a-zA-Z\s]+)/gi,
      /name[:\s]+([a-zA-Z\s]+)/gi,
      /patient\s+name[:\s]+([a-zA-Z\s]+)/gi
    ];

    for (const pattern of namePatterns) {
      const match = pattern.exec(text);
      if (match) {
        patientInfo.name = this.capitalizeWords(match[1].trim());
        break;
      }
    }

    // Date of birth patterns
    const dobPatterns = [
      /date\s+of\s+birth[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
      /dob[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi,
      /born[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/gi
    ];

    for (const pattern of dobPatterns) {
      const match = pattern.exec(text);
      if (match) {
        patientInfo.dateOfBirth = match[1];
        break;
      }
    }

    return patientInfo;
  }

  /**
   * Extract doctor information from text
   * @param {string} text - PDF text
   * @returns {Object} Doctor information
   */
  extractDoctorInfo(text) {
    const doctorInfo = {
      name: '',
      license: '',
      practice: ''
    };

    // Doctor name patterns
    const namePatterns = [
      /doctor[:\s]+([a-zA-Z\s]+)/gi,
      /physician[:\s]+([a-zA-Z\s]+)/gi,
      /dr\.?\s*([a-zA-Z\s]+)/gi
    ];

    for (const pattern of namePatterns) {
      const match = pattern.exec(text);
      if (match) {
        doctorInfo.name = this.capitalizeWords(match[1].trim());
        break;
      }
    }

    // License number patterns
    const licensePatterns = [
      /license[:\s]+([a-zA-Z0-9\-]+)/gi,
      /license\s+no[:\s]+([a-zA-Z0-9\-]+)/gi
    ];

    for (const pattern of licensePatterns) {
      const match = pattern.exec(text);
      if (match) {
        doctorInfo.license = match[1];
        break;
      }
    }

    return doctorInfo;
  }

  /**
   * Convert PDF page to image for OCR if needed
   * @param {string} pdfPath - Path to PDF
   * @param {number} pageNumber - Page number to convert
   * @returns {string} Path to generated image
   */
  async convertPageToImage(pdfPath, pageNumber = 1) {
    try {
      // 3. Use the 'fromPath' function with the path and options
      const convert = fromPath(pdfPath, this.conversion_options);
      
      // Call the returned function with the page number
      const result = await convert(pageNumber, { responseType: "image" });

      logger.info(`Page ${pageNumber} is now converted as image at ${result.path}`);
      
      // The resolved object contains the path to the new image
      return result.path;

    } catch (error) {
      logger.error('Error converting PDF page to image:', error);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   * @param {string} filePath - Path to file to delete
   */
  cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

module.exports = new PDFService();