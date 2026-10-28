// src/utils/encryption.js
const crypto = require('crypto');

const MASTER_KEY = process.env.MASTER_KEY;
const GCM_IV_LENGTH = 12;
const CBC_IV_LENGTH = 16;

if (!MASTER_KEY) {
  console.warn('[encryption] MASTER_KEY environment variable is missing. Encrypt/decrypt will fail at call time.');
}

const getKey = () => {
  if (!MASTER_KEY) {
    throw new Error('MASTER_KEY environment variable is missing - cannot encrypt/decrypt.');
  }
  return crypto.createHash('sha256').update(MASTER_KEY).digest();
};

const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decrypt = (text) => {
  if (!text) return text;

  if (typeof text === 'string' && text.startsWith('gcm:')) {
    const parts = text.split(':');
    if (parts.length !== 4) throw new Error('Malformed GCM payload');
    const [, ivHex, tagHex, ctHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ct = Buffer.from(ctHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
    return decrypted.toString('utf8');
  }

  const parts = text.split(':');
  if (parts.length < 2) return text;
  const iv = Buffer.from(parts.shift(), 'hex');
  const ct = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(ct), decipher.final()]);
  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };