# CareSync — Next-Generation Healthcare Platform

> A cross-platform healthcare management application combining a smart IoT medication dispenser (CareBand/CareBox) with a highly advanced web and mobile interface for patients, caregivers, and healthcare providers.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Realtime-Supabase%20WebSockets-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)
[![WebGL](https://img.shields.io/badge/3D-WebGL%20Model%20Viewer-orange)](https://modelviewer.dev)

---

## 🌟 The CareSync Showcase Experience

CareSync is not just an application; it is a meticulously crafted technical showcase demonstrating the bleeding edge of modern web development, IoT integration, and medical data security. We built this with strict constraints in mind (free tiers on Vercel and Supabase) and engineered creative workarounds to deliver a premium experience.

### 🎭 Batched Presentation Engine (Free-Tier Optimized)
We built a custom presentation synchronization engine to drive live demonstrations across multiple devices without relying on screen sharing. Because we are hosted on free tiers, we could not afford true 0ms zero-latency real-time sync without burning through Vercel execution limits or Supabase quota limits.
**How we implemented it:**
- **The 150ms Batch Queue**: Instead of sending every single mouse movement or scroll event immediately, the Admin's client heavily intercepts the DOM and queues `SCROLL`, `LASER`, `INPUT`, and `CLICK` events into a Map. Every 150ms, the queue flushes and broadcasts a single `batch_sync` payload over **Supabase WebSockets**. This keeps the presentation buttery smooth (simulating real-time) while massively reducing network requests.
- **Vercel vs. Supabase Hybrid**: High-frequency ephemeral events (laser pointer, scrolling) completely bypass the Vercel backend and broadcast directly via Supabase WebSockets (which allows 200 concurrent connections for free). However, persistent state changes (like switching to a new slide) are securely `POST`ed to the Vercel backend so late-joining audience members know exactly which slide to render.
- **Advanced Media Sync**: Native `<video>` and `<audio>` events (`play`, `pause`, `volumechange`, `ratechange`) are intercepted and synced across the audience.
- **File Simulation & Parsing Sync**: Security protocols in browsers block scripts from modifying `<input type="file">`. To simulate the Admin uploading a prescription for the audience, we intercept the upload event and broadcast a `FILE_UPLOAD_SIMULATION`. The audience sees a custom CSS-animated overlay toast (`📎 Anexo: document.pdf`) visually proving the file was "uploaded". Once the backend parses the PDF, the extracted medication payload is broadcasted over WebSockets, instantly populating the audience's screen with the live results!

### 📄 Cryptographic Adherence PDFs
CareSync doesn't just display data; it generates secure, medically verifiable reports.
**How we implemented it:**
- **Server-Side Generation**: Uses `pdfkit` and `@napi-rs/canvas` to render high-fidelity, multipage adherence reports entirely on the Node.js backend.
- **Military-Grade Security**: PDFs are generated with AES-128 RC4 password protection. We strictly enforce document permissions, disabling unauthorized copying, text extraction, and modification natively within the PDF headers.
- **Blockchain-Ready Verification**: When a PDF is generated, we compute a SHA-256 cryptographic hash of the file buffer and store it in our `DocumentMetadata` table. We then embed a dynamically generated QR code (via `qrcode`) directly into the PDF. Scanning this printed QR code directs a doctor to a verification page that strictly extracts `req.headers.origin` to ensure the verification domain matches the deployment environment exactly, preventing spoofing.

### 👨‍⚕️ Zero-Trust Caregiver Portal
The system supports distinct roles (Patient, Caregiver, Doctor) interacting with the same underlying IoT hardware.
**How we implemented it:**
- **Granular JSONB Permissions**: Patients can invite caregivers through an email invitation flow. The relationship (`CaregiverPatient` table) utilizes a granular JSONB permission model (`canViewMedications`, `canManageMedications`, `canReceiveAlerts`). 
- **Medical vs. PII Isolation**: The backend uses a **dual-sequelize** architecture. PII (Personally Identifiable Information) is strictly isolated and encrypted at rest using AES field-level encryption (`sequelize-encrypted`), completely decoupled from the medical adherence data.

### 🎬 Ambilight & 3D Hardware Showcase
The landing page and hardware showcase push browser limits to impress users visually.
**How we implemented it:**
- **WebGL 3D PCB Rendering**: Native Google `<model-viewer>` integration allows users to interact with high-fidelity CAD models of the CareBox and CareBand PCBs natively in the browser.
- **Optical Ambilight Video Sync**: We implemented an "Ambilight" CSS engine without using heavy canvas processing. We render three identical `<video>` tags simultaneously. The bottom layer is a heavy `blur-[100px]` wash, the middle layer is a mapped `blur-[30px]` glowing aura constrained exactly to the phone's border-radius, and the top layer is the sharp video. 
- **Chromium Cache Bypass**: To prevent Chromium browsers from throwing `net::ERR_CACHE_OPERATION_NOT_SUPPORTED` when three videos request identical chunks simultaneously, we dynamically append cache-busting query strings (`?cache=main`, `?cache=blur`) to isolate the browser's internal media chunk cache.
- **Native Fast-Forwarding**: Instead of manually manipulating `currentTime` (which causes irregular frame skipping), we manipulate the browser's native engine (`playbackRate = 8.0`) to create perfectly smooth, hardware-accelerated time-lapses.

### 💊 Dual-Engine Prescription Pipeline
**How we implemented it:**
- **OCR Extraction**: When a prescription is uploaded, the Node.js backend buffers the file and processes it via `pdf-parse`.
- **Regex & AI Fallback**: We built a custom Regex extraction engine tailored for Portuguese SNS (Serviço Nacional de Saúde) prescriptions that scans for known posology patterns, circumventing the need for expensive LLM calls on standard formats. An AI fallback engine is available for complex, non-standard layouts.

---

## 🏗 Architecture

CareSync follows a **monorepo** layout with a clear separation between frontend and backend concerns. The backend is deployed as a **serverless function** on Vercel, and the frontend is a Vite-built React SPA also deployed to Vercel.

```text
caresync/
├── backend/          # Express.js REST API (Node.js)
│   └── src/
│       ├── config/   # Dual-DB connection, rate limiter
│       ├── controllers/
│       ├── models/   # Sequelize ORM models
│       ├── routes/
│       ├── services/ # Enhanced PDF, Auth, Prescription Parsing
│       └── utils/
├── frontend/         # React + TypeScript SPA (Vite)
│   ├── android/      # Capacitor Android build
│   └── src/
│       ├── features/ # Feature-based structure (showcase, medications, etc)
│       └── shared/   # Zustand stores, Supabase Realtime client
└── supabase-schema.sql
```

---

## 🛡 Security Model

1. **Transport**: HTTPS enforced, HSTS headers via `helmet`.
2. **WebSocket CSRF Immunity**: High-frequency syncs bypass standard HTTP, utilizing Supabase channel authentication to remain immune to Cross-Site Request Forgery.
3. **Data Encryption**: Field-level AES encryption for PII columns via `sequelize-encrypted`.
4. **Consent**: Granular consent model with an immutable, append-only audit trail.
5. **2FA**: TOTP-based (Google Authenticator compatible) with recovery codes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL (or a Supabase project)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL, JWT secrets, encryption keys
npm install
npm run dev
```

### Frontend Setup
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
MIT © CareSync Team