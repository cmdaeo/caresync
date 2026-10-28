# CareSync Backend API

Node.js/Express REST API for the CareSync digital health platform. Designed around GDPR-aligned data handling for a Portuguese context (CNPD-58/2019 audit logging patterns), with a clear separation between identity data and clinical data at the model level.

## Stack

| Component | Version | Purpose |
|---|---|---|
| Express | 5.2.1 | HTTP framework |
| Sequelize | 6.37.8 | ORM (PostgreSQL) |
| Supabase PostgreSQL | - | Managed Postgres instance |
| jsonwebtoken + bcryptjs | 9.0.3 / 3.0.3 | Auth and password hashing (10 rounds) |
| swagger-jsdoc / swagger-ui-express | 6.2.8 / 5.0.1 | API documentation |
| Winston | 3.19.0 | Structured logging with PII scrubbing |
| speakeasy | 2.0.0 | TOTP 2FA |
| helmet | 8.1.0 | Security headers |
| pdfkit / pdf-parse | 0.18.0 / 2.4.5 | PDF generation and parsing |
| Jest / Supertest | 29.7.0 / 7.0.0 | Test suite |

Optional: Redis (rate limiting), Socket.IO (serverless environments disable it).

## Architecture

The application runs against a single PostgreSQL instance (Supabase). Identity and clinical data are separated at the model layer: `User`, `CaregiverPatient`, `AuditLog`, `ConsentLog`, `Notification` on the identity side; `Medication`, `Prescription`, `Adherence`, `Device`, `DeviceAccessPermission`, `DeviceInvitation`, `DocumentMetadata` on the clinical side. Cross-model hydration goes through `utils/crossDbHelper.js` using UUID references, not JOINs.

This is a logical separation, not a physical one. An earlier iteration of this README described a "dual-database" architecture; that was aspirational documentation, not the implementation.

## Directory layout

```text
backend/
  scripts/
    generateApiDocs.js    Swagger to api-docs.json for the frontend
    scanIDOR.js           Static BOLA/IDOR pattern scanner
  src/
    config/
      database.js         Single Sequelize instance, exported twice
      rateLimiter.js
    controllers/
    middleware/
      auth.js             JWT authMiddleware, requireRole, requirePatientAccess
      csrf.js             HMAC-SHA256 CSRF tokens
      errorHandler.js     asyncHandler, AppError hierarchy
      requestLogger.js    Request IDs and PII scrubbing
      validationMiddleware.js
    models/
    routes/
    services/
      apiDocGenerator.js
      auditLogService.js
      authService.js
      caregiverService.js
      deviceService.js
      enhancedPdfService.js
      medicationService.js
      notificationService.js
      pdfService.js
      pemParserService.js
      prescriptionParser.js
    utils/
      ApiResponse.js
      crossDbHelper.js
      encryption.js       AES-256-GCM helpers for audit-log payloads
      jwtUtils.js
      logger.js
    app.js
    swagger.js
  tests/                  114 tests across 12 suites
  .env.example
```

