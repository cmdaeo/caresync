const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path'); // <--- Import path

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareSync API Documentation',
      version: '1.0.0',
      description: 'API documentation for the CareSync health/caregiving application',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
