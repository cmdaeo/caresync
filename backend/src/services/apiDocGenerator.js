// backend/src/services/apiDocGenerator.js
const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

class ApiDocGenerator {
  constructor() {
    this.privacyMetadata = this.loadPrivacyMetadata();
    this.rateLimits = this.parseRateLimits();
  }

  parseRateLimits() {
    try {
      const appJsPath = path.join(__dirname, '../app.js');
      if (!fs.existsSync(appJsPath)) return { routeLimits: {}, globalLimit: '100 requests / 15 minutes' };
      
      const appJsContent = fs.readFileSync(appJsPath, 'utf-8');
      
      const limiters = {};
      const limiterRegex = /const (\w+Limiter|globalLimiter)\s*=\s*rateLimit\(\{[\s\S]*?windowMs:\s*(.*?),\s*max:\s*(\d+)/g;
      let match;
      while ((match = limiterRegex.exec(appJsContent)) !== null) {
        const name = match[1];
        let windowMs = match[2].trim();
        let max = match[3];
        
        let windowStr = windowMs;
        if (windowMs === '60 * 60 * 1000') windowStr = '1 hour';
        else if (windowMs === '15 * 60 * 1000') windowStr = '15 minutes';
        else if (windowMs.includes('*')) {
           const mins = parseInt(windowMs.split('*')[0].trim());
           windowStr = `${mins} minutes`;
        }
        
        limiters[name] = `${max} requests / ${windowStr}`;
      }

      const routeLimits = {};
      const useRegex = /app\.use\(['"](.*?)['"],\s*(\w+Limiter)\)/g;
      while ((match = useRegex.exec(appJsContent)) !== null) {
        routeLimits[match[1]] = limiters[match[2]];
      }
      
      return { routeLimits, globalLimit: limiters['globalLimiter'] || '100 requests / 15 minutes' };
    } catch (e) {
      console.error('Error parsing rate limits', e);
      return { routeLimits: {}, globalLimit: '100 requests / 15 minutes' };
    }
  }

  getRateLimitForPath(apiPath) {
    // Find the longest matching route prefix
    let matchingPrefix = '';
    for (const prefix of Object.keys(this.rateLimits.routeLimits)) {
      if (apiPath.startsWith(prefix) && prefix.length > matchingPrefix.length) {
        matchingPrefix = prefix;
      }
    }
    return matchingPrefix ? this.rateLimits.routeLimits[matchingPrefix] : this.rateLimits.globalLimit;
  }

  loadPrivacyMetadata() {
    return {
      '/api/auth/login': {
        dataCollected: ['Email address', 'Password hash', 'Login timestamp', 'IP address', 'User-Agent'],
        dataShared: ['None - credentials never leave the system'],
        retention: 'Login logs: 90 days (audit trail)'
      },
      '/api/auth/register': {
        dataCollected: ['Email address', 'Password hash', 'Full name', 'Role', 'Registration timestamp'],
        dataShared: ['None - stored securely with AES-256 encryption'],
        retention: 'User data: Until account deletion + 7 years audit logs'
      },
      '/api/auth/me': {
        dataCollected: ['User ID from JWT token'],
        dataShared: ['None - personal data only visible to authenticated user'],
        retention: 'Session data: Duration of JWT validity (7 days)'
      },
      '/api/auth/profile': {
        dataCollected: ['Updated profile fields', 'Modification timestamp'],
        dataShared: ['None - user controls their own data'],
        retention: 'Profile data: Until account deletion'
      },
      '/api/auth/password': {
        dataCollected: ['Password change request', 'Timestamp', 'IP address'],
        dataShared: ['None - passwords are hashed with bcrypt'],
        retention: 'Password history: 90 days (prevent reuse)'
      },
      '/api/medications': {
        dataCollected: ['User ID', 'Medication names', 'Dosage', 'Frequency', 'Schedule timestamps'],
        dataShared: ['With authorized caregivers (explicit consent)', 'Healthcare providers (HIPAA BAA)'],
        retention: 'Active medications: Indefinite. Deleted: 7 years (regulatory compliance)'
      },
      '/api/medications/adherence': {
        dataCollected: ['Medication ID', 'Timestamp', 'Geolocation (optional)', 'Device ID', 'Notes'],
        dataShared: ['With caregivers (if sharing enabled)', 'Anonymized for analytics (opt-in only)'],
        retention: '7 years (HIPAA compliance for medical records)'
      },
      '/api/devices/register': {
        dataCollected: ['Device serial number', 'Device type', 'Firmware version', 'MAC address', 'Public key'],
        dataShared: ['None - device identifiers encrypted at rest'],
        retention: 'Active devices: Indefinite. Deregistered: 30 days'
      },
      '/api/devices': {
        dataCollected: ['Device metadata', 'Sync status', 'Last connection timestamp'],
        dataShared: ['With device owner and authorized caregivers only'],
        retention: 'Device logs: 90 days. Configuration: Until device removal'
      },
      '/api/caregivers/invite': {
        dataCollected: ['Caregiver email', 'Relationship type', 'Permission levels', 'Invitation timestamp'],
        dataShared: ['Email sent to invited caregiver', 'Notification to patient'],
        retention: 'Pending invitations: 7 days. Accepted relationships: Until revoked'
      },
      '/api/caregivers': {
        dataCollected: ['User ID', 'Caregiver relationships', 'Access permissions'],
        dataShared: ['Between patient and caregiver (bidirectional)'],
        retention: 'Relationship data: Until explicitly revoked + 1 year audit'
      },
      '/api/caregivers/pending': {
        dataCollected: ['Pending invitation IDs', 'Invitation metadata'],
        dataShared: ['Only with invited caregiver'],
        retention: 'Pending invitations: 7 days (auto-expire)'
      },
      '/api/notifications': {
        dataCollected: ['Notification type', 'Recipient ID', 'Delivery timestamp', 'Read status'],
        dataShared: ['Only with intended recipient'],
        retention: 'Notifications: 30 days. Critical alerts: 1 year'
      },
      '/api/reports/adherence': {
        dataCollected: ['Report date range', 'Medication adherence data', 'User demographics (opt-in)', 'Generation timestamp'],
        dataShared: ['None - user-initiated download only', 'Can be shared with healthcare providers at user discretion'],
        retention: 'Report metadata: 1 year. Generated PDFs: Not stored (ephemeral)'
      },
      '/api/auth/account': {
        dataCollected: ['User confirmation', 'Deletion reason (optional)', 'Account deletion timestamp'],
        dataShared: ['None'],
        retention: 'Immediate deletion with 30-day grace period. Audit logs: 7 years (compliance)'
      },
      'default': {
        dataCollected: ['User ID', 'Request metadata', 'Timestamp'],
        dataShared: ['None - internal use only'],
        retention: 'Standard retention policies apply (see Privacy Policy)'
      }
    };
  }

  getPrivacyMetadata(path, method) {
    if (this.privacyMetadata[path]) return this.privacyMetadata[path];

    if (path.includes('/medications/adherence')) return this.privacyMetadata['/api/medications/adherence'];
    if (path.includes('/medications')) return this.privacyMetadata['/api/medications'];
    if (path.includes('/devices/register')) return this.privacyMetadata['/api/devices/register'];
    if (path.includes('/devices')) return this.privacyMetadata['/api/devices'];
    if (path.includes('/caregivers/pending')) return this.privacyMetadata['/api/caregivers/pending'];
    if (path.includes('/caregivers/invite')) return this.privacyMetadata['/api/caregivers/invite'];
    if (path.includes('/caregivers')) return this.privacyMetadata['/api/caregivers'];
    if (path.includes('/reports')) return this.privacyMetadata['/api/reports/adherence'];
    if (path.includes('/notifications')) return this.privacyMetadata['/api/notifications'];
    if (path.includes('/auth/password')) return this.privacyMetadata['/api/auth/password'];
    if (path.includes('/auth/profile')) return this.privacyMetadata['/api/auth/profile'];
    if (path.includes('/auth/me')) return this.privacyMetadata['/api/auth/me'];

    return this.privacyMetadata['default'];
  }

  inferPrivacyMetadata(pathPattern, method, requestSchema) {
    const baseMetadata = this.getPrivacyMetadata(pathPattern, method);
    const dataCollected = new Set(baseMetadata.dataCollected);
    
    // Dynamically infer data collection from request body properties
    if (requestSchema && requestSchema.properties) {
      Object.keys(requestSchema.properties).forEach(key => {
        const word = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        dataCollected.add(word);
      });
    }

    return {
      ...baseMetadata,
      dataCollected: Array.from(dataCollected),
      rateLimit: this.getRateLimitForPath(pathPattern)
    };
  }

  generateExample(schema, components) {
    if (!schema) return null;

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/components/schemas/', '');
      const refSchema = components?.schemas?.[refPath] || components?.responses?.[refPath];
      // If it points to a response, we might need to drill down to its schema
      if (refSchema && refSchema.content && refSchema.content['application/json']) {
         return this.generateExample(refSchema.content['application/json'].schema, components);
      }
      return this.generateExample(refSchema, components);
    }

    if (schema.allOf) {
      let combined = {};
      schema.allOf.forEach(subSchema => {
        combined = { ...combined, ...this.generateExample(subSchema, components) };
      });
      return combined;
    }

    if (schema.type === 'array') {
      return [this.generateExample(schema.items, components)];
    }

    if (schema.type === 'object' || schema.properties) {
      const example = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, value]) => {
          example[key] = value.example !== undefined ? value.example : this.generateExample(value, components);
        });
      }
      return example;
    }

