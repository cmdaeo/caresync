const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path'); // <--- Import path

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareSync API Documentation',
      version: '1.0.0',
      description: 'API documentation for the CareSync health/caregiving application. ' +
        'All endpoints require authentication via Bearer JWT token unless otherwise noted. ' +
        'CSRF tokens are required for all mutating (POST/PUT/PATCH/DELETE) requests.',
      contact: {
        name: 'CareSync Development Team',
        email: 'dev@caresync.com',
      },
    },
    servers: [
      {
        url: process.env.CLIENT_URL ? `${process.env.CLIENT_URL.replace(/\/$/, '')}` : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Developer API key for external integrations',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // FIX: Use path.join to make it absolute and fool-proof
  apis: [
    path.join(__dirname, './routes/*.js'), 
    path.join(__dirname, './controllers/*.js')
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };
