// frontend/src/features/showcase/pages/PrivacyPolicyPage.tsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Clock,
  Database,
  Users,
  FileText,
  Globe,
  Cookie,
  Baby,
  Bell,
  Mail,
  Scale,
  Server,
  KeyRound,
  Activity,
  Smartphone,
  HeartPulse,
  Fingerprint,
  ExternalLink,
} from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

/* ════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════ */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */
const SectionCard = ({
  id,
  icon: Icon,
  number,
  title,
  children,
}: {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  number: string
  title: string
  children: React.ReactNode
}) => (
  <motion.section
    id={id}
    variants={sectionVariants}
    className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-6 sm:p-8"
  >
    <div className="flex items-start gap-4 mb-6">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
        <Icon size={20} className="text-brand-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest mb-1">
          Section {number}
        </p>
        <h2 className="text-lg sm:text-xl font-bold text-text-main leading-tight">{title}</h2>
      </div>
    </div>
    <div className="h-px bg-brand-primary/20 mb-6" />
    <div className="prose-sm text-text-muted leading-relaxed space-y-4">{children}</div>
  </motion.section>
)

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-text-main mt-6 mb-2">{children}</h3>
)

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 text-sm text-text-muted">
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary/60 shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)

const LegalBadge = ({ article, children }: { article: string; children: React.ReactNode }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-hover/50 border border-border-subtle/30">
    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 mt-0.5">
      {article}
    </span>
    <span className="text-sm text-text-muted">{children}</span>
  </div>
)

const RightItem = ({
  article,
  title,
  description,
}: {
  article: string
  title: string
  description: string
}) => (
  <div className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-1">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
        {article}
      </span>
      <span className="text-sm font-semibold text-text-main">{title}</span>
    </div>
    <p className="text-xs text-text-muted leading-relaxed">{description}</p>
  </div>
)

