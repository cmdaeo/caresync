// backend/src/routes/api-docs.js
const express = require('express');
const router = express.Router();
const apiDocGenerator = require('../services/apiDocGenerator');

/**
 * Development-only endpoint to generate API documentation
 * This creates a static JSON file in the frontend for showcase purposes
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/generate', async (req, res) => {
    try {
      const result = await apiDocGenerator.writeToFrontend();
      
      res.json({
        success: true,
        message: 'API documentation generated and saved to frontend',
        data: result
      });
    } catch (error) {
      console.error('Error generating API docs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate API documentation',
        error: error.message
      });
    }
  });

  console.log('📚 API Documentation generator available at POST /api/api-docs/generate (Development only)');
} else {
  // In production, return 404
  router.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'API documentation generator is only available in development mode'
    });
  });
}

module.exports = router;
