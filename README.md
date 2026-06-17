# CareSync

A cross-platform healthcare management application combining a smart IoT medication dispenser (CareBand/CareBox) with a web and mobile interface for patients, caregivers, and healthcare providers.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Realtime-Supabase-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

---

## Overview

CareSync manages medication adherence through a unified software platform and connected IoT hardware. The system supports three primary roles (Patient, Caregiver, Doctor) and focuses on secure data handling, prescription parsing, and real-time synchronization.

This repository serves as both the functional application and a technical showcase of the architecture. Due to hosting constraints (Vercel and Supabase free tiers), several technical workarounds were implemented to maintain performance and stay within quota limits.

## Core Features & Technical Implementation

### 1. Presentation Synchronization Engine
A real-time presentation engine used for live demonstrations across multiple devices.

**Implementation details & constraints:**
- **Batched Syncing:** To stay within Supabase and Vercel free-tier limits, true 0ms synchronization is not used. DOM events (`scroll`, `click`, `input`, pointer movement) are intercepted and queued into a Map. The queue is flushed every 150ms and sent as a single `batch_sync` payload via Supabase WebSockets.
- **Hybrid Architecture:** High-frequency ephemeral events (like scrolling and pointer movements) bypass the Vercel backend entirely, establishing a direct frontend-to-frontend WebSocket connection via Supabase. Persistent state changes (e.g., changing the current slide) are `POST`ed to the Vercel backend so late-joining clients receive the correct initial state.
- **Media Sync:** Native `<video>` and `<audio>` events (`play`, `pause`, `volumechange`, `ratechange`) are intercepted and synced.
- **File Upload Simulation:** Browsers restrict scripts from programmatically modifying `<input type="file">`. To simulate file uploads during a presentation, the application intercepts the upload event, broadcasts a `FILE_UPLOAD_SIMULATION` payload, and renders a custom CSS overlay on the audience's screen. Once the backend parses the PDF, the extracted data payload is broadcasted, updating the audience's React state to match the presenter's.

### 2. Adherence PDF Generation
Generates verifiable medication adherence reports.

**Implementation details:**
- **Server-Side Generation:** Uses `pdfkit` and `@napi-rs/canvas` on the Node.js backend.
- **Security & Validation:** PDFs are encrypted with AES-128 RC4 password protection. Document permissions are set to restrict copying and modification natively.
- **Verification QR Code:** A SHA-256 cryptographic hash of the PDF buffer is stored in the `DocumentMetadata` table. A QR code is generated using `qrcode` and embedded in the PDF. Scanning the QR code points to a verification endpoint that extracts `req.headers.origin` to ensure the validation URL matches the exact deployment environment.

### 3. Caregiver Portal & Role Isolation
Manages patient-caregiver relationships and data access.

**Implementation details:**
- **Permissions:** Uses a granular JSONB permission model (`canViewMedications`, `canManageMedications`, `canReceiveAlerts`) stored in the `CaregiverPatient` mapping table.
- **Data Isolation:** The backend uses a dual-sequelize architecture. Personally Identifiable Information (PII) is isolated and encrypted at rest using AES field-level encryption (`sequelize-encrypted`), separated from general medical adherence data.

### 4. 3D Hardware Showcase & Video Sync
Showcases the physical hardware models and UI features.

**Implementation details:**
- **3D Rendering:** Uses Google's `<model-viewer>` for WebGL-based interactions with CareBox and CareBand PCB CAD models (`.glb` files).
- **Video Ambilight Effect:** Renders three identical `<video>` tags layered with CSS `blur` and `mask-image` properties to create an ambient light effect based on the video's current frame. 
- **Cache Workaround:** To prevent Chromium-based browsers from throwing `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` when three video tags request the same chunked file simultaneously, cache-busting query strings (`?cache=main`, `?cache=blur`) are dynamically appended to isolate the browser's media cache.
- **Time-lapsing:** Fast-forwarding the video is handled by modifying the native `playbackRate` rather than manipulating `currentTime`, which prevents irregular frame skipping.

### 5. Prescription Parsing Pipeline
Extracts posology data from uploaded medical prescriptions.

**Implementation details:**
- **OCR:** Buffers the PDF upload and processes text via `pdf-parse` on the Node.js backend.
- **Parsing Engines:** Implements a custom Regex extraction engine tailored for Portuguese SNS (Serviço Nacional de Saúde) prescription layouts to avoid unnecessary LLM API costs. An AI fallback engine is available for non-standard layouts.

---

## Architecture

The project is a monorepo. The backend is deployed as a serverless function, and the frontend is a Vite SPA.

```text
caresync/
├── backend/          # Express.js REST API (Node.js)
│   └── src/
│       ├── config/   # DB connection, rate limiter
│       ├── controllers/
│       ├── models/   # Sequelize ORM
│       ├── routes/
│       ├── services/ # PDF, Auth, Prescription Parsing
│       └── utils/
├── frontend/         # React + TypeScript SPA (Vite)
│   ├── android/      # Capacitor Android build
│   └── src/
│       ├── features/ # Feature modules
│       └── shared/   # Zustand stores, Supabase client
└── supabase-schema.sql
```

**Database:** PostgreSQL hosted on Supabase (EU West region).

---

## Security Overview

- **Transport:** HTTPS enforced, HSTS headers via `helmet`.
- **CSRF:** Double-submit cookie pattern on HTTP routes. WebSocket connections rely on Supabase channel authentication.
- **Encryption:** AES encryption for PII fields via `sequelize-encrypted`.
- **Authentication:** JWT (Access/Refresh tokens) + TOTP 2FA (Google Authenticator compatible).
- **IoT Verification:** Device registration requires a signed PEM public key.

---

## Local Development

### Prerequisites
- Node.js >= 18
- PostgreSQL (or Supabase local development)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Mobile Build (Capacitor)
```bash
cd frontend
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

---

## License
MIT