/* ════════════════════════════════════════════════════════════════
   TABLE OF CONTENTS
════════════════════════════════════════════════════════════════ */
const tocItems = [
  { id: 'introduction', label: '1. Introduction & Data Controller' },
  { id: 'data-collected', label: '2. Data We Collect' },
  { id: 'legal-bases', label: '3. Legal Bases Under GDPR' },
  { id: 'data-usage', label: '4. How We Use Your Data' },
  { id: 'data-retention', label: '5. Data Retention' },
  { id: 'data-security', label: '6. Data Storage & Security' },
  { id: 'data-sharing', label: '7. Data Sharing & Third Parties' },
  { id: 'your-rights', label: '8. Your Rights Under GDPR' },
  { id: 'cookies', label: '9. Cookies & Local Storage' },
  { id: 'children', label: "10. Children's Data" },
  { id: 'transfers', label: '11. International Transfers' },
  { id: 'changes', label: '12. Changes to This Policy' },
  { id: 'contact', label: '13. Contact Information' },
]

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
export const PrivacyPolicyPage = () => {
  const { theme: _theme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Privacy Policy — CareSync'
  }, [])

  return (
    <div className="h-dvh overflow-y-auto bg-bg-page">
      {/* ── STANDARDIZED Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-bg-page/80 backdrop-blur-xl border-b border-border-subtle/50">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors group shrink-0"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="h-5 w-px bg-border-subtle shrink-0" />
          
          <div className="flex items-center gap-2 min-w-0">
            <Shield size={18} className="text-brand-primary shrink-0" />
            <h1 className="text-sm font-bold text-text-main truncate">Privacy Policy</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <Link
              to="/terms"
              className="text-xs text-text-muted hover:text-brand-primary transition-colors hidden sm:inline"
            >
              Terms of Service
            </Link>
            <Link
              to="/status"
              className="text-xs text-text-muted hover:text-brand-primary transition-colors hidden sm:inline"
            >
              System Status
            </Link>
          </div>
        </div>
      </header>

      {/* ── Background decorations ── */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-brand-primary/[0.03] rounded-full blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[500px] bg-brand-primary/[0.02] rounded-full blur-[120px]" />

      {/* ── Main Content ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero / Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 mb-6">
            <Shield size={32} className="text-brand-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-main tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
            CareSync is committed to protecting your personal data. This Privacy Policy explains how we collect,
            use, store, and safeguard your information in compliance with the General Data Protection Regulation
            (GDPR) — Regulation (EU) 2016/679.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              Effective: May 29, 2026
            </span>
            <span className="text-border-subtle">|</span>
            <span className="flex items-center gap-1.5">
              <FileText size={12} />
              Version 1.0
            </span>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-6 sm:p-8 mb-10"
        >
          <h2 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
            <FileText size={16} className="text-brand-primary" />
            Table of Contents
          </h2>
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm text-text-muted hover:text-brand-primary transition-colors py-1 flex items-center gap-2 group"
              >
                <span className="w-1 h-1 rounded-full bg-border-subtle group-hover:bg-brand-primary transition-colors" />
                {item.label}
              </a>
            ))}
          </nav>
        </motion.div>

        {/* ── Policy Sections ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ──────── 1. Introduction & Data Controller ──────── */}
          <SectionCard id="introduction" icon={Shield} number="01" title="Introduction & Data Controller">
            <p className="text-sm">
              CareSync is a healthcare ecosystem developed at the{' '}
              <strong className="text-text-main">Universidade de Aveiro</strong>, Portugal, as part of an
              academic research and innovation project. CareSync provides a mobile and web application
              integrated with IoT devices (CareBox and CareBand) for medication management, adherence
              tracking, and patient-caregiver communication.
            </p>
            <p className="text-sm">
              For the purposes of the GDPR, the data controller is:
            </p>
            <div className="p-4 rounded-lg bg-bg-hover/50 border border-border-subtle/30 space-y-1.5 text-sm">
              <p className="font-semibold text-text-main">CareSync — Universidade de Aveiro</p>
              <p>Campus Universitário de Santiago, 3810-193 Aveiro, Portugal</p>
              <p>
                Email:{' '}
                <span className="font-mono text-xs bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded">
                  franciscoluis@ua.pt
                </span>
              </p>
            </div>
            <p className="text-sm">
              This Privacy Policy applies to all users of the CareSync platform, including patients,
              caregivers, and healthcare providers accessing our services through the mobile application,
              web application, or connected IoT devices.
            </p>
          </SectionCard>

          {/* ──────── 2. Data We Collect ──────── */}
          <SectionCard id="data-collected" icon={Database} number="02" title="Data We Collect">
            <p className="text-sm">
              We collect and process the following categories of personal data, each serving a specific
              purpose within the CareSync ecosystem:
            </p>

            <SubHeading>Account & Identity Data</SubHeading>
            <BulletList
              items={[
                'Full name, email address, and profile information',
                'User role classification (patient, caregiver, or healthcare provider)',
                'Account preferences, language, and notification settings',
              ]}
            />

            <SubHeading>Health & Medication Data (Special Category — Art. 9)</SubHeading>
            <BulletList
              items={[
                'Medication names, active substances, dosages, and pharmaceutical forms',
                'Prescribed schedules, frequencies, and treatment durations',
                'Adherence logs: timestamps of confirmed and missed doses',
                'Medication interaction alerts and clinical notes shared by healthcare providers',
              ]}
            />

            <SubHeading>IoT Device Telemetry</SubHeading>
            <BulletList
              items={[
                'CareBox: dispensing events (compartment opened/closed), carousel position, sensor readings, device status and connectivity logs',
                'CareBand: notification delivery confirmations, haptic feedback events, BLE connection status, and battery level',
                'Device firmware version, hardware identifiers, and diagnostic data',
              ]}
            />

            <SubHeading>Usage & Analytics Data</SubHeading>
            <BulletList
              items={[
                'Application interactions: screens visited, features used, and user flows',
                'Error logs, crash reports, and performance metrics',
                'Session duration and frequency of application use',
              ]}
            />

            <SubHeading>Authentication & Security Data</SubHeading>
            <BulletList
              items={[
                'Hashed passwords (bcrypt with salt — we never store plaintext passwords)',
                'Session tokens (JWT), refresh tokens, and login timestamps',
                'IP addresses associated with authentication events',
              ]}
            />

            <SubHeading>Device Information</SubHeading>
            <BulletList
              items={[
                'Device type, manufacturer, and model',
                'Operating system and version',
                'Application version and build number',
              ]}
            />
          </SectionCard>

          {/* ──────── 3. Legal Bases Under GDPR ──────── */}
          <SectionCard id="legal-bases" icon={Scale} number="03" title="Legal Bases Under GDPR">
            <p className="text-sm">
              We process your personal data only when we have a valid legal basis to do so under the GDPR.
              The specific legal bases we rely upon are:
            </p>
            <div className="space-y-3 mt-4">
              <LegalBadge article="Art. 6(1)(b)">
                <strong className="text-text-main">Contract Performance</strong> — Processing necessary to
                deliver the core CareSync service: managing your medication schedules, enabling caregiver
                communication, processing IoT device interactions, and maintaining your account.
              </LegalBadge>
              <LegalBadge article="Art. 6(1)(a)">
                <strong className="text-text-main">Consent</strong> — For optional processing such as
                analytics data collection, personalized recommendations, marketing communications, and
                non-essential notifications. You may withdraw consent at any time.
              </LegalBadge>
              <LegalBadge article="Art. 6(1)(f)">
                <strong className="text-text-main">Legitimate Interests</strong> — For security monitoring,
                fraud prevention, debugging, service improvement, and ensuring the reliability and safety of
                the platform. We have conducted balancing tests to ensure your rights are not overridden.
              </LegalBadge>
              <LegalBadge article="Art. 9(2)(a)">
                <strong className="text-text-main">Explicit Consent for Health Data</strong> — Health and
                medication data constitute special category data under the GDPR. We process this data only
                with your explicit, informed consent obtained during registration. This consent is
                granular, specific, and can be revoked at any time.
              </LegalBadge>
            </div>
          </SectionCard>

          {/* ──────── 4. How We Use Your Data ──────── */}
          <SectionCard id="data-usage" icon={Activity} number="04" title="How We Use Your Data">
            <p className="text-sm">
              Your personal data is used exclusively for the following purposes:
            </p>

            <SubHeading>Core Service Delivery</SubHeading>
            <BulletList
              items={[
                'Managing and displaying your medication schedules across devices',
                'Triggering CareBox dispensing events and CareBand notifications at scheduled times',
                'Recording adherence data (taken/missed doses) and generating adherence reports',
                'Enabling real-time communication between patients and caregivers',
                'Synchronizing data across your mobile app, web dashboard, and IoT devices',
              ]}
            />

            <SubHeading>Safety & Clinical Support</SubHeading>
            <BulletList
              items={[
                'Alerting caregivers and healthcare providers to missed doses or irregular patterns',
                'Detecting potential medication interactions based on your active prescriptions',
                'Providing healthcare providers with anonymized adherence analytics for treatment optimization',
              ]}
            />

            <SubHeading>Platform Improvement</SubHeading>
            <BulletList
              items={[
                'Analyzing aggregated, anonymized usage patterns to improve user experience',
                'Identifying and fixing bugs, crashes, and performance issues',
                'Developing new features based on usage trends (with consent)',
              ]}
            />

            <SubHeading>Security & Compliance</SubHeading>
            <BulletList
              items={[
                'Authenticating users and managing secure sessions',
                'Detecting and preventing unauthorized access, fraud, and abuse',
                'Maintaining audit logs for regulatory compliance',
                'Responding to lawful data access requests from authorities',
              ]}
            />
          </SectionCard>

          {/* ──────── 5. Data Retention ──────── */}
          <SectionCard id="data-retention" icon={Clock} number="05" title="Data Retention">
            <p className="text-sm">
              We retain your personal data only for as long as necessary to fulfill the purposes for which
              it was collected, or as required by applicable law. The specific retention periods are:
            </p>

            <div className="overflow-x-auto mt-4 -mx-2 px-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="text-left py-3 px-3 text-xs font-bold text-text-main uppercase tracking-wider">
                      Data Category
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-text-main uppercase tracking-wider">
                      Retention Period
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-text-main uppercase tracking-wider hidden sm:table-cell">
                      Justification
                    </th>
                  </tr>
                </thead>
                <tbody className="text-text-muted">
                  {[
                    {
                      category: 'Account data',
                      period: 'Duration of account + 30 days',
                      justification: 'Service delivery; grace period for reactivation',
                    },
                    {
                      category: 'Health & medication data',
                      period: 'Duration of account + 90 days',
                      justification: 'Clinical continuity; regulatory obligations',
                    },
                    {
                      category: 'Adherence logs',
                      period: '24 months from creation',
                      justification: 'Treatment analysis and reporting',
                    },
                    {
                      category: 'IoT telemetry',
                      period: '12 months',
                      justification: 'Device diagnostics and service reliability',
                    },
                    {
                      category: 'Usage analytics',
                      period: '12 months (anonymized)',
                      justification: 'Product improvement; anonymized after collection',
                    },
                    {
                      category: 'Authentication logs',
                      period: '6 months',
                      justification: 'Security monitoring and fraud detection',
                    },
                    {
                      category: 'Security audit logs',
                      period: '36 months',
                      justification: 'Regulatory compliance and incident investigation',
                    },
                    {
                      category: 'Error/crash reports',
                      period: '6 months',
                      justification: 'Debugging and service stability',
                    },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-border-subtle/50 hover:bg-bg-hover/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-text-main text-xs">{row.category}</td>
                      <td className="py-2.5 px-3 text-xs font-mono">{row.period}</td>
                      <td className="py-2.5 px-3 text-xs hidden sm:table-cell">{row.justification}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm mt-4">
              Upon account deletion, all personal data is permanently erased within the specified grace
              periods. Anonymized aggregate data may be retained indefinitely for statistical purposes, as
              it no longer constitutes personal data under the GDPR.
            </p>
          </SectionCard>

          {/* ──────── 6. Data Storage & Security ──────── */}
          <SectionCard id="data-security" icon={Lock} number="06" title="Data Storage & Security">
            <p className="text-sm">
              We implement industry-standard technical and organizational measures to protect your personal
              data against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <SubHeading>Infrastructure</SubHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  icon: Database,
                  title: 'Supabase (PostgreSQL)',
                  desc: 'Primary database hosted on EU-based infrastructure, providing GDPR-compliant data residency.',
                },
                {
                  icon: KeyRound,
                  title: 'Row Level Security (RLS)',
                  desc: 'Database-level access policies ensuring users can only access data they are authorized to view.',
                },
                {
                  icon: Fingerprint,
                  title: 'JWT Authentication',
                  desc: 'Stateless, token-based authentication with short-lived access tokens (15min) and rotating refresh tokens.',
                },
                {
                  icon: Lock,
                  title: 'AES-256 Encryption',
                  desc: 'Field-level encryption for all sensitive health data at rest, with keys managed via secure environment isolation.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <item.icon size={14} className="text-brand-primary" />
                    <span className="text-xs font-bold text-text-main">{item.title}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <SubHeading>Data in Transit</SubHeading>
            <BulletList
              items={[
                'All data transmitted between clients and servers is encrypted using HTTPS/TLS 1.2+ protocols',
                'IoT device communications use encrypted BLE channels and secure MQTT/WebSocket connections',
                'Certificate pinning is implemented in the mobile application to prevent man-in-the-middle attacks',
              ]}
            />

            <SubHeading>Operational Security</SubHeading>
            <BulletList
              items={[
                'Regular security audits and vulnerability assessments',
                'Principle of least privilege applied across all system components',
                'Automated dependency scanning for known vulnerabilities',
                'Incident response procedures with defined escalation paths',
              ]}
            />
          </SectionCard>

          {/* ──────── 7. Data Sharing & Third Parties ──────── */}
          <SectionCard id="data-sharing" icon={Users} number="07" title="Data Sharing & Third Parties">
            <p className="text-sm">
              We do not sell, rent, or trade your personal data to any third party. Data sharing is limited
              to the following essential service providers, all of which are bound by data processing
              agreements compliant with GDPR Article 28:
            </p>

            <div className="space-y-3 mt-4">
              {[
                {
                  name: 'Supabase',
                  role: 'Database & Authentication Provider',
                  data: 'Account data, encrypted health data, authentication tokens',
                  location: 'EU (Frankfurt, Germany)',
                },
                {
                  name: 'Vercel',
                  role: 'Web Application Hosting',
                  data: 'Static assets, server-side rendering; no persistent personal data storage',
                  location: 'EU edge nodes',
                },
              ].map((provider, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-text-main">{provider.name}</span>
                    <span className="text-[10px] font-mono text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {provider.location}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    <strong>Role:</strong> {provider.role}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    <strong>Data shared:</strong> {provider.data}
                  </p>
                </div>
              ))}
            </div>

            <SubHeading>Law Enforcement & Legal Obligations</SubHeading>
            <p className="text-sm">
              We may disclose personal data to law enforcement authorities or regulatory bodies only when
              legally required to do so by a binding court order or applicable EU/Portuguese law. We will
              notify you of such disclosure unless legally prohibited from doing so.
            </p>

            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 mt-4">
              <p className="text-sm text-text-main font-semibold flex items-center gap-2">
                <Shield size={14} className="text-green-500" />
                No-Sale Guarantee
              </p>
              <p className="text-xs text-text-muted mt-1">
                CareSync will never sell your personal data or health information to advertisers,
                data brokers, or any other third party for commercial purposes.
              </p>
            </div>
          </SectionCard>

          {/* ──────── 8. Your Rights Under GDPR ──────── */}
          <SectionCard id="your-rights" icon={Eye} number="08" title="Your Rights Under GDPR">
            <p className="text-sm">
              As a data subject under the GDPR, you have the following rights regarding your personal data.
              You may exercise any of these rights by contacting our Data Protection Officer at the address
              provided in Section 13.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <RightItem
                article="Art. 15"
                title="Right of Access"
                description="Request a copy of all personal data we hold about you, along with details of how it is processed."
              />
              <RightItem
                article="Art. 16"
                title="Right to Rectification"
                description="Request correction of any inaccurate or incomplete personal data we hold about you."
              />
              <RightItem
                article="Art. 17"
                title="Right to Erasure"
                description='Request the deletion of your personal data ("right to be forgotten") when it is no longer necessary for the original purpose.'
              />
              <RightItem
                article="Art. 18"
                title="Right to Restriction"
                description="Request that we restrict the processing of your data in certain circumstances, such as while a rectification request is pending."
              />
              <RightItem
                article="Art. 20"
                title="Right to Data Portability"
                description="Receive your personal data in a structured, commonly used, machine-readable format (JSON/CSV) and transmit it to another controller."
              />
              <RightItem
                article="Art. 21"
                title="Right to Object"
                description="Object to processing based on legitimate interests. We will cease processing unless we demonstrate compelling legitimate grounds."
              />
            </div>

            <SubHeading>Withdrawing Consent</SubHeading>
            <p className="text-sm">
              Where processing is based on consent (Art. 6(1)(a) or Art. 9(2)(a)), you have the right to
              withdraw your consent at any time. Withdrawal does not affect the lawfulness of processing
              carried out before withdrawal. You can withdraw consent through your account settings or by
              contacting our DPO.
            </p>

            <SubHeading>Right to Lodge a Complaint</SubHeading>
            <p className="text-sm">
              If you believe your data protection rights have been violated, you have the right to lodge a
              complaint with the Portuguese Data Protection Authority:
            </p>
            <div className="p-4 rounded-lg bg-bg-hover/50 border border-border-subtle/30 space-y-1.5 text-sm mt-2">
              <p className="font-semibold text-text-main">
                CNPD — Comissão Nacional de Proteção de Dados
              </p>
              <p className="text-xs text-text-muted">Av. D. Carlos I, 134 — 1.º, 1200-651 Lisboa, Portugal</p>
              <a
                href="https://www.cnpd.pt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-primary hover:underline inline-flex items-center gap-1"
              >
                www.cnpd.pt <ExternalLink size={10} />
              </a>
            </div>

            <SubHeading>Response Timeline</SubHeading>
            <p className="text-sm">
              We will respond to all data subject requests within <strong className="text-text-main">30 calendar days</strong> of
              receipt. If a request is particularly complex, we may extend this period by an additional 60
              days, and will inform you of the extension and the reasons for it within the initial 30-day period.
            </p>
          </SectionCard>

          {/* ──────── 9. Cookies & Local Storage ──────── */}
          <SectionCard id="cookies" icon={Cookie} number="09" title="Cookies & Local Storage">
            <p className="text-sm">
              CareSync minimizes the use of cookies and browser storage technologies. We do not use
              third-party tracking cookies or advertising pixels.
            </p>

            <div className="space-y-3 mt-4">
              {[
                {
                  name: 'JWT Session Token',
                  storage: 'localStorage',
                  purpose: 'Maintaining your authenticated session across page reloads',
                  duration: 'Until logout or token expiry',
                  essential: true,
                },
                {
                  name: 'Theme Preference',
                  storage: 'localStorage',
                  purpose: 'Remembering your light/dark/system theme selection',
                  duration: 'Persistent until cleared',
                  essential: true,
                },
                {
                  name: 'Language Preference',
                  storage: 'localStorage',
                  purpose: 'Storing your selected interface language',
                  duration: 'Persistent until cleared',
                  essential: true,
                },
              ].map((cookie, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-bg-hover/30 border border-border-subtle/30 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-text-main">{cookie.name}</span>
                      {cookie.essential && (
                        <span className="text-[9px] font-mono bg-green-500/10 text-green-500 border border-green-500/20 px-1.5 py-0.5 rounded uppercase">
                          Essential
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{cookie.purpose}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted font-mono shrink-0">
                    <span className="bg-bg-hover px-2 py-0.5 rounded">{cookie.storage}</span>
                    <span>{cookie.duration}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 mt-4">
              <p className="text-sm text-text-main font-semibold flex items-center gap-2">
                <Cookie size={14} className="text-blue-500" />
                No Third-Party Tracking
              </p>
              <p className="text-xs text-text-muted mt-1">
                CareSync does not use Google Analytics, Facebook Pixel, or any other third-party tracking
                technology. Your browsing behavior is never shared with advertisers.
              </p>
            </div>
          </SectionCard>

          {/* ──────── 10. Children's Data ──────── */}
          <SectionCard id="children" icon={Baby} number="10" title="Children's Data">
            <p className="text-sm">
              In accordance with <strong className="text-text-main">Article 8 of the GDPR</strong> and Portuguese
              national law (Lei n.º 58/2019), CareSync does not knowingly collect or process personal data
              from children under the age of <strong className="text-text-main">16 years</strong>.
            </p>
            <p className="text-sm">
              If a child under 16 requires medication management through CareSync, their account must be
              created and managed by a parent or legal guardian who provides consent on their behalf. The
              parent or guardian assumes full responsibility for the child's data and has full access to
              exercise data subject rights on the child's behalf.
            </p>
            <p className="text-sm">
              If we become aware that we have inadvertently collected personal data from a child under 16
              without appropriate parental consent, we will take immediate steps to delete that data and
              terminate the associated account.
            </p>
          </SectionCard>

          {/* ──────── 11. International Transfers ──────── */}
          <SectionCard id="transfers" icon={Globe} number="11" title="International Transfers">
            <p className="text-sm">
              CareSync is designed and operated to keep your personal data within the{' '}
              <strong className="text-text-main">European Union / European Economic Area (EU/EEA)</strong>.
            </p>

            <div className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <Server size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-text-main">Database Infrastructure</p>
                  <p className="text-xs text-text-muted">
                    Our Supabase PostgreSQL instance is hosted in the EU (Frankfurt, Germany), ensuring
                    all stored personal data remains within EU/EEA jurisdiction.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-text-main">Edge Computing</p>
                  <p className="text-xs text-text-muted">
                    Web application hosting through Vercel utilizes EU edge nodes for content delivery.
                    No personal data is persistently stored outside the EU.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm mt-4">
              In the unlikely event that a future service provider requires data transfer outside the
              EU/EEA, we will ensure that appropriate safeguards are in place, such as EU Standard
              Contractual Clauses (SCCs) or an adequacy decision by the European Commission, before any
              transfer occurs. We will update this policy accordingly.
            </p>
          </SectionCard>

          {/* ──────── 12. Changes to This Policy ──────── */}
          <SectionCard id="changes" icon={Bell} number="12" title="Changes to This Policy">
            <p className="text-sm">
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. When we make changes:
            </p>
            <BulletList
              items={[
                'Material changes will be communicated via in-app notification and email to all registered users at least 30 days before taking effect.',
                'The "Effective Date" and version number at the top of this document will be updated.',
                'A changelog summarizing the modifications will be maintained.',
                'Continued use of CareSync after the effective date constitutes acceptance of the updated policy. If you disagree with any changes, you may exercise your right to erasure (Art. 17).',
              ]}
            />
            <p className="text-sm mt-4">
              Previous versions of this policy will be archived and available upon request.
            </p>
          </SectionCard>

          {/* ──────── 13. Contact Information ──────── */}
          <SectionCard id="contact" icon={Mail} number="13" title="Contact Information">
            <p className="text-sm">
              If you have any questions about this Privacy Policy, wish to exercise your data subject
              rights, or need to report a data protection concern, please contact us through any of the
              following channels:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-2">
                <p className="text-xs font-bold text-text-main flex items-center gap-2">
                  <Shield size={12} className="text-brand-primary" />
                  Data Protection Officer
                </p>
                <p className="text-xs text-text-muted">
                  Email:{' '}
                  <span className="font-mono bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded">
                    franciscoluis@ua.pt
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-2">
                <p className="text-xs font-bold text-text-main flex items-center gap-2">
                  <HeartPulse size={12} className="text-brand-primary" />
                  General Inquiries
                </p>
                <p className="text-xs text-text-muted">
                  Email:{' '}
                  <span className="font-mono bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded">
                    franciscoluis@ua.pt
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-bg-hover/30 border border-border-subtle/30 space-y-2 mt-4">
              <p className="text-xs font-bold text-text-main flex items-center gap-2">
                <Smartphone size={12} className="text-brand-primary" />
                Mailing Address
              </p>
              <p className="text-xs text-text-muted">
                CareSync — Universidade de Aveiro
                <br />
                Departamento de Eletrónica, Telecomunicações e Informática (DETI)
                <br />
                Campus Universitário de Santiago
                <br />
                3810-193 Aveiro, Portugal
              </p>
            </div>
          </SectionCard>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border-subtle/50 bg-bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-brand-primary" />
              <span className="text-sm font-bold text-text-main">CareSync</span>
              <span className="text-xs text-text-muted">
                © {new Date().getFullYear()} Universidade de Aveiro
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <Link to="/terms" className="hover:text-brand-primary transition-colors">
                Terms of Service
              </Link>
              <span className="text-border-subtle">·</span>
              <Link to="/status" className="hover:text-brand-primary transition-colors">
                System Status
              </Link>
              <span className="text-border-subtle">·</span>
              <Link to="/" className="hover:text-brand-primary transition-colors">
                Home
              </Link>
            </div>
          </div>
          <p className="text-[10px] text-text-muted/60 text-center sm:text-left mt-4">
            This Privacy Policy was last updated on May 29, 2026. It applies to the CareSync platform
            (web, mobile, and IoT components) operated by the CareSync project at Universidade de Aveiro, Portugal.
          </p>
        </div>
      </footer>
    </div>
  )
}