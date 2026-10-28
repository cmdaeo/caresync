# CareSync

A full-stack digital health platform built as a capstone project at the University of Aveiro (2026). Integrates a web dashboard, an Android app, an IoT medication dispenser (CareBox) and a wearable (CareBand).

**Live demo:** [caresync-pink.vercel.app](https://caresync-pink.vercel.app/). The interactive dashboard is paused because the Supabase free tier backing it was idle and suspended by the provider. The landing page and the video walkthrough remain available. The full source, including the test suite, is in this repository.

## What it does

- Patients track medications, schedules and adherence.
- Caregivers get a scoped view of the patients they are assigned to, with granular permission controls.
- A BLE-connected dispenser (CareBox) records doses physically and syncs with the API.
- A live presentation engine drives public demos, including QR-code review submission from the audience at the `students@deti 2026` showcase at University of Aveiro.

## Stack

| Layer | Stack |
|---|---|
| Web frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Mobile | Capacitor (Android), BLE integration with CareBox |
| Backend | Node.js, Express, Sequelize, PostgreSQL (Supabase) |
| Realtime | Supabase Realtime, Server-Sent Events |
| Auth | JWT (access + refresh), TOTP 2FA, HMAC-SHA256 CSRF |
| Encryption | AES-256-GCM for audit-log payloads; AES-256-CBC via `sequelize-encrypted` for PII and medication columns |
| Testing | Jest, Supertest |

## Repository layout

```text
caresync/
  backend/           Express REST API
    src/
      config/        database connection, rate limiter
      controllers/
      middleware/    auth, csrf, error handler, request logger
      models/        Sequelize models
      routes/
      services/      PDF generation, prescription parsing, audit log
      utils/
    tests/           114 tests across 12 suites
    scripts/         scanIDOR.js, generateApiDocs.js
  frontend/          React + TypeScript SPA (Vite)
    android/         Capacitor Android build
    src/
      features/
      shared/
  supabase-schema.sql
```

## Notable engineering

A few decisions worth calling out, all verifiable in the code:

**Batched realtime sync.** DOM events are queued into a Map and flushed as a single `batch_sync` payload every 150 ms through Supabase WebSockets. High-frequency ephemeral events bypass the backend; persistent state changes are `POST`ed so late-joining clients receive the correct initial state.

**Presentation engine, not a video call.** The live demo synchronizes slides, scroll position, pointer and 3D model state across audience devices. It also intercepts `<video>` and `<audio>` events (`play`, `pause`, `volumechange`, `ratechange`) and replays them on the audience side. File uploads are simulated by broadcasting a payload and rendering a CSS overlay on the audience screen until the backend parses the PDF.

**QR-code reviews.** At the `students@deti 2026` public showcase, the landing page exposes a QR code that any visitor can scan to submit a short review (clinical, patient or caregiver view). Submissions are moderated before being published on the showcase page. This turned a static demo into a piece of interactive evidence that the platform handles unauthenticated input safely.

**Prescription parser.** Buffers the PDF upload, extracts text with `pdf-parse`, and applies a deterministic regex engine tailored to Portuguese SNS (Serviço Nacional de Saúde) prescription layouts. Falls back to an LLM (Groq Llama-3.3-70b, with Ollama/Qwen 2.5 as a local fallback) only when the fast path finds nothing. Each parsed medication is editable line-by-line by the user before being saved.

**Verifiable PDF reports.** Server-side generated with `pdfkit`. Each report carries a SHA-256 hash stored in a `DocumentMetadata` table and a QR code pointing to a public `/verify` endpoint that returns only non-clinical metadata. The QR embeds the deployment origin at generation time so the verification URL matches the environment it was issued from.

## Testing

The backend ships with 114 automated tests across 12 Jest + Supertest suites, running in about 10 seconds.

```bash
cd backend
npm install
npm test
```

Coverage areas: cryptographic primitives (AES-256-GCM tamper detection), CSRF token HMAC, JWT + RBAC, error handling, medication state-machine guards, prescription review ownership checks.

The suite surfaced two pre-production security defects during development:

- **AES-CBC ciphertext malleability.** A tampered IV silently produced corrupted plaintext with no error. Audit-log payloads were migrated to AES-256-GCM (AEAD) with a backward-compatible CBC read path for legacy ciphertexts. Covered by 8 tests in `tests/encryption.test.js`.
- **BOLA/IDOR on `PUT /api/prescriptions/:id/review`.** Prescription ownership was enforced only when a `patientId` was supplied by the caller; without it, any authenticated provider could review any prescription by UUID. The endpoint is now scoped: the authenticated provider must be assigned to the patient via `CaregiverPatient` with `canManageMedications`, or be an admin. Covered by 5 tests in `tests/prescriptionReview.test.js`.

A static scanner (`npm run scan:idor` in `backend/`) flags common BOLA/IDOR patterns across all route and controller files. It runs clean on the current tree.

## Security notes

- All mutating endpoints require a CSRF token issued by `GET /api/csrf-token`. The token is HMAC-SHA256 signed.
- Refresh tokens are `HttpOnly`, `Secure`, `SameSite=Strict` cookies. Access tokens are short-lived JWTs with `tokenVersion`-based revocation on password change.
- Audit-log payloads are AES-256-GCM encrypted at rest.
- PII and medication columns use AES-256-CBC via `sequelize-encrypted`.
- Role-based access control on every route (patient, caregiver, healthcare provider, admin).
- GDPR-aligned consent logging, right to erasure (`DELETE /api/auth/account`), and data minimization.

## Known limitations

- `sequelize-encrypted` (used for PII and medication columns) and `speakeasy` (used for TOTP 2FA) are no longer actively maintained upstream. Both are pinned and tested, but a production deployment should replace them.
- PII and medication columns are encrypted with AES-256-CBC, not GCM. Migration is tracked but not completed.
- The PDF encryption cipher used by `pdfkit` depends on the version installed; the current config uses a password-protected PDF without a specific cipher guarantee in this README.
- The repository previously contained a `logins.txt` file with test credentials for the demo Supabase instance. The file has been removed and the demo instance has been retired; the test accounts no longer exist.

## Local development

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local instance or Supabase project)

### Backend

```bash
cd backend
cp .env.example .env
# Fill DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, MASTER_KEY, CSRF_SECRET
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Android build (Capacitor)

```bash
cd frontend
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

## License

MIT
