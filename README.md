# CareSync

> A cross-platform healthcare management application combining a smart IoT medication dispenser (CareBand/CareBox) with a web and mobile interface for patients, caregivers, and healthcare providers.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Mobile Build](#mobile-build)
- [Features Missing / Incomplete](#features-missing--incomplete)
- [Upcoming Features](#upcoming-features)
- [Optimizations To Be Made](#optimizations-to-be-made)
- [Known Issues](#known-issues)

---

## Overview

CareSync is a healthtech platform built around two hardware products — **CareBand** (a wearable smart dispenser) and **CareBox** (a home medication management hub) — and a unified software suite that ties everything together. The system is designed with a strong security-first, privacy-by-design philosophy given its handling of sensitive medical data.

The platform supports three distinct user roles:

| Role | Description |
|------|-------------|
| **Patient** | Manages their own medications, prescriptions, devices, and adherence history |
| **Caregiver** | Monitors assigned patients, receives alerts, and optionally manages medications on their behalf |
| **Doctor / Admin** | Reviews uploaded prescriptions, generates reports, and oversees patient data |

---

## Architecture

CareSync follows a **monorepo** layout with a clear separation between frontend and backend concerns. The backend is deployed as a **serverless function** on Vercel via `api/index.js`, and the frontend is a Vite-built React SPA also deployed to Vercel.

```
caresync/
├── api/              # Vercel serverless entry point
├── backend/          # Express.js REST API (Node.js)
│   └── src/
│       ├── config/   # DB connection, rate limiter config
│       ├── controllers/
│       ├── middleware/
│       ├── models/   # Sequelize ORM models
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/         # React + TypeScript SPA (Vite)
│   ├── android/      # Capacitor Android build
│   ├── ios/          # Capacitor iOS build
│   └── src/
│       ├── features/ # Feature-based code organisation
│       ├── shared/   # Stores, API client, native bridge
│       └── utils/
└── supabase-schema.sql
```

The backend uses **Sequelize ORM** with a **PostgreSQL** database hosted on **Supabase** (EU West region). The schema is auto-synced on first request in serverless mode using `alter: true` to handle migrations non-destructively.

---

## Features

### Authentication & Security
- JWT-based auth with access tokens (7d) and refresh tokens (30d)
- Two-factor authentication (TOTP via `speakeasy`) with QR code setup and recovery codes
- CSRF protection on all mutating routes via `csrf-csrf`
- bcrypt password hashing (12 rounds)
- Global and per-route rate limiting (auth: 10 req/15min, 2FA: 5 req/15min, reports: 20 req/hr)
- Full audit logging on sensitive actions
- Field-level encryption for PII using AES with `sequelize-encrypted`

### Medication Management
- Add, edit, and deactivate medications with dosage, frequency, and unit tracking
- Scheduled dose generation based on `timesPerDay` (1–4 doses/day with sensible default times)
- Adherence tracking with `taken`, `missed`, and `skipped` statuses
- Composite unique index on `(userId, medicationId, scheduledTime)` to prevent race-condition double-logs
- Daily schedule view by date

### Prescription Handling
- Upload prescription PDFs with automated OCR parsing via `pdf-parse`
- `prescriptionParser` service extracts medication names, dosages, and frequencies from raw text
- Prescription status workflow: `pending → reviewed → approved/rejected`
- Reviewer attribution via cross-database hydration
- Enhanced PDF generation for reports via `pdfkit` + `@napi-rs/canvas`

### Device Management
- Register and manage CareBand / CareBox IoT devices
- Device public key registration with signature verification (PEM parsing via `pemParserService`)
- Per-device access permissions with `DeviceAccessPermission` model
- Invitation system for sharing device access with caregivers (`DeviceInvitation`)
- Battery level, firmware version, connection status, and last sync tracking

### Caregiver System
- Patients can invite caregivers by email or user lookup
- Granular JSONB permission model per caregiver–patient relationship:
  - `canViewMedications`
  - `canViewAdherence`
  - `canManageMedications`
  - `canReceiveAlerts`
- Relationship type labeling (e.g., "family", "nurse")
- Active/inactive relationship toggle

### Consent Management
- Granular per-type consent tracking:
  - `symptom_processing`, `medication_tracking`, `doctor_sharing`
  - `caregiver_sharing`, `analytics`, `push_notifications`, `email_notifications`
- Append-only `consent_logs` table (no `updatedAt`, no soft-delete)
- Grant/revoke actions stored with IP and user agent for legal audit trail

### Notifications
- Notification model with `type`, `title`, `message`, `isRead`, and `metadata` fields
- Backend `notificationService` and `notificationController`
- Email notifications via `nodemailer` (Gmail SMTP configured)
- Push notification infrastructure prepared (Firebase Admin SDK env vars in `.env.example`)

### Reports
- Per-user adherence reports with date-range filtering
- PDF report generation via `enhancedPdfService`
- Rate-limited report endpoint (20/hr) to prevent abuse
- Cross-DB user hydration for reviewer and patient details

### Showcase / Landing
- Public marketing pages: Landing, Team, Hardware Evolution, Software Architecture, Security Deep Dive, Unified Timeline
- 3D model viewer for CareBand and CareBox (`careband.glb`, `carebox.glb`) via `<model-viewer>`
- Team page with member photos

### API Documentation
- Auto-generated Swagger/OpenAPI docs served at `/api-docs`
- `generateApiDocs.js` script for static JSON export
- `api-docs.json` committed to frontend for offline reference

---

## Tech Stack

### Backend
| Package | Purpose |
|---------|---------|
| `express` v5 | HTTP server |
| `sequelize` + `pg` | ORM + PostgreSQL driver |
| `sequelize-encrypted` | Field-level AES encryption |
| `jsonwebtoken` | JWT access/refresh tokens |
| `bcryptjs` | Password hashing |
| `speakeasy` + `qrcode` | TOTP 2FA |
| `csrf-csrf` | CSRF double-submit cookie |
| `helmet` | HTTP security headers |
| `express-rate-limit` | Route-level rate limiting |
| `redis` | Session / rate-limiter store (optional) |
| `socket.io` | Real-time events |
| `nodemailer` | Email delivery |
| `multer` | File upload handling |
| `pdf-parse` | Prescription OCR |
| `pdfkit` + `@napi-rs/canvas` | PDF report generation |
| `winston` + `morgan` | Structured logging |
| `swagger-jsdoc` + `swagger-ui-express` | API docs |
| `node-cron` | Scheduled tasks |

### Frontend
| Package | Purpose |
|---------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Utility-first styling |
| Capacitor | Native Android / iOS bridge |
| `zustand` (authStore, medicationStore) | Global state |
| `react-router-dom` | Client-side routing |
| `@google/model-viewer` | 3D hardware showcase |
| `react-pdf` (pdf.worker) | PDF preview in browser |

### Infrastructure
| Service | Role |
|---------|------|
| Supabase (PostgreSQL, EU West) | Primary database with PgBouncer pooling |
| Vercel | Frontend + serverless API hosting |
| Gmail SMTP | Transactional email |
| Firebase (planned) | Push notifications |

---

## Project Structure

### Backend `src/` Breakdown

```
controllers/     — Request handlers (auth, caregiver, device, medication, notification, prescription, user)
middleware/      — auth.js, csrf.js, errorHandler.js, rateLimiter.js, requestLogger.js, validationMiddleware.js
models/          — Sequelize model definitions (13 models)
routes/          — Express routers mapped to controllers
services/        — Business logic layer (auth, caregiver, device, medication, notification, PDF, prescription parsing)
utils/           — ApiResponse, crossDbHelper, encryption, jwtUtils, logger, sampleDataGenerator
config/          — database.js (dual-sequelize PII + medical), rateLimiter.js
```

### Frontend `src/` Breakdown

```
features/
  auth/          — Login, Register, ForgotPassword, ResetPassword pages + ProtectedRoute/RoleBasedRoute guards
  dashboard/     — CaregiverDashboard, PatientDashboard, SecuritySettings
  devices/       — DevicesPage
  medications/   — MyMedications, AddMedication, EditMedication, Schedule, PrescriptionUploadWizard
  reports/       — ReportsPage
  showcase/      — LandingPage, TeamPage, HardwareEvolutionPage, SoftwareArchitecturePage, SecurityDeepDivePage, UnifiedTimelinePage
shared/
  api/client.ts  — Axios/fetch wrapper with CSRF token injection
  store/         — authStore.ts (Zustand), medicationStore.ts (Zustand)
  lib/native-bridge.ts — Capacitor plugin bridge
utils/careboxProtocol.ts — CareBox BLE/serial protocol implementation
```

---

## Database Schema

CareSync uses a **dual-sequelize** architecture: two Sequelize instances both pointing to the same PostgreSQL connection, logically separated by concern (PII vs. medical data). Cross-database queries use the `crossDbHelper` utility.

### Core Models

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Auth credentials, PII (encrypted fields), role, 2FA secret |
| `Medication` | `medications` | Medication name, dosage, frequency, instructions, active flag |
| `Adherence` | `adherence` | Dose-taking log with composite unique index |
| `Prescription` | `prescriptions` | Uploaded prescription files + parsed data + status workflow |
| `Device` | `devices` | IoT device registry with public key and firmware info |
| `DeviceAccessPermission` | `device_access_permissions` | Per-device per-user access control |
| `DeviceInvitation` | `device_invitations` | Invite flow for sharing device access |
| `CaregiverPatient` | `caregiver_patients` | M:M caregiver↔patient with JSONB permissions |
| `Notification` | `notifications` | User notifications with read state |
| `AuditLog` | `audit_logs` | Immutable audit trail (no soft delete) |
| `ConsentLog` | `consent_logs` | Append-only consent grant/revoke records |
| `DocumentMetadata` | `document_metadata` | Uploaded file metadata |

### Key Design Decisions
- All primary keys are **UUIDs** (`UUIDV4`)
- `Adherence` has a composite unique index `(userId, medicationId, scheduledTime)` to ensure atomicity against race conditions
- `ConsentLog` has `updatedAt: false` and `paranoid: false` — fully immutable
- `AuditLog` has `paranoid: false` — cannot be soft-deleted
- Sensitive user fields (SSN, date of birth, etc.) are AES-encrypted at rest via `sequelize-encrypted`

---

## Security Model

CareSync handles PHI (Protected Health Information) and is built with a layered security approach:

1. **Transport**: HTTPS enforced, HSTS headers via `helmet`
2. **Authentication**: JWT with short-lived access tokens + rotating refresh tokens
3. **CSRF**: Double-submit cookie pattern on all `POST/PUT/PATCH/DELETE` routes
4. **Rate Limiting**: Tiered per endpoint (auth, 2FA, reports, global)
5. **Data Encryption**: Field-level AES encryption for PII columns via `sequelize-encrypted`
6. **Consent**: Granular consent model with immutable audit trail
7. **2FA**: TOTP-based (Google Authenticator compatible) with recovery codes
8. **Audit Logs**: Every sensitive action is logged with user ID, IP, user agent, old/new values
9. **Input Validation**: `express-validator` + `Joi` schema validation on all inputs
10. **PEM Key Verification**: IoT device registration requires signed PEM public key

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL (or a Supabase project)
- Redis (optional, for distributed rate limiting)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL, JWT secrets, encryption keys
npm install
npm run dev
```

The backend starts on port `5000` by default. On first request, Sequelize will auto-sync the schema with `alter: true`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173`. Ensure `VITE_API_URL` or the proxy in `vite.config.ts` points to your backend.

### Sample Data (Development)

In `NODE_ENV=development`, the backend automatically runs `sampleDataGenerator` on startup to seed the database with test users and medications.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase with PgBouncer) |
| `JWT_SECRET` | Access token signing secret |
| `JWT_EXPIRE` | Access token lifetime (default: `7d`) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_REFRESH_EXPIRE` | Refresh token lifetime (default: `30d`) |
| `ENCRYPTION_KEY` | 32-byte base64 key for field encryption |
| `MASTER_KEY` | Master encryption key |
| `PORT` | HTTP server port (default: `5000`) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | CORS allowed origin |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | SMTP config |
| `BCRYPT_ROUNDS` | bcrypt work factor (default: `12`) |
| `CSRF_SECRET` | CSRF token signing secret |
| `SESSION_SECRET` | Express session secret |
| `FIREBASE_PROJECT_ID` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_CLIENT_EMAIL` | Firebase push (optional) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS` | Global rate limit config |

> ⚠️ **Never commit `.env` files.** The `.gitignore` explicitly excludes all `.env*` files except `.env.example`.

---

## API Reference

Full interactive docs available at `/api-docs` (Swagger UI) when the backend is running.

### Route Summary

| Route | Controller | Description |
|-------|------------|-------------|
| `POST /api/auth/register` | authController | Register new user |
| `POST /api/auth/login` | authController | Login + issue tokens |
| `POST /api/auth/refresh` | authController | Refresh access token |
| `POST /api/auth/logout` | authController | Invalidate refresh token |
| `POST /api/auth/forgot-password` | authController | Send reset email |
| `POST /api/auth/reset-password` | authController | Reset password with token |
| `GET/POST /api/auth/2fa/*` | twoFactor routes | 2FA setup, verify, recovery |
| `GET/POST /api/medications` | medicationController | CRUD medications |
| `GET /api/medications/schedule` | medicationController | Daily schedule |
| `GET/POST /api/prescriptions` | prescriptionController | Upload + list prescriptions |
| `GET /api/prescriptions/schedule` | prescriptionController | Schedule derived from prescriptions |
| `GET/POST/PUT /api/devices` | deviceController | Register + manage devices |
| `GET/POST/DELETE /api/caregivers` | caregiverController | Caregiver relationships |
| `GET/POST /api/notifications` | notificationController | Notification CRUD |
| `GET/POST /api/consent` | consent routes | Consent grant/revoke |
| `GET /api/reports` | reports routes | Generate adherence reports |
| `GET /api/users/me` | userController | Current user profile |
| `GET /api-docs` | swagger | Interactive API docs |
| `GET /health` | — | Health check |
| `GET /api/csrf-token` | — | Fetch CSRF token |

---

## Mobile Build

CareSync uses **Capacitor** to wrap the Vite SPA into a native Android (and iOS) app.

### Android Build

```bash
cd frontend
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

The resulting `.apk` is output to `android/app/build/outputs/apk/debug/`.

### iOS Build

```bash
cd frontend
npm run build
npx cap sync
# Open Xcode
npx cap open ios
```

### Native Bridge

`src/shared/lib/native-bridge.ts` abstracts Capacitor plugin calls (camera, file system, push notifications) so the web code doesn't need to check `Capacitor.isNativePlatform()` inline everywhere.

---

## Features Missing / Incomplete

The following functionality is either stubbed, partially implemented, or missing entirely:

### High Priority
- **Push Notifications**: Firebase Admin SDK env vars are present and the infrastructure is wired up, but actual FCM token registration on mobile and server-side push dispatch are not implemented. Currently only email + in-app notifications work.
- **Real-time Updates (Socket.io)**: `socket.io` is installed as a dependency but no socket events are emitted or listened to in the current codebase. Live medication reminders and caregiver alerts require this.
- **Prescription OCR Accuracy**: The `prescriptionParser` uses basic regex heuristics on raw PDF text. Complex or scanned prescriptions will fail silently. No fallback to manual entry is enforced.
- **Caregiver Invitation Flow**: The invitation model (`DeviceInvitation`) exists, but no email-invite endpoint or UI acceptance flow is fully connected end-to-end.
- **Password Reset Email**: `nodemailer` config is present but `EMAIL_USER`/`EMAIL_PASS` are blank in `.env.example`, meaning password reset emails are not functional out of the box.

### Medium Priority
- **Redis Integration**: `redis` is installed but the `rateLimiter.js` config file exists without confirmed Redis connectivity. In production, rate limiting falls back to in-memory state, which does not persist across serverless cold starts.
- **Medication Schedule Customization**: The schedule generator uses hardcoded default times (9AM, 2PM, 9PM, etc.) based on `timesPerDay`. User-defined schedule times per medication are not supported.
- **Doctor / Admin Role UI**: There is no dedicated admin dashboard. Prescription review (`pending → approved/rejected`) has a backend route but no frontend page or workflow for the doctor role.
- **Device BLE/Serial Integration**: `careboxProtocol.ts` defines the CareBox communication protocol, but the native Capacitor plugin to actually communicate with the hardware over BLE or USB is not present.
- **iOS Build**: An iOS folder and Xcode project are present, but there is no confirmed working iOS build — only Android has been explicitly tested (`android_build.txt`).

### Low Priority
- **Refresh Token Rotation**: Refresh tokens are issued but there is no server-side rotation or revocation list (blacklist). A compromised refresh token remains valid until expiry.
- **Unit and Integration Tests**: No test suite exists. The Android and iOS folders contain placeholder `ExampleUnitTest` / `ExampleInstrumentedTest` files from Capacitor scaffolding only.
- **i18n / Localization**: The app is English-only. No internationalization framework is set up.
- **Dark Mode Persistence**: `ThemeContext.tsx` exists but it's unclear if theme preference is persisted to `localStorage` or synced with the user's system preference reliably across sessions.

---

## Upcoming Features

Planned additions for future releases:

### v1.1 — Connectivity & Alerts
- [ ] Full Firebase Cloud Messaging integration for mobile push notifications
- [ ] Socket.io real-time dose reminders and missed-dose alerts to caregivers
- [ ] BLE Capacitor plugin for CareBand/CareBox hardware communication
- [ ] Medication refill alerts (low supply threshold warnings)

### v1.2 — Clinical Workflow
- [ ] Doctor dashboard with prescription review queue and approval/rejection UI
- [ ] Digital prescription generation (signed PDF output with QR code)
- [ ] GP/pharmacist sharing via secure document link with expiry
- [ ] Appointment scheduling and reminder system

### v1.3 — Analytics & AI
- [ ] Adherence trend charts and weekly/monthly reports in-app
- [ ] AI-assisted prescription parsing (OpenAI or local LLM) to improve OCR accuracy
- [ ] Anomaly detection for unusual adherence patterns (missed streaks, double-dosing)
- [ ] Export to standard health formats (HL7 FHIR, CSV)

### v1.4 — Platform Maturity
- [ ] Full iOS App Store build and submission
- [ ] Google Play Store release
- [ ] Multi-language support (PT, ES, FR minimum)
- [ ] Offline-first mode with local SQLite cache and background sync via Capacitor

---

## Optimizations To Be Made

### Backend Performance
- **Schema Migrations**: Replace `alter: true` sync (which re-inspects all columns on every cold start) with proper Sequelize migration files (`sequelize-cli`). This alone will reduce cold start latency significantly in serverless.
- **N+1 Query Elimination**: Several endpoints hydrate user data via `crossDbHelper` in a loop. These should be batched into `WHERE id IN (...)` queries or use Sequelize eager loading with associations properly defined.
- **Redis Rate Limiting**: Replace in-memory `express-rate-limit` store with `rate-limiter-flexible` backed by Redis to correctly enforce limits across multiple serverless instances.
- **Response Compression**: `compression` middleware is installed but needs to be confirmed as active before the rate limiter and auth middleware chain.
- **Database Connection Pooling**: With PgBouncer in use, the Sequelize pool settings (`max`, `min`, `acquire`, `idle`) should be tuned for serverless — preferably `max: 1` per function instance to avoid exhausting PgBouncer connections.
- **Lazy Route Loading**: Route initialization (`loadRoutes()`) is lazy in `app.js`, but repeated calls re-require the same modules. Memoize with a flag.

### Frontend Performance
- **Code Splitting**: All showcase pages (Hardware Evolution, Security Deep Dive, etc.) are likely bundled into the main chunk. React.lazy + Suspense should be applied per-route.
- **3D Model Optimization**: `careband.glb` and `carebox.glb` are served from `public/` with no compression. Convert to Draco-compressed GLB and serve with a CDN.
- **Zustand Store Hydration**: `authStore` likely re-fetches the user profile on every page load. Add a `hydrated` flag and skip if the token is still valid.
- **API Client Token Refresh**: Verify the `client.ts` API wrapper handles 401 responses with automatic token refresh and request retry, rather than forcing a logout.

### Security Hardening
- **Refresh Token Revocation**: Implement a Redis-backed JWT blocklist or rotating refresh token family pattern to invalidate stolen refresh tokens.
- **Secrets in Repo**: The committed `.env` and `.env.vercel` files contain real credentials (database passwords, JWT secrets, encryption keys). These must be rotated immediately and the history purged with `git filter-repo`.
- **CORS**: Verify `CLIENT_URL` in production strictly matches the Vercel deployment URL and does not fall back to a wildcard.
- **File Upload Validation**: `multer` handles uploads, but MIME type and magic-byte validation for prescription PDFs should be enforced to prevent polyglot file attacks.
- **Audit Log Integrity**: `AuditLog` records can be deleted by anyone with DB access. Consider append-only PostgreSQL row-level security or write to an immutable object store (e.g., S3).

### Developer Experience
- **Environment Variable Validation**: Add `joi` or `zod` schema validation at startup that crashes fast with a clear error if required env vars are missing.
- **TypeScript on Backend**: The entire backend is plain JavaScript. Migrating to TypeScript would catch a large class of bugs (especially around Sequelize model types and cross-DB hydration).
- **Testing Infrastructure**: Set up Jest + Supertest for backend integration tests and Vitest + React Testing Library for frontend unit tests. At minimum, test the auth flow, medication CRUD, and prescription parser.
- **CI/CD Pipeline**: Add a GitHub Actions workflow for lint, test, and build on every PR. Currently deployments go directly to Vercel with no automated checks.

---

## Known Issues

- **Duplicate `/health` Route**: `app.js` registers the `/health` GET route twice — once before and once after the rate limiter middleware. The second registration shadows the first.
- **Prescription Schedule Hardcoded Times**: `GET /api/prescriptions/schedule` returns fixed scheduling times based solely on `timesPerDay`. If a patient takes a medication at custom times, the schedule will be incorrect.
- **`sampleDataGenerator` in Production Check**: The sample data seeder is guarded by `NODE_ENV === 'development'`, but `NODE_ENV` should also be explicitly validated so a misconfigured production deployment doesn't accidentally seed the database.
- **`logins.txt` in Repository**: A `logins.txt` file is present at the project root and is only excluded via `.gitignore` but may have been committed. Verify with `git log -- logins.txt`.

---

## License

MIT © CareSync Team