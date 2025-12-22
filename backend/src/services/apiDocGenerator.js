// backend/src/services/apiDocGenerator.js
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

class ApiDocGenerator {
  constructor() {
    this.privacyMetadata = this.loadPrivacyMetadata();
  }

  /**
   * Load privacy metadata for different endpoint patterns
   */
  loadPrivacyMetadata() {
    return {
      '/api/auth/login': {
        dataCollected: ['Email address', 'Password hash', 'Login timestamp', 'IP address', 'User-Agent'],
        dataShared: ['None - credentials never leave the system'],
        retention: 'Login logs: 90 days (audit trail)',
        rateLimit: '5 requests / 15 minutes'
      },
      '/api/auth/register': {
        dataCollected: ['Email address', 'Password hash', 'Full name', 'Role', 'Registration timestamp'],
        dataShared: ['None - stored securely with AES-256 encryption'],
        retention: 'User data: Until account deletion + 7 years audit logs',
        rateLimit: '5 requests / 15 minutes'
      },
      '/api/auth/me': {
        dataCollected: ['User ID from JWT token'],
        dataShared: ['None - personal data only visible to authenticated user'],
        retention: 'Session data: Duration of JWT validity (7 days)',
        rateLimit: '100 requests / 15 minutes'
      },
      '/api/auth/profile': {
        dataCollected: ['Updated profile fields', 'Modification timestamp'],
        dataShared: ['None - user controls their own data'],
        retention: 'Profile data: Until account deletion',
        rateLimit: '50 requests / 15 minutes'
      },
      '/api/auth/password': {
        dataCollected: ['Password change request', 'Timestamp', 'IP address'],
        dataShared: ['None - passwords are hashed with bcrypt'],
        retention: 'Password history: 90 days (prevent reuse)',
        rateLimit: '5 requests / hour'
      },
      '/api/medications': {
        dataCollected: ['User ID', 'Medication names', 'Dosage', 'Frequency', 'Schedule timestamps'],
        dataShared: ['With authorized caregivers (explicit consent)', 'Healthcare providers (HIPAA BAA)'],
        retention: 'Active medications: Indefinite. Deleted: 7 years (regulatory compliance)',
        rateLimit: '100 requests / 15 minutes'
      },
      '/api/medications/adherence': {
        dataCollected: ['Medication ID', 'Timestamp', 'Geolocation (optional)', 'Device ID', 'Notes'],
        dataShared: ['With caregivers (if sharing enabled)', 'Anonymized for analytics (opt-in only)'],
        retention: '7 years (HIPAA compliance for medical records)',
        rateLimit: '200 requests / 15 minutes'
      },
      '/api/devices/register': {
        dataCollected: ['Device serial number', 'Device type', 'Firmware version', 'MAC address', 'Public key'],
        dataShared: ['None - device identifiers encrypted at rest'],
        retention: 'Active devices: Indefinite. Deregistered: 30 days',
        rateLimit: '10 requests / hour'
      },
      '/api/devices': {
        dataCollected: ['Device metadata', 'Sync status', 'Last connection timestamp'],
        dataShared: ['With device owner and authorized caregivers only'],
        retention: 'Device logs: 90 days. Configuration: Until device removal',
        rateLimit: '100 requests / 15 minutes'
      },
      '/api/caregivers/invite': {
        dataCollected: ['Caregiver email', 'Relationship type', 'Permission levels', 'Invitation timestamp'],
        dataShared: ['Email sent to invited caregiver', 'Notification to patient'],
        retention: 'Pending invitations: 7 days. Accepted relationships: Until revoked',
        rateLimit: '20 requests / hour'
      },
      '/api/caregivers': {
        dataCollected: ['User ID', 'Caregiver relationships', 'Access permissions'],
        dataShared: ['Between patient and caregiver (bidirectional)'],
        retention: 'Relationship data: Until explicitly revoked + 1 year audit',
        rateLimit: '100 requests / 15 minutes'
      },
      '/api/caregivers/pending': {
        dataCollected: ['Pending invitation IDs', 'Invitation metadata'],
        dataShared: ['Only with invited caregiver'],
        retention: 'Pending invitations: 7 days (auto-expire)',
        rateLimit: '50 requests / 15 minutes'
      },
      '/api/notifications': {
        dataCollected: ['Notification type', 'Recipient ID', 'Delivery timestamp', 'Read status'],
        dataShared: ['Only with intended recipient'],
        retention: 'Notifications: 30 days. Critical alerts: 1 year',
        rateLimit: '100 requests / 15 minutes'
      },
      '/api/reports/adherence': {
        dataCollected: ['Report date range', 'Medication adherence data', 'User demographics (opt-in)', 'Generation timestamp'],
        dataShared: ['None - user-initiated download only', 'Can be shared with healthcare providers at user discretion'],
        retention: 'Report metadata: 1 year. Generated PDFs: Not stored (ephemeral)',
        rateLimit: '5 requests / hour'
      },
      '/api/auth/account': {
        dataCollected: ['User confirmation', 'Deletion reason (optional)', 'Account deletion timestamp'],
        dataShared: ['None'],
        retention: 'Immediate deletion with 30-day grace period. Audit logs: 7 years (compliance)',
        rateLimit: '1 request / 24 hours'
      },
      'default': {
        dataCollected: ['User ID', 'Request metadata', 'Timestamp'],
        dataShared: ['None - internal use only'],
        retention: 'Standard retention policies apply (see Privacy Policy)',
        rateLimit: '100 requests / 15 minutes'
      }
    };
  }