## Configuration

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://postgres.<ref>:<pass>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET=                  # 32+ bytes hex
JWT_REFRESH_SECRET=          # 32+ bytes hex
ENCRYPTION_KEY=              # used by sequelize-encrypted
MASTER_KEY=                  # used by utils/encryption.js
CSRF_SECRET=                 # 16+ bytes hex
SESSION_SECRET=              # 16+ bytes hex
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
VITE_SUPABASE_URL=           # required for presentation routes to initialize
VITE_SUPABASE_ANON_KEY=
```

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Start the server

```bash
npm run dev   # Development (nodemon)
npm start     # Production
```

## Testing

114 automated tests across 12 suites, running in about 10 seconds.

```bash
npm test                 # run the full suite
npm run test:coverage    # with coverage report
```

Coverage areas:

| Suite | Domain |
|---|---|
| `encryption.test.js` | AES-256-GCM round-trip, tamper detection, CBC backward compatibility |
| `csrf.test.js` | HMAC token generation, signature, expiry, middleware enforcement |
| `authMiddleware.test.js` | JWT bearer verification, role guard, patient access guard |
| `authService.test.js` | Login, register, refresh, password change, account deletion |
| `medicationService.test.js` | PRN rules, immutability guards, adherence state machine, calendar cap |
| `prescriptionReview.test.js` | BOLA/IDOR guard on `PUT /api/prescriptions/:id/review` |
| `jwtUtils.test.js` | Device signature verification, claim validation |
| `validationMiddleware.test.js` | Request body validation |
| `errorHandler.test.js` | Error class to HTTP status mapping |
| `requestLogger.test.js` | PII scrubbing (headers, body, JWT, emails) |
| `apiResponse.test.js` | Uniform response envelope |
| `integration.test.js` | Public endpoints against a live Express app |

Two pre-production defects were found by the suite and fixed:

- **CBC malleability in audit-log encryption.** Tampered IVs previously produced corrupted plaintext silently. Migrated to AES-256-GCM with authentication tags. Legacy CBC ciphertexts still decrypt for backward compatibility. Eight tests.
- **BOLA/IDOR in prescription review.** The endpoint accepted an optional `patientId` from the client and skipped the ownership check if it was absent. Now scoped to the authenticated provider via `CaregiverPatient` with `canManageMedications`; admins bypass. Five tests in `tests/prescriptionReview.test.js`.

### Static BOLA/IDOR scanner

```bash
npm run scan:idor
```

Walks all route and controller files, flags patterns that often indicate missing ownership checks, and understands two common defenses: an inline `userId: req.user.id` (or `Op.or` including it) in the same query, and `requirePatientAccess` / `requireRole(['admin'])` in the route declaration. Current tree is clean.

## Endpoints

The authoritative list is served by Swagger at `GET /api-docs`. Summary:

| Prefix | Auth | Description |
|---|---|---|
| `GET /health`, `GET /api/health` | No | Health check |
| `GET /api/csrf-token` | No | Issue a CSRF token |
| `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password`, `/refresh` | No | Auth lifecycle |
| `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password`, `PUT /api/auth/role`, `POST /api/auth/logout`, `DELETE /api/auth/account` | Yes | Authenticated user actions |
| `/api/auth/2fa/*` | Yes | TOTP 2FA setup, confirm, verify, recovery, disable, status |
| `GET /api/users/:id`, `PATCH /api/users/:id/status` | Yes | Self or admin only |
| `GET /api/medications`, `/schedule`, `/adherence`, `/adherence/stats`, `POST /api/medications`, `/adherence`, `/pem-scan`, `/parse-prescription` | Yes | Medication CRUD, adherence, parsing |
| `GET /api/caregivers`, `/pending`, `POST /api/caregivers/invite`, `POST /api/caregivers/:id/accept`, `/decline`, `DELETE /api/caregivers/:id` | Yes | Caregiver relationships |
| `GET /api/patients`, `/pending`, `POST /api/patients/invite` | Yes | Patient list for caregivers |
| `/api/devices` | Yes | Device registration, sync, invitations |
| `GET /api/notifications`, `/unread-count`, `PUT /api/notifications/:id/read`, `/read-all`, `/preferences`, `POST /api/notifications/register-token`, `/test` | Yes | Notifications |
| `GET /api/reports/report/pdf` | Yes | Generate PDF adherence report |
| `GET /api/reports/verify` | No | Verify a PDF report hash |
| `GET /api/prescriptions`, `/schedule`, `/:id`, `/needing-review`, `/stats`, `POST /api/prescriptions`, `/upload`, `PUT /api/prescriptions/:id`, `/:id/review`, `DELETE /api/prescriptions/:id` | Yes | Prescription lifecycle |
| `GET /api/consent`, `/history`, `POST /api/consent` | Yes | GDPR consent management |
| `GET /api/presentation/stream`, `POST /api/presentation/slide`, `/sync` | Bearer or presenter token | Real-time presentation engine |
| `GET /api/reviews`, `POST /api/reviews` | No | Public QR-code reviews |

## Security

- **CSRF**: HMAC-SHA256 signed tokens (custom implementation, not `csrf-csrf`). All mutating endpoints require the token from `GET /api/csrf-token`. Tests bypass via `CSRF_TEST_BYPASS=1` set in `tests/setup.js`.
- **Rate limiting**: global 200 requests per 15 minutes; stricter on `/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`, and `/api/auth/2fa/*`. Redis is optional.
- **Passwords**: bcrypt, 10 rounds.
- **JWT**: access token (7d) in the response body; refresh token (30d) in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Revocation via `tokenVersion` bump.
- **Encryption at rest**:
  - Audit-log payloads: AES-256-GCM (AEAD, authentication tag).
  - PII and medication columns: AES-256-CBC via `sequelize-encrypted`.
- **Audit logging**: append-only table with encrypted `oldValues` / `newValues` payloads.
- **Headers**: Helmet with a CSP tuned for Vercel and Capacitor.
- **2FA**: TOTP via `speakeasy`, QR code rendered client-side.
- **IoT**: device registration requires a signed JWT verified against the device's declared claims.

## Known limitations

- `sequelize-encrypted` and `speakeasy` are not actively maintained upstream. Both are pinned, tested and adequate for this project, but a production deployment should replace them.
- PII and medication columns are encrypted with AES-256-CBC, not GCM. Migration is tracked but not completed.
- The PDF report password protection relies on `pdfkit`'s encryption options; the exact cipher depends on the pdfkit version and is not asserted by this README.
- Socket.IO is disabled in serverless environments (Vercel, AWS Lambda). Real-time features on those targets go through Supabase Realtime instead.
- The demo Supabase instance backing the public landing page has been suspended by the provider (free tier idleness). The landing page is still live; the interactive dashboard is not.

## Scripts

```bash
npm run dev           # Development server (nodemon)
npm start             # Production
npm test              # Run the suite
npm run test:coverage # With coverage
npm run scan:idor     # Static BOLA/IDOR scanner
npm run generate-docs # Regenerate api-docs.json for the frontend
npm run migrate       # Sequelize migrations
npm run seed          # Sample data (development only)
```

## License

MIT