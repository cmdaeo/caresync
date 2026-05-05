# CareSync — Security Overview

**For Partners, Auditors, and Stakeholders**
**Last Updated:** May 2026

---

## 1. Architecture Principles

CareSync is built on a **zero-trust security architecture** where every request is authenticated, authorized, and validated regardless of its origin. The system follows defense-in-depth principles with multiple independent security layers.

### 1.1 Technology Stack
- **Backend:** Node.js/Express on Vercel serverless (auto-scaling, no persistent server state)
- **Database:** Supabase PostgreSQL (EU region, managed infrastructure)
- **Frontend:** React SPA with strict Content Security Policy
- **Transport:** TLS 1.2+ enforced on all connections

---

## 2. Authentication & Session Management

| Control | Implementation |
|---------|---------------|
| **Password storage** | bcrypt with cost factor 12 (OWASP recommended) |
| **Access tokens** | JWT with 15-minute expiry, HMAC-SHA256 signed |
| **Refresh tokens** | 30-day expiry, stored as bcrypt hash in DB, delivered via HttpOnly/Secure/SameSite=Strict cookie |
| **Token versioning** | Password changes invalidate all existing sessions globally |
| **2FA** | TOTP-based (RFC 6238) with 10 single-use recovery codes |
| **Brute-force protection** | 10 attempts per 15 minutes on login, 5 attempts on 2FA |
| **Password reset** | SHA-256 hashed tokens, 15-minute expiry, email enumeration resistant |

---

## 3. Authorization

- **Role-Based Access Control (RBAC):** Four roles (patient, caregiver, healthcare_provider, admin) with strictly scoped permissions
- **Relationship-based access:** Caregivers can only access data for patients who have explicitly invited and verified them
- **Least privilege:** Healthcare providers require explicit patient relationships (no blanket access)
- **Backend enforcement:** All authorization decisions are made server-side; frontend guards are UX-only

---

## 4. Data Protection

### 4.1 Encryption
- **In transit:** TLS 1.2+ on all connections
- **At rest (PII):** AES-256 field-level encryption on email, name, phone via `sequelize-encrypted`
- **At rest (audit logs):** AES-256-CBC encryption on old/new value payloads
- **At rest (database):** Supabase manages disk-level encryption

### 4.2 Data Classification
| Category | Examples | Protection Level |
|----------|---------|-----------------|
| PII | Name, email, phone, DOB | Field-level AES-256 encryption |
| Medical | Medications, adherence, prescriptions | Application-level access control |
| Security | Passwords, 2FA secrets, tokens | Hashed (bcrypt) / encrypted / never logged |
| Audit | User actions, IP addresses | Encrypted payloads, append-only |

---

## 5. Application Security

| Control | Details |
|---------|---------|
| **CSRF protection** | HMAC-signed tokens with 1-hour expiry, timing-safe comparison |
| **Content Security Policy** | Restrictive CSP via Helmet (no inline scripts, explicit font/image sources) |
| **CORS** | Strict origin whitelist with credentials |
| **Rate limiting** | Global (200/15min), auth (10/15min), 2FA (5/15min), reports (20/hr) |
| **Input validation** | express-validator on all endpoints, custom time-travel guards on adherence |
| **Error handling** | Structured error classes, no stack traces in production |
| **HTTP headers** | Helmet security headers (X-Frame-Options, X-Content-Type-Options, etc.) |

---

## 6. Logging & Monitoring

- **Structured logging:** Winston with JSON format, service metadata
- **PII scrubbing:** Automatic regex-based redaction of emails, phone numbers, JWTs in all log output
- **Header sanitization:** Authorization, Cookie, API key headers replaced with `[REDACTED]`
- **Request body sanitization:** Passwords, tokens, secrets redacted before logging
- **Audit trail:** All security-relevant actions logged with encrypted payloads (CNPD-58/2019 compliance)

---

## 7. GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Consent management** | 7 granular consent types, append-only consent log, grant/revoke API |
| **Right to access** (Art. 15) | Profile view, report generation, consent history |
| **Right to rectification** (Art. 16) | Profile editing API |
| **Right to erasure** (Art. 17) | Account deletion: medical data purged, PII anonymized, in a transactional two-phase process |
| **Data portability** (Art. 20) | PDF report generation with medication history |
| **Privacy by design** (Art. 25) | Field-level encryption, minimal data collection, RBAC |
| **Records of processing** (Art. 30) | Encrypted audit logs with compliance metadata |
| **Data breach procedures** | Audit logging enables forensic analysis; breach notification is a documented operational procedure |

---

## 8. HIPAA Readiness

While CareSync is primarily designed for EU/GDPR compliance, the following controls align with HIPAA requirements:

- **Access controls** (§164.312(a)): RBAC with unique user identification
- **Audit controls** (§164.312(b)): Comprehensive encrypted audit logging
- **Integrity controls** (§164.312(c)): Input validation, document hash verification
- **Transmission security** (§164.312(e)): TLS on all connections
- **Encryption** (§164.312(a)(2)(iv)): AES-256 at rest for ePHI

> **Note:** Full HIPAA compliance requires additional administrative and physical safeguards beyond application-level controls (BAA with hosting providers, workforce training, etc.).

---

## 9. Incident Response

- Security events are captured in structured audit logs
- Failed authentication attempts are logged with IP address and user agent
- Rate limit violations trigger logging and temporary blocks
- Account deletion triggers a two-phase data purge with audit trail

---

## 10. Contact

For security inquiries or to report vulnerabilities:
- **Email:** security@caresync.com
- **DPO:** dpo@caresync.com
