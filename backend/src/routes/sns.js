const express = require('express');
const multer = require('multer');
const snsController = require('../controllers/snsController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/parse-pdf', upload.single('file'), (req, res) => snsController.parsePdf(req, res));

module.exports = router;