    if (schema.type === 'string') {
      if (schema.example !== undefined) return schema.example;
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time' || schema.format === 'date') return new Date().toISOString();
      if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'binary') return 'binary_file_data';
      return 'string';
    }

    if (schema.type === 'integer' || schema.type === 'number') {
      if (schema.example !== undefined) return schema.example;
      return 0;
    }

    if (schema.type === 'boolean') {
      if (schema.example !== undefined) return schema.example;
      return true;
    }

    return null;
  }

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
        path.join(__dirname, '../swagger.js'),
      ]
    };

    try {
      const swaggerSpec = swaggerJsdoc(options);
      const enrichedEndpoints = [];
      const components = swaggerSpec.components || {};

      if (swaggerSpec.paths) {
        Object.entries(swaggerSpec.paths).forEach(([pathPattern, pathItem]) => {
          Object.entries(pathItem).forEach(([method, operation]) => {
            if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) return;

            const requiresAuth = operation.security && operation.security.length > 0;
            const requestSchema = operation.requestBody?.content?.['application/json']?.schema || 
                                  operation.requestBody?.content?.['multipart/form-data']?.schema;
            
            const responseSchemaObj = operation.responses?.['200'] || operation.responses?.['201'];
            let responseSchema = responseSchemaObj?.content?.['application/json']?.schema;
            
            // Resolve response ref
            if (!responseSchema && responseSchemaObj?.$ref) {
              const refPath = responseSchemaObj.$ref.replace('#/components/responses/', '');
              const refResponse = components.responses?.[refPath];
              responseSchema = refResponse?.content?.['application/json']?.schema;
            }

            const privacyData = this.inferPrivacyMetadata(pathPattern, method, requestSchema);

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
              requestBody: requestSchema ? this.generateExample(requestSchema, components) : null,
              responseBody: responseSchema ? this.generateExample(responseSchema, components) : null,
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

  async writeToFrontend() {
    try {
      const docs = await this.generateDocs();
      const frontendPath = path.join(__dirname, '../../../frontend/public/api-docs.json');
      const dir = path.dirname(frontendPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

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