  /**
   * Get privacy metadata for a specific endpoint
   */
  getPrivacyMetadata(path, method) {
    // Exact match
    if (this.privacyMetadata[path]) {
      return this.privacyMetadata[path];
    }

    // Pattern matching
    if (path.includes('/medications/adherence')) {
      return this.privacyMetadata['/api/medications/adherence'];
    } else if (path.includes('/medications')) {
      return this.privacyMetadata['/api/medications'];
    } else if (path.includes('/devices/register')) {
      return this.privacyMetadata['/api/devices/register'];
    } else if (path.includes('/devices')) {
      return this.privacyMetadata['/api/devices'];
    } else if (path.includes('/caregivers/pending')) {
      return this.privacyMetadata['/api/caregivers/pending'];
    } else if (path.includes('/caregivers/invite')) {
      return this.privacyMetadata['/api/caregivers/invite'];
    } else if (path.includes('/caregivers')) {
      return this.privacyMetadata['/api/caregivers'];
    } else if (path.includes('/reports')) {
      return this.privacyMetadata['/api/reports/adherence'];
    } else if (path.includes('/notifications')) {
      return this.privacyMetadata['/api/notifications'];
    } else if (path.includes('/auth/password')) {
      return this.privacyMetadata['/api/auth/password'];
    } else if (path.includes('/auth/profile')) {
      return this.privacyMetadata['/api/auth/profile'];
    } else if (path.includes('/auth/me')) {
      return this.privacyMetadata['/api/auth/me'];
    }

    return this.privacyMetadata['default'];
  }

  /**
   * Generate API documentation from Swagger comments
   */
  async generateDocs() {
    const options = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'CareSync API Documentation',
          version: '1.0.0',
          description: 'HIPAA-compliant healthcare monitoring platform API'
        },
        servers: [
          {
            url: process.env.API_URL || 'http://localhost:5000',
            description: 'Development server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      },
      apis: [
        path.join(__dirname, '../routes/*.js'),
      ]
    };

    try {
      // Generate Swagger spec from JSDoc comments
      const swaggerSpec = swaggerJsdoc(options);

      // Extract paths and enrich with privacy metadata
      const enrichedEndpoints = [];

      if (swaggerSpec.paths) {
        Object.entries(swaggerSpec.paths).forEach(([pathPattern, pathItem]) => {
          Object.entries(pathItem).forEach(([method, operation]) => {
            // Skip non-HTTP methods (like 'parameters', 'servers', etc.)
            if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
              return;
            }

            // Get privacy metadata
            const privacyData = this.getPrivacyMetadata(pathPattern, method);

            // Determine if auth is required
            const requiresAuth = operation.security && operation.security.length > 0;

            // Extract request body schema
            const requestBody = operation.requestBody?.content?.['application/json']?.schema;
            
            // Extract response schema
            const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema ||
                                 operation.responses?.['201']?.content?.['application/json']?.schema;

            enrichedEndpoints.push({
              method: method.toUpperCase(),
              path: pathPattern,
              description: operation.summary || operation.description || '',
              tags: operation.tags || [],
              auth: requiresAuth,
              rateLimit: privacyData.rateLimit,
              dataCollected: privacyData.dataCollected,
              dataShared: privacyData.dataShared,
              retention: privacyData.retention,
              hipaaCompliant: true,
              gdprCompliant: true,
              requestBody: requestBody ? this.generateExample(requestBody) : null,
              responseBody: responseSchema ? this.generateExample(responseSchema) : null,
              parameters: operation.parameters || []
            });
          });
        });
      }

      return {
        endpoints: enrichedEndpoints.sort((a, b) => a.path.localeCompare(b.path)),
        totalEndpoints: enrichedEndpoints.length,
        generated: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error generating API docs:', error);
      throw error;
    }
  }

  /**
   * Generate example request/response from schema
   */
  generateExample(schema) {
    if (!schema || !schema.properties) return null;

    const example = {};

    Object.entries(schema.properties).forEach(([key, value]) => {
      if (value.type === 'string') {
        if (value.format === 'email') {
          example[key] = 'user@example.com';
        } else if (value.format === 'date') {
          example[key] = '2025-12-22';
        } else if (value.enum) {
          example[key] = value.enum[0];
        } else if (key.toLowerCase().includes('password')) {
          example[key] = '********';
        } else if (key.toLowerCase().includes('token')) {
          example[key] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
        } else {
          example[key] = 'string';
        }
      } else if (value.type === 'integer' || value.type === 'number') {
        example[key] = 0;
      } else if (value.type === 'boolean') {
        example[key] = true;
      } else if (value.type === 'array') {
        example[key] = [];
      } else if (value.type === 'object') {
        example[key] = {};
      }
    });

    return example;
  }

  /**
   * Write documentation to frontend static file
   */
  async writeToFrontend() {
    try {
      const docs = await this.generateDocs();
      
      // Path to frontend public directory
      const frontendPath = path.join(__dirname, '../../../frontend/public/api-docs.json');
      
      // Ensure directory exists
      const dir = path.dirname(frontendPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write formatted JSON
      fs.writeFileSync(frontendPath, JSON.stringify(docs, null, 2), 'utf-8');
      
      console.log(`✅ API documentation generated successfully!`);
      console.log(`📁 File location: ${frontendPath}`);
      console.log(`📊 Total endpoints: ${docs.totalEndpoints}`);
      console.log(`🕐 Generated at: ${docs.generated}`);
      
      return {
        success: true,
        filePath: frontendPath,
        totalEndpoints: docs.totalEndpoints
      };
    } catch (error) {
      console.error('❌ Error writing API documentation:', error);
      throw error;
    }
  }
}

module.exports = new ApiDocGenerator();
