// frontend/src/features/showcase/pages/SecurityDeepDivePage.tsx
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Database,
  Terminal,
  Server,
  Fingerprint,
  FileKey,
  Eye,
  FileText,
  Globe,
  Cookie
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

/* ════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/* ════════════════════════════════════════════════════════════════
   COMPONENTS
════════════════════════════════════════════════════════════════ */
const SecurityCard = ({ title, icon: Icon, color, desc, children }: { title: string, icon: any, color: 'red' | 'emerald', desc: string, children: React.ReactNode }) => {
  const colorMap = {
    red: 'border-red-500/20 text-red-500 bg-red-500/10 hover:border-red-500/40 hover:bg-red-500/[0.02]',
    emerald: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]',
  };
  const bgHoverMap = {
    red: 'hover:border-red-500/40 hover:bg-red-500/[0.02]',
    emerald: 'hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]',
  };

  return (
    <motion.div variants={fadeUp} className={`p-5 rounded-xl border border-border-subtle bg-bg-card/40 transition-all duration-300 group ${bgHoverMap[color]}`}>
      <div className="flex items-center gap-3 mb-5 border-b border-border-subtle/50 pb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${colorMap[color].split(' hover')[0]}`}>
          <Icon size={20} />
        </div>
        <div>
          <h4 className="text-base font-bold text-text-main leading-tight">{title}</h4>
          <p className="text-xs text-text-muted mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </motion.div>
  );
};

const FeatureItem = ({ title, icon: Icon, desc, detail }: { title: string, icon: any, desc: string, detail: string }) => (
  <div className="p-3 rounded-lg bg-bg-page border border-border-subtle group-hover:border-border-focus transition-colors">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={14} className="text-text-muted" />
      <span className="text-sm font-bold text-text-main">{title}</span>
    </div>
    <div className="pl-5 border-l-2 border-border-subtle/50 ml-1.5 mt-1">
      <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
      <p className="text-[10px] font-mono text-text-muted/60 mt-1.5 uppercase tracking-wider">{detail}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const SecurityDeepDivePage = () => {
  const { theme: _theme } = useTheme();

  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-500/[0.03] rounded-full blur-[120px]" />
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto mb-20 text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight mb-5 leading-tight">
          Security Architecture
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-24">
        
        {/* ════════ CYBER SECURITY SECTION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <Lock className="text-red-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Cyber Security Infrastructure</h2>
              <p className="text-[11px] font-mono text-red-500 uppercase tracking-widest mt-1">Authentication, Network & Data Integrity</p>
            </div>
          </div>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SecurityCard color="red" title="Identity & Access" icon={Fingerprint} desc="Stateless auth & session control">
              <FeatureItem icon={Lock} title="JWT Strategy" desc="Short-lived access tokens (15m) paired with rotating refresh tokens (7d)." detail="Stored in httpOnly cookies to prevent XSS" />
              <FeatureItem icon={Fingerprint} title="Bcrypt Hashing" desc="Passwords are salted (12 rounds) & securely hashed before storage." detail="Work factor tuned to ~300ms calc time" />
              <FeatureItem icon={Server} title="RBAC Middleware" desc="Granular role-based access control with a deny-by-default architecture." detail="Strict endpoint isolation" />
            </SecurityCard>

            <SecurityCard color="red" title="Network Defense" icon={Shield} desc="Transport security & traffic analysis">
              <FeatureItem icon={Lock} title="TLS 1.3 Encryption" desc="Enforced HTTPS with modern cipher suites. Downgrade attacks explicitly blocked." detail="Forward secrecy enabled" />
              <FeatureItem icon={Zap} title="Redis Rate Limiting" desc="Sliding window request limiter tracking per IP and authenticated User ID." detail="Global: 100/min | Auth: 5/min" />
              <FeatureItem icon={Globe} title="CORS & Headers" desc="Strict origin whitelist combined with Helmet.js security headers (HSTS, NoSniff)." detail="Wildcards (*) disabled in prod" />
            </SecurityCard>

            <SecurityCard color="red" title="Data Integrity" icon={Database} desc="Injection prevention & sanitization">
              <FeatureItem icon={Database} title="No SQL Injection" desc="100% Parameterized queries executed strictly via the Sequelize ORM layer." detail="Raw SQL forbidden in codebase" />
              <FeatureItem icon={Terminal} title="Input Validation" desc="Express-validator rules reject invalid requests with 400 + detailed field errors." detail="Strict sanitization pipelines" />
              <FeatureItem icon={FileKey} title="AES-256 Encryption" desc="Field-level encryption implemented for highly sensitive clinical PHI data." detail="Isolated Key Management" />
            </SecurityCard>
          </motion.div>
        </section>

        {/* ════════ COMPLIANCE SECTION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <FileText className="text-emerald-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Compliance & Governance</h2>
              <p className="text-[11px] font-mono text-emerald-500 uppercase tracking-widest mt-1">HIPAA, GDPR & Data Privacy</p>
            </div>
          </div>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SecurityCard color="emerald" title="Regulatory Compliance" icon={Globe} desc="Adherence to international standards">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FeatureItem icon={Shield} title="HIPAA Ready" desc="Architecture designed specifically for PHI handling & protection." detail="BAA ready deployment" />
                <FeatureItem icon={CheckCircle2} title="GDPR Compliant" desc="Supports Right to be Forgotten & automated data portability exports." detail="Automated delete workflows" />
                <FeatureItem icon={Cookie} title="Privacy First" desc="Zero third-party tracking cookies. No external ad-network data sharing." detail="Privacy-preserving analytics only" />
                <FeatureItem icon={Database} title="Data Residency" desc="Region-locked database instances to comply with sovereign data laws." detail="EU / US deployment zones" />
              </div>
            </SecurityCard>

            <SecurityCard color="emerald" title="Audit & Accountability" icon={Eye} desc="Logging, retention, and tracing">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FeatureItem icon={FileText} title="Immutable Audit Logs" desc="Write-once logging mechanisms for all sensitive read/write actions." detail="Records Who, What, When, Where" />
                <FeatureItem icon={Server} title="Retention Policies" desc="Automated pruning of stale telemetry and temporary data (90-day cycle)." detail="Configurable per-tenant" />
                <FeatureItem icon={AlertTriangle} title="Breach Detection" desc="Automated anomaly alerting for irregular access patterns or failed logins." detail="Heuristic login analysis" />
              </div>
            </SecurityCard>
          </motion.div>
        </section>

      </div>
    </div>
  );
};