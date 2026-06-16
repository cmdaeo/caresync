const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareSync API',
      version: '1.0.0',
      description: `
Healthcare medication management REST API.

**Authentication**: Bearer JWT in \`Authorization\` header.

**CSRF**: All mutating requests (POST/PUT/DELETE/PATCH) require \`x-csrf-token\` header. Obtain token via \`GET /api/csrf-token\`.

**Privacy**: HIPAA-compliant + GDPR/RGPD (CNPD-58/2019). All medical data encrypted at rest.
      `,
      contact: { name: 'CareSync Team', email: 'support@caresync.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://api.caresync.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token. Expires in 7d. Refresh via POST /api/auth/refresh-token.',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            requestId: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errorCode: { type: 'string' },
            requestId: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'caregiver', 'healthcare_provider', 'admin'] },
            isActive: { type: 'boolean' },
            twoFactorEnabled: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Medication: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Metformin' },
            dosage: { type: 'string', example: '500' },
            dosageUnit: { type: 'string', example: 'mg' },
            frequency: { type: 'string', example: 'twice_daily' },
            timesPerDay: { type: 'integer', example: 2 },
            totalQuantity: { type: 'integer', example: 60 },
            currentQuantity: { type: 'integer' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date', nullable: true },
            isPRN: { type: 'boolean', description: 'Pro Re Nata — as needed' },
            instructions: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Adherence: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            medicationId: { type: 'string', format: 'uuid' },
            scheduledTime: { type: 'string', format: 'date-time' },
            takenAt: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['taken', 'missed', 'skipped'] },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['medication_reminder', 'missed_dose', 'refill_reminder', 'device_alert', 'system_alert', 'caregiver_alert'] },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            deviceId: { type: 'string' },
            name: { type: 'string' },
            deviceType: { type: 'string' },
            model: { type: 'string', nullable: true },
            batteryLevel: { type: 'integer', nullable: true },
            connectionStatus: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            lastSync: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Prescription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['active', 'expired', 'filled', 'cancelled', 'pending'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ConsentStatus: {
          type: 'object',
          properties: {
            symptom_processing: { $ref: '#/components/schemas/ConsentEntry' },
            medication_tracking: { $ref: '#/components/schemas/ConsentEntry' },
            doctor_sharing: { $ref: '#/components/schemas/ConsentEntry' },
            caregiver_sharing: { $ref: '#/components/schemas/ConsentEntry' },
            analytics: { $ref: '#/components/schemas/ConsentEntry' },
            push_notifications: { $ref: '#/components/schemas/ConsentEntry' },
            email_notifications: { $ref: '#/components/schemas/ConsentEntry' },
          },
        },
        ConsentLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            consentType: { type: 'string', enum: ['symptom_processing', 'medication_tracking', 'doctor_sharing', 'caregiver_sharing', 'analytics', 'push_notifications', 'email_notifications'] },
            action: { type: 'string', enum: ['grant', 'revoke'] },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CaregiverPatient: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            caregiverId: { type: 'string', format: 'uuid' },
            patientId: { type: 'string', format: 'uuid' },
            relationship: { type: 'string', nullable: true },
            isVerified: { type: 'boolean' },
            permissions: { type: 'object' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid', nullable: true },
            action: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string', format: 'uuid', nullable: true },
            oldValues: { type: 'object', nullable: true },
            newValues: { type: 'object', nullable: true },
            ipAddress: { type: 'string', nullable: true },
            userAgent: { type: 'string', nullable: true },
            metadata: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DeviceAccessPermission: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deviceId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            accessLevel: { type: 'string', enum: ['read_only', 'full_access'] },
            grantedBy: { type: 'string', format: 'uuid' },
            grantedAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            isActive: { type: 'boolean' },
          },
        },
        DeviceInvitation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            deviceId: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            accessLevel: { type: 'string', enum: ['read_only', 'full_access'] },
            invitationToken: { type: 'string' },
            createdBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            expiresAt: { type: 'string', format: 'date-time' },
            acceptedAt: { type: 'string', format: 'date-time', nullable: true },
            acceptedBy: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['pending', 'accepted', 'expired', 'revoked'] },
          },
        },
        DocumentMetadata: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            documentId: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            documentType: { type: 'string' },
            documentHash: { type: 'string' },
            fileName: { type: 'string' },
            fileSize: { type: 'integer' },
            generationTimestamp: { type: 'string', format: 'date-time' },
            expirationDate: { type: 'string', format: 'date-time', nullable: true },
            passwordProtected: { type: 'boolean' },
            signatureRequired: { type: 'boolean' },
            includeCharts: { type: 'boolean' },
            metadata: { type: 'object', nullable: true },
            accessCount: { type: 'integer' },
            lastAccessed: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            role: { type: 'string' },
            type: { type: 'string', enum: ['clinical', 'patient', 'caregiver'] },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            content: { type: 'string' },
            isApproved: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ConsentEntry: {
          type: 'object',
          properties: {
            granted: { type: 'boolean' },
            lastUpdated: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer' },
            totalPages: { type: 'integer' },
            totalItems: { type: 'integer' },
            itemsPerPage: { type: 'integer' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or token invalid/expired',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                expired: { value: { success: false, message: 'Token has expired', errorCode: 'TOKEN_EXPIRED' } },
                missing: { value: { success: false, message: 'Access token is missing or invalid', errorCode: 'AUTHENTICATION_ERROR' } },
              },
            },
          },
        },
        Forbidden: {
          description: 'CSRF token invalid or access denied',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        ValidationError: {
          description: 'Request body validation failed',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/ErrorResponse' },
                  { type: 'object', properties: { errors: { type: 'array', items: { type: 'object' } } } },
                ],
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Server health & CSRF' },
      { name: 'Auth', description: 'Authentication, registration, password management, 2FA' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Medications', description: 'Medication CRUD, adherence, calendar, PEM scan, prescription parsing' },
      { name: 'Caregivers', description: 'Caregiver relationships and invitations' },
      { name: 'Patients', description: 'Patient list for caregivers' },
      { name: 'Devices', description: 'IoT device registration and management' },
      { name: 'Notifications', description: 'In-app and push notifications' },
      { name: 'Prescriptions', description: 'Prescription records and PDF reports' },
      { name: 'Reports', description: 'Adherence and analytics reports' },
      { name: 'Consent', description: 'GDPR consent management (CNPD-58/2019)' },
      { name: '2FA', description: 'Two-factor authentication setup and verification' },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/models/index.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs, swaggerUi };