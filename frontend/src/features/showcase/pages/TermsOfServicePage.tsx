// frontend/src/features/showcase/pages/TermsOfServicePage.tsx
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Scale,
  Shield,
  User,
  Lock,
  ClipboardList,
  Building,
  Ban,
  Brain,
  Cpu,
  UserX,
  RefreshCw,
  Gavel,
  Puzzle,
  Mail,
  ExternalLink,
  Heart,
} from 'lucide-react'
import { useTheme } from '../../../context/ThemeContext'

// -------------------- Animation Variants --------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// -------------------- Sub-Components --------------------

interface SectionCardProps {
  number: number
  title: string
  icon: React.ElementType
  children: React.ReactNode
  variant?: 'default' | 'warning'
}

const SectionCard = ({ number, title, icon: Icon, children, variant = 'default' }: SectionCardProps) => {
  const isWarning = variant === 'warning'

  return (
    <motion.section variants={sectionVariants} className="scroll-mt-24">
      <div
        className={`
          relative overflow-hidden rounded-xl border p-6 sm:p-8 transition-colors duration-300
          ${isWarning
            ? 'bg-amber-500/5 backdrop-blur-xl border-amber-500/40 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.1)]'
            : 'bg-bg-card/50 backdrop-blur-xl border-border-subtle/50 hover:border-border-subtle'
          }
        `}
      >
        {/* Warning accent stripe */}
        {isWarning && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500" />
        )}

        {/* Section header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-5">
          <div
            className={`
              shrink-0 flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold
              ${isWarning
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-brand-primary/10 text-brand-primary'
              }
            `}
          >
            {number}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Icon
              size={20}
              className={isWarning ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-brand-primary shrink-0'}
            />
            <h2
              className={`
                text-lg sm:text-xl font-bold leading-tight
                ${isWarning ? 'text-amber-700 dark:text-amber-300' : 'text-text-main'}
              `}
            >
              {title}
            </h2>
          </div>
        </div>

        {/* Section content */}
        <div className="pl-0 sm:pl-14 text-sm sm:text-base text-text-muted leading-relaxed space-y-3">
          {children}
        </div>
      </div>
    </motion.section>
  )
}

// -------------------- Main Page Component --------------------

export const TermsOfServicePage = () => {
  // Consume theme context as required
  useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Terms of Service — CareSync'
  }, [])

  return (
    <div className="h-dvh overflow-y-auto bg-bg-page">
      {/* ===== STANDARDIZED Sticky Header ===== */}
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
            <Scale size={18} className="text-brand-primary shrink-0" />
            <h1 className="text-sm font-bold text-text-main truncate">Terms of Service</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <Link
              to="/privacy"
              className="text-xs text-text-muted hover:text-brand-primary transition-colors hidden sm:inline"
            >
              Privacy Policy
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

      {/* ===== Main Content ===== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Intro block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <p className="text-text-muted text-sm sm:text-base leading-relaxed mb-2">
            <span className="font-semibold text-text-main">Effective Date:</span> May 29, 2026
          </p>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed">
            Welcome to CareSync. These Terms of Service ("Terms") govern your access to and use of the CareSync
            platform, including our web application, mobile applications, IoT devices (CareBox and CareBand), and all
            related services. Please read these Terms carefully before using our services.
          </p>
        </motion.div>

        {/* Sections */}
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* ---- 1. Acceptance of Terms ---- */}
          <SectionCard number={1} title="Acceptance of Terms" icon={FileText}>
            <p>
              By creating an account, accessing, or using any part of the CareSync platform — including the web
              dashboard, mobile application, CareBox device, or CareBand wearable — you acknowledge that you have
              read, understood, and agree to be bound by these Terms of Service and our{' '}
              <Link to="/privacy" className="text-brand-primary hover:underline font-medium">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the CareSync platform. Your continued
              use of the service after any modifications to these Terms constitutes acceptance of the updated Terms.
            </p>
            <p className="text-xs text-text-muted/70">
              These Terms were last updated on <span className="font-medium">May 29, 2026</span>.
            </p>
          </SectionCard>

          {/* ---- 2. Service Description ---- */}
          <SectionCard number={2} title="Service Description" icon={Heart}>
            <p>
              CareSync is a comprehensive healthcare management platform designed to improve medication adherence,
              patient-caregiver communication, and health data management. The platform comprises:
            </p>
            <ul className="list-none space-y-2.5 mt-3">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Web Dashboard</strong> — A browser-based application for
                  medication management, health data visualization, caregiver oversight, and device configuration.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Mobile Application</strong> — Native Android and iOS
                  applications for patients and caregivers, providing medication reminders, health tracking, and
                  real-time notifications.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">CareBox</strong> — An IoT-enabled medication dispensing device
                  that integrates with the CareSync platform to facilitate scheduled medication dispensing, adherence
                  tracking, and real-time status monitoring.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">CareBand</strong> — A wearable BLE (Bluetooth Low Energy)
                  notification device that delivers haptic and visual medication reminders directly to the user.
                </span>
              </li>
            </ul>
            <p className="mt-3">
              Together, these components facilitate medication scheduling, adherence tracking, caregiver-patient
              communication, and IoT device management within a unified healthcare ecosystem.
            </p>
          </SectionCard>

          {/* ---- 3. Medical Disclaimer (WARNING CARD) ---- */}
          <SectionCard number={3} title="Medical Disclaimer" icon={AlertTriangle} variant="warning">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  CareSync is NOT a substitute for professional medical advice, diagnosis, or treatment. Never
                  disregard or delay seeking professional medical advice because of information provided through the
                  CareSync platform.
                </p>
              </div>

              <ul className="list-none space-y-2.5">
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>
                    Users must <strong className="text-text-main">always consult qualified healthcare professionals</strong>{' '}
                    for medical decisions, including but not limited to starting, stopping, or modifying any
                    medication regimen.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>
                    Medication schedules, dosages, and health data entered into the platform are the{' '}
                    <strong className="text-text-main">sole responsibility of the user</strong> or their designated
                    caregiver. CareSync does not verify the accuracy or appropriateness of medication data.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>
                    CareSync <strong className="text-text-main">does not provide medical recommendations</strong>,
                    diagnoses, or treatment suggestions. The platform is a management and tracking tool only.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>
                    The CareBox and CareBand devices are assistive tools and are not certified medical devices. They
                    should not be relied upon as the sole mechanism for medication administration.
                  </span>
                </li>
              </ul>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="font-semibold text-red-600 dark:text-red-400">
                  In case of a medical emergency, contact your local emergency services (112 in the EU)
                  immediately. Do not rely on CareSync for emergency medical situations.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ---- 4. Eligibility ---- */}
          <SectionCard number={4} title="Eligibility" icon={User}>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  You must be at least <strong className="text-text-main">16 years of age</strong> to create an
                  account and use CareSync. This minimum age aligns with Portugal's age of digital consent under
                  Article 8 of the GDPR as implemented by Portuguese national law (Lei n.º 58/2019).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Users under 16 may only use the platform if a parent or legal guardian creates and manages the
                  account on their behalf, assuming full responsibility for the minor's use of the service.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  You must provide <strong className="text-text-main">accurate and complete registration
                  information</strong> and keep this information up to date.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Each individual may maintain only <strong className="text-text-main">one account</strong>.
                  Creating multiple accounts is prohibited and may result in suspension.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  EU residency is not strictly required; however, the service is optimized for users within the
                  European Union and complies primarily with EU regulations.
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 5. User Accounts & Security ---- */}
          <SectionCard number={5} title="User Accounts & Security" icon={Lock}>
            <p>
              When you create a CareSync account, you are responsible for maintaining the confidentiality and
              security of your account credentials. You agree to:
            </p>
            <ul className="list-none space-y-2.5 mt-3">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Use a <strong className="text-text-main">strong, unique password</strong> that you do not reuse
                  across other services. Passwords must meet the platform's minimum complexity requirements.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Never share your account credentials</strong> with any third
                  party. Caregiver access is provided through the platform's built-in caregiver linking features,
                  not through credential sharing.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Notify CareSync immediately</strong> if you become aware of
                  any unauthorized access or use of your account.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Accept responsibility for all activities that occur under your account, whether or not authorized
                  by you.
                </span>
              </li>
            </ul>
            <p className="mt-3">
              CareSync implements industry-standard security measures including JWT-based authentication, bcrypt
              password hashing, encrypted data storage, and rate-limited API endpoints to protect your account.
            </p>
          </SectionCard>

          {/* ---- 6. User Responsibilities ---- */}
          <SectionCard number={6} title="User Responsibilities" icon={ClipboardList}>
            <p>As a user of the CareSync platform, you agree to:</p>
            <ul className="list-none space-y-2.5 mt-3">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Provide <strong className="text-text-main">accurate health and medication data</strong>. The
                  effectiveness of CareSync depends on the accuracy of the information you provide.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Not use the platform for any <strong className="text-text-main">illegal, harmful, or
                  unauthorized</strong> purposes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Not attempt to <strong className="text-text-main">reverse-engineer, decompile, hack, or
                  disrupt</strong> the CareSync platform, its APIs, or its infrastructure.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Properly maintain and use</strong> CareBox and CareBand
                  devices according to the provided documentation and safety guidelines.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Keep the CareSync mobile application{' '}
                  <strong className="text-text-main">updated to the latest version</strong> to ensure access to
                  security patches and new features.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Report bugs and security vulnerabilities</strong> responsibly
                  through the appropriate channels rather than exploiting them.
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 7. CareSync's Responsibilities ---- */}
          <SectionCard number={7} title="CareSync's Responsibilities" icon={Building}>
            <p>CareSync commits to:</p>
            <ul className="list-none space-y-2.5 mt-3">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Making <strong className="text-text-main">reasonable efforts to maintain service
                  availability</strong> and minimize downtime. While we strive for high uptime, we do not guarantee
                  uninterrupted access. Service status is available at our{' '}
                  <Link to="/status" className="text-brand-primary hover:underline font-medium">
                    Status Page
                  </Link>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Protecting user data</strong> in accordance with our{' '}
                  <Link to="/privacy" className="text-brand-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
                  , the General Data Protection Regulation (GDPR), and applicable Portuguese data protection
                  legislation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Providing timely <strong className="text-text-main">security patches and software updates</strong>{' '}
                  to address known vulnerabilities and improve platform functionality.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Transparent communication</strong> regarding material changes
                  to the service, scheduled maintenance, and any incidents that may affect user data or service
                  availability.
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 8. Limitation of Liability ---- */}
          <SectionCard number={8} title="Limitation of Liability" icon={Ban}>
            <p>
              To the maximum extent permitted by applicable law, CareSync and its team members, affiliates, and
              partners shall not be held liable for:
            </p>
            <ul className="list-none space-y-2.5 mt-3">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Missed medication doses</strong> or failure of the CareBox to
                  dispense medication, whether due to device malfunction, connectivity issues, power failure, or
                  user error.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Health consequences</strong> arising from device malfunctions,
                  inaccurate data, or reliance on the platform for medication management without proper medical
                  oversight.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Incorrect data entered by users</strong>, including erroneous
                  medication names, dosages, schedules, or health information.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Service downtime or interruptions</strong>, whether scheduled
                  or unscheduled, including those caused by third-party infrastructure providers.
                </span>
              </li>
            </ul>
            <p className="mt-3">
              In any event, CareSync's total aggregate liability to you shall not exceed the total fees paid by you
              (if any) for use of the service during the twelve (12) months preceding the claim.
            </p>
            <p className="mt-2 font-medium text-text-main">
              Nothing in these Terms shall exclude or limit CareSync's liability for gross negligence, wilful
              misconduct, or any liability that cannot be excluded or limited under applicable law, including EU
              consumer protection regulations.
            </p>
          </SectionCard>

          {/* ---- 9. Intellectual Property ---- */}
          <SectionCard number={9} title="Intellectual Property" icon={Brain}>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  All CareSync branding, logos, source code, user interface designs, documentation, and content are
                  the intellectual property of the{' '}
                  <strong className="text-text-main">CareSync team / Universidade de Aveiro</strong> and are
                  protected by applicable intellectual property laws.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Users retain full ownership</strong> of their personal data,
                  health information, and any content they input into the platform. CareSync does not claim
                  ownership of user data.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  CareSync incorporates open-source software components, each governed by their respective licenses
                  (e.g., MIT, Apache 2.0). A full list of open-source dependencies and their licenses is available
                  in the project repository.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  The CareSync project source code is available at:{' '}
                  <a
                    href="https://github.com/cmdaeo/caresync"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-primary hover:underline font-medium"
                  >
                    github.com/cmdaeo/caresync
                    <ExternalLink size={12} />
                  </a>
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 10. IoT Device Terms ---- */}
          <SectionCard number={10} title="IoT Device Terms (CareBox & CareBand)" icon={Cpu}>
            <p>
              The following additional terms apply to users of CareSync's hardware devices:
            </p>

            <h3 className="text-text-main font-semibold mt-4 mb-2">Device Safety</h3>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  The CareBox must be placed on a stable, dry surface away from direct sunlight, moisture, and
                  extreme temperatures. Do not immerse in water or expose to liquids.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  The CareBand is designed for wrist wear. Do not disassemble, modify, or expose the device to
                  excessive force or extreme environmental conditions.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Both devices contain electronic components and batteries. Dispose of them in accordance with
                  local WEEE (Waste Electrical and Electronic Equipment) regulations.
                </span>
              </li>
            </ul>

            <h3 className="text-text-main font-semibold mt-4 mb-2">Maintenance & Updates</h3>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Users should regularly clean the CareBox's medication compartments and ensure the device has
                  adequate power supply and Wi-Fi connectivity.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">Firmware updates may be applied automatically</strong> via
                  over-the-air (OTA) updates when the device is connected to the internet. These updates may
                  include security patches, bug fixes, and feature improvements.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Tampering with device firmware, attempting to install unauthorized software, or modifying the
                  hardware voids any applicable warranty.
                </span>
              </li>
            </ul>

            <h3 className="text-text-main font-semibold mt-4 mb-2">Warranty & Returns</h3>
            <p className="text-text-muted/70 italic">
              PLACEHOLDER — Device warranty terms, coverage period, return/exchange policy, and conditions for
              warranty claims will be specified here upon commercial availability.
            </p>
          </SectionCard>

          {/* ---- 11. Account Termination ---- */}
          <SectionCard number={11} title="Account Termination" icon={UserX}>
            <h3 className="text-text-main font-semibold mb-2">Termination by You</h3>
            <p>
              You may delete your CareSync account at any time through the account settings in the web dashboard or
              mobile application. Upon deletion, your account will be deactivated and your personal data will be
              handled in accordance with our{' '}
              <Link to="/privacy" className="text-brand-primary hover:underline font-medium">
                Privacy Policy
              </Link>{' '}
              data retention schedule.
            </p>

            <h3 className="text-text-main font-semibold mt-4 mb-2">Termination by CareSync</h3>
            <p>CareSync reserves the right to suspend or terminate your account if:</p>
            <ul className="list-none space-y-2.5 mt-2">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>You violate these Terms of Service or engage in prohibited conduct.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  There are <strong className="text-text-main">security concerns</strong> related to your account,
                  including suspected unauthorized access or malicious activity.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Your account has been <strong className="text-text-main">inactive for an extended period</strong>{' '}
                  (as defined in the Privacy Policy retention schedule).
                </span>
              </li>
            </ul>
            <p className="mt-3">
              In all cases, CareSync will make reasonable efforts to notify you prior to suspension or termination,
              except where immediate action is necessary for security reasons.
            </p>
          </SectionCard>

          {/* ---- 12. Service Modifications ---- */}
          <SectionCard number={12} title="Service Modifications" icon={RefreshCw}>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  CareSync reserves the right to <strong className="text-text-main">modify, suspend, or
                  discontinue</strong> any features or services at any time, with or without notice, as necessary
                  for maintenance, security, or improvement purposes.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  For <strong className="text-text-main">material changes</strong> that significantly affect your
                  use of the platform — such as removal of core features, changes to data handling practices, or
                  introduction of fees — CareSync will provide advance notice through the application, email, or
                  both.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Your continued use of CareSync following notification of material changes constitutes your
                  acceptance of those changes. If you do not agree with the changes, you should discontinue use and
                  delete your account.
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 13. Governing Law & Jurisdiction ---- */}
          <SectionCard number={13} title="Governing Law & Jurisdiction" icon={Gavel}>
            <ul className="list-none space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  These Terms shall be governed by and construed in accordance with the{' '}
                  <strong className="text-text-main">laws of the Portuguese Republic</strong>, without regard to
                  conflict of law provisions.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  <strong className="text-text-main">EU consumer protection laws</strong> apply in full. Nothing in
                  these Terms affects your statutory rights as a consumer under EU Directive 2011/83/EU or other
                  applicable EU legislation.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  Any disputes arising from or relating to these Terms shall be subject to the exclusive
                  jurisdiction of the <strong className="text-text-main">courts of Portugal</strong> (Comarca de
                  Aveiro, unless otherwise determined by applicable consumer protection rules).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary" />
                <span>
                  EU residents may also submit complaints through the{' '}
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-primary hover:underline font-medium"
                  >
                    EU Online Dispute Resolution Platform
                    <ExternalLink size={12} />
                  </a>
                  .
                </span>
              </li>
            </ul>
          </SectionCard>

          {/* ---- 14. Severability ---- */}
          <SectionCard number={14} title="Severability" icon={Puzzle}>
            <p>
              If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of
              competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it
              valid and enforceable, or if modification is not possible, shall be severed from these Terms. The
              invalidity or unenforceability of any provision shall not affect the validity or enforceability of the
              remaining provisions, which shall continue in full force and effect.
            </p>
          </SectionCard>

          {/* ---- 15. Contact Information ---- */}
          <SectionCard number={15} title="Contact Information" icon={Mail}>
            <p>
              If you have any questions, concerns, or requests regarding these Terms of Service, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-bg-card/80 border border-border-subtle/50 space-y-3">
              <div className="flex items-start gap-3">
                <Building size={16} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium mb-0.5">
                    Organization
                  </p>
                  <p className="text-text-main font-medium">
                    CareSync — Universidade de Aveiro
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={16} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium mb-0.5">Email</p>
                  <p className="text-text-main font-medium">PLACEHOLDER</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={16} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium mb-0.5">
                    Data Protection Officer
                  </p>
                  <p className="text-text-main font-medium">PLACEHOLDER</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted/70 uppercase tracking-wider font-medium mb-0.5">
                    Mailing Address
                  </p>
                  <p className="text-text-main font-medium">PLACEHOLDER</p>
                  <p className="text-text-muted text-sm">Aveiro, Portugal</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </motion.div>
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border-subtle/50 bg-bg-card/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} CareSync — Universidade de Aveiro. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/privacy"
                className="text-xs text-text-muted hover:text-brand-primary transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <span className="text-border-subtle text-xs">•</span>
              <Link
                to="/status"
                className="text-xs text-text-muted hover:text-brand-primary transition-colors duration-200"
              >
                System Status
              </Link>
              <span className="text-border-subtle text-xs">•</span>
              <a
                href="https://github.com/cmdaeo/caresync"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-text-muted hover:text-brand-primary transition-colors duration-200 inline-flex items-center gap-1"
              >
                GitHub
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}