const PHI_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  dateOfBirth: /\b((0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[-/](19|20)\d{2}|(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01]))\b/g,
  patientName: /(Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.|Patient)\s+[A-Z][a-zA-Z]+/g,
  prescriptionId: /(Rx|Prescription|RX)\s*#?\s*\d{6,}/g,
  medicalRecordNumber: /\b(MRN|MR|MedicalRecord)\s*#?\s*\d{5,}\b/g
};

const SCRUBBED_VALUE = '[SCRUBBED]';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return email;
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  const maskedUsername = username.length > 2 ? 
    username[0] + '*'.repeat(username.length - 2) + username[username.length - 1] :
    username;
  return `${maskedUsername}@${domain}`;
}

function scrubPHI(input) {
  if (typeof input === 'string') {
    let result = input;
    for (const [type, pattern] of Object.entries(PHI_PATTERNS)) {
      result = result.replace(pattern, SCRUBBED_VALUE);
    }
    return result;
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(scrubPHI);
    } else {
      const scrubbedObj = {};
      for (const [key, value] of Object.entries(input)) {
        scrubbedObj[key] = scrubPHI(value);
      }
      return scrubbedObj;
    }
  }
  return input;
}

module.exports = {
  PHI_PATTERNS,
  SCRUBBED_VALUE,
  scrubPHI,
  maskEmail
};
