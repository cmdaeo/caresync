# CareSync — Privacy Policy

**Last Updated:** May 2026
**Effective Date:** May 2026

---

## 1. Introduction

CareSync ("we", "us", "our") is a medication adherence and healthcare management platform designed to help patients track medications, connect with caregivers, and manage medical devices. We are committed to protecting your personal data in accordance with the **General Data Protection Regulation (EU) 2016/679 ("GDPR")** and applicable national data protection laws.

This Privacy Policy explains what personal data we collect, why we collect it, how we process it, how long we retain it, and what rights you have.

---

## 2. Data Controller

**CareSync Development Team**
Contact: privacy@caresync.com

For data protection inquiries, contact our Data Protection Officer at: dpo@caresync.com

---

## 3. Data We Collect

### 3.1 Identity Data (PII)
- Full name (first name, last name)
- Email address
- Phone number (optional)
- Date of birth (optional)
- Profile picture (optional)
- Emergency contact information

### 3.2 Health & Medical Data (Special Category Data)
- Medication details (names, dosages, frequencies, schedules)
- Medication adherence records (taken, missed, skipped doses)
- Prescription data (prescribed by, dates, refills)
- Medical device information (device IDs, battery status, sync data)
- Adherence reports and analytics

### 3.3 Account & Security Data
- Hashed passwords (bcrypt, never stored in plaintext)
- Two-factor authentication secrets (encrypted)
- Session tokens (JWT, refresh tokens)
- Consent records (what you agreed to, when)

### 3.4 Technical & Usage Data
- IP addresses (logged for security, redacted in long-term storage)
- User agent strings
- Request timestamps
- Audit trail of actions performed

---

## 4. Legal Basis for Processing

| Data Category | Legal Basis | GDPR Article |
|--------------|-------------|--------------|
| Identity data | Contract performance | Art. 6(1)(b) |
| Health/medical data | Explicit consent | Art. 9(2)(a) |
| Security data | Legitimate interest (security) | Art. 6(1)(f) |
| Usage/technical data | Legitimate interest (service improvement) | Art. 6(1)(f) |
| Consent records | Legal obligation | Art. 6(1)(c) |

We process health data **only with your explicit consent**, which you can grant or revoke at any time through the consent management interface in the application.

---

## 5. How We Use Your Data

- **Medication tracking:** To display your medication schedule, record adherence, and send reminders.
- **Caregiver sharing:** To allow authorized caregivers to monitor your adherence (only with your consent).
- **Report generation:** To create adherence reports for you and your healthcare providers.
- **Device management:** To pair and manage connected medical devices.
- **Security:** To authenticate you, prevent unauthorized access, and detect suspicious activity.
- **Compliance:** To maintain audit trails as required by healthcare regulations.

We **never** sell your data to third parties. We **never** use your health data for advertising.

---

## 6. Data Storage & Security

### 6.1 Where Your Data Is Stored
- **Database:** Supabase PostgreSQL (EU region, AWS eu-west-1)
- **Application hosting:** Vercel (global edge network, GDPR-compliant)

### 6.2 How We Protect Your Data
- **Encryption at rest:** PII fields (email, name, phone) are encrypted using AES-256 before storage
- **Encryption in transit:** All communications use TLS 1.2+
- **Password hashing:** bcrypt with cost factor 12
- **Audit log encryption:** Sensitive audit trail values are encrypted with AES-256-CBC
- **Access controls:** Role-based access control (RBAC) with least-privilege enforcement
- **CSRF protection:** HMAC-signed tokens on all state-changing requests
- **Rate limiting:** Aggressive limits on authentication endpoints
- **PII scrubbing:** Sensitive data (emails, phone numbers, tokens) are automatically redacted from application logs

---

## 7. Data Retention

| Data Type | Retention Period | Justification |
|-----------|-----------------|---------------|
| Active account data | Duration of account | Contract performance |
| Health/medical data | Duration of account | User consent |
| Audit logs | 7 years | Regulatory compliance |
| Consent records | 7 years after last action | Legal obligation (GDPR Art. 7) |
| Deleted accounts | Immediately anonymized | GDPR Art. 17 |

When you delete your account:
1. All medical data (medications, adherence, prescriptions, devices) is **permanently deleted**
2. Your identity is **anonymized** (name, email, phone replaced with non-identifying values)
3. Audit logs are retained with encrypted references for regulatory compliance

---

## 8. Data Sharing

We share your data only in the following circumstances:

- **With your caregivers:** Only data you have explicitly authorized via consent and caregiver invitation
- **Sub-processors:** Supabase (database hosting), Vercel (application hosting) — both under GDPR-compliant Data Processing Agreements
- **Legal obligations:** If required by law, court order, or regulatory authority

---

## 9. Your Rights (GDPR Articles 15–22)

You have the right to:

1. **Access** your personal data (Art. 15) — via your profile and report generation features
2. **Rectify** inaccurate data (Art. 16) — via profile editing
3. **Erase** your data (Art. 17) — via account deletion (immediate data purge + anonymization)
4. **Restrict processing** (Art. 18) — contact us to restrict specific processing activities
5. **Data portability** (Art. 20) — export your data via the reports feature
6. **Object** to processing (Art. 21) — contact us for processing based on legitimate interest
7. **Withdraw consent** (Art. 7) — via the consent management interface, at any time
8. **Not be subject to automated decision-making** (Art. 22) — we do not make automated decisions that produce legal effects

To exercise any of these rights, contact: privacy@caresync.com

---

## 10. Cookies

CareSync uses only essential cookies:

| Cookie | Purpose | Duration |
|--------|---------|----------|
| `_csrf` | CSRF protection token | 1 hour |
| `refreshToken` | Session persistence | 30 days |
| `caresync-auth` | Client-side auth state (localStorage) | Session |

We do **not** use tracking cookies, analytics cookies, or advertising cookies.

---

## 11. Children's Privacy

CareSync is not intended for use by individuals under the age of 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us immediately.

---

## 12. Changes to This Policy

We will notify you of material changes to this Privacy Policy via email and/or an in-app notification at least 30 days before the changes take effect.

---

## 13. Contact & Complaints

**Data Controller:** CareSync Development Team
**Email:** privacy@caresync.com
**DPO:** dpo@caresync.com

You also have the right to lodge a complaint with your national data protection authority (e.g., CNPD in Luxembourg, CNIL in France, ICO in the UK).
