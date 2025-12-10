const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

const SNS_PARSER_URL = process.env.SNS_PARSER_URL || 'http://127.0.0.1:8000/parse';

class SnsController {
  async parsePdf(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PDF file is required (field: file)' });
    }

    try {
      const formData = new FormData();
      formData.append('file', req.file.buffer, {
        filename: req.file.originalname || 'prescription.pdf',
        contentType: req.file.mimetype || 'application/pdf',
      });

      const response = await axios.post(SNS_PARSER_URL, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 20_000,
      });

      return res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('SNS parse proxy failed', error);
      const status = error.response?.status || 502;
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to parse PDF';
      return res.status(status).json({ success: false, message });
    }
  }
}

module.exports = new SnsController();
