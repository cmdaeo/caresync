// frontend/src/features/showcase/pages/SecurityDeepDivePage.tsx
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Cookie,
  ChevronDown,
  X
} from 'lucide-react'

// -------------------- Core Page Component --------------------

export const SecurityDeepDivePage = () => {
  const [activePanel, setActivePanel] = useState<'security' | 'compliance' | null>(null)
  
  // Custom function to handle switching
  const switchPanel = (panel: 'security' | 'compliance') => {
    if (activePanel === panel) {
      setActivePanel(null) // Close if clicking active
    } else {
      setActivePanel(panel) // Open new or Switch
    }
  }

  const closePanel = () => setActivePanel(null)

  return (
    <div className="h-full flex flex-col bg-bg-page px-4 py-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-4 min-h-0">
        
        {/* Header - Fixed Height */}
        <div className="shrink-0 flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="text-red-500" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main leading-none">Security Architecture</h1>
              <p className="text-xs text-text-muted mt-1">Defense-in-Depth • HIPAA Compliant • Zero Trust</p>
            </div>
          </div>
        </div>

        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 min-h-0 relative flex flex-col">
            
            {/* Background Content (Visible when no panels are open) */}
            <AnimatePresence mode="popLayout">
                {!activePanel && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto px-4"
                    >
                        <div className="inline-flex items-center justify-center p-6 rounded-full bg-bg-card border border-border-subtle shadow-2xl shadow-black/20 mb-4">
                            <Shield size={64} className="text-brand-primary opacity-80" />
                        </div>
                        <h2 className="text-3xl font-bold text-text-main">
                            Enterprise-Grade Protection
                        </h2>
                        <p className="text-text-muted leading-relaxed text-lg">
                            Our security architecture is built on a zero-trust model. 
                            Select a module below to inspect the implementation details.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EXPANDED PANEL - Fills the empty space, doesn't overflow parent */}
            <AnimatePresence mode="popLayout"> 
                {activePanel && (
                    <motion.div
                        key={activePanel}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "20%", opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 200,
                            mass: 0.8
                        }}
                        // ABSOLUTE positioning allows it to slide UP over the placeholder spot without shifting layout
                        className="absolute inset-0 z-10 flex flex-col bg-bg-card rounded-xl border border-border-subtle shadow-2xl overflow-hidden"
                    >
                        {/* Internal Flex Container to handle inner scrolling */}
                        <div className="flex flex-col h-full min-h-0">
                            
                            {/* Panel Header */}
                            <div className="shrink-0 p-4 border-b border-border-subtle flex items-center justify-between bg-bg-card">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${activePanel === 'security' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {activePanel === 'security' ? <Lock size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-text-main">
                                            {activePanel === 'security' ? 'Cyber Security Infrastructure' : 'Compliance, Data & Privacy'}
                                        </h2>
                                        <p className="text-xs text-text-muted">
                                            {activePanel === 'security' ? 'Auth, Network, & Data Integrity' : 'HIPAA, GDPR, & Governance'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={closePanel}
                                    className="p-2 rounded-lg hover:bg-bg-hover text-text-muted transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Panel Content - SCROLLABLE AREA */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 min-h-0">
                                {activePanel === 'security' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-2">
                                        <SecurityColumn />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">
                                        <ComplianceColumn />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* BOTTOM COLLAPSIBLE BARS - Fixed Footer */}
        <div className="shrink-0 flex flex-col sm:flex-row gap-3 pt-4 relative z-30 bg-bg-page">
             <CollapsedBar 
                isActive={activePanel === 'security'}
                onClick={() => switchPanel('security')}
                icon={Lock}
                title="Cyber Security"
                subtitle="Auth • Network • Encryption"
                color="red"
             />

             <CollapsedBar 
                isActive={activePanel === 'compliance'}
                onClick={() => switchPanel('compliance')}
                icon={FileText}
                title="Compliance & Privacy"
                subtitle="HIPAA • GDPR • Audit"
                color="green"
             />
        </div>

      </div>
    </div>
  )
}

// -------------------- Content Columns --------------------

const SecurityColumn = () => (
    <>
        <SectionCard title="Identity & Access" icon={Fingerprint} color="red" desc="Stateless auth & session control">
            <div className="flex flex-col gap-3">
                <FeatureBlock 
                    icon={Lock} 
                    title="JWT Strategy" 
                    desc="Short-lived access (15m) + rotating refresh (7d)." 
                    detail="Stored in httpOnly cookies to prevent XSS theft." 
                />
                <FeatureBlock 
                    icon={Fingerprint} 
                    title="Bcrypt Hashing" 
                    desc="Passwords salted (12 rounds) & hashed." 
                    detail="Work factor tuned to ~300ms calculation time." 
                />
                <FeatureBlock 
                    icon={Server} 
                    title="RBAC Middleware" 
                    desc="Granular role-based access control." 
                    detail="Deny-by-default architecture." 
                />
                <FeatureBlock 
                    icon={CheckCircle2} 
                    title="MFA Support" 
                    desc="TOTP integration ready for admin routes." 
                    detail="Time-based One-Time Password standard." 
                />
            </div>
        </SectionCard>

        <SectionCard title="Network Defense" icon={Shield} color="blue" desc="Transport security & traffic analysis">
            <div className="flex flex-col gap-3">
                <FeatureBlock 
                    icon={Lock} 
                    title="TLS 1.3 Encryption" 
                    desc="Enforced HTTPS with modern cipher suites." 
                    detail="Downgrade attacks explicitly blocked." 
                />
                <FeatureBlock 
                    icon={Zap} 
                    title="Redis Rate Limiting" 
                    desc="Sliding window limiter per IP/User." 
                    detail="Global: 100/min, Auth: 5/min." 
                />
                <FeatureBlock 
                    icon={Globe} 
                    title="CORS Policy" 
                    desc="Strict whitelist for trusted origins only." 
                    detail="Wildcards (*) disabled in production." 
                />
                <FeatureBlock 
                    icon={Terminal} 
                    title="Helmet.js Headers" 
                    desc="HSTS, NoSniff, X-Frame-Options set." 
                    detail="Prevents clickjacking and MIME sniffing." 
                />
            </div>
        </SectionCard>

        <SectionCard title="Data Integrity" icon={Database} color="purple" desc="Injection prevention & sanitization">
            <div className="flex flex-col gap-3">
                <FeatureBlock 
                    icon={Database} 
                    title="No SQL Injection" 
                    desc="100% Parameterized queries via ORM." 
                    detail="Raw SQL forbidden in codebase." 
                />
                <FeatureBlock 
                    icon={Terminal} 
                    title="Input Validation" 
                    desc="Strict Joi/Zod schemas for all requests." 
                    detail="Strip unknown fields automatically." 
                />
                <FeatureBlock 
                    icon={FileKey} 
                    title="AES-256 Encryption" 
                    desc="Field-level encryption for PHI data." 
                    detail="Keys managed via environment isolation." 
                />
            </div>
        </SectionCard>
    </>
)

const ComplianceColumn = () => (
    <>
        <SectionCard title="Regulatory Compliance" icon={Globe} color="green" desc="Adherence to international standards">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FeatureBlock 
                    icon={Shield} 
                    title="HIPAA Ready" 
                    desc="Designed for PHI handling & protection." 
                    detail="Business Associate Agreement (BAA) ready." 
                />
                <FeatureBlock 
                    icon={Globe} 
                    title="GDPR Compliant" 
                    desc="Right to be forgotten & data portability." 
                    detail="Automated export/delete workflows." 
                />
                <FeatureBlock 
                    icon={Cookie} 
                    title="Privacy First" 
                    desc="Zero third-party tracking cookies." 
                    detail="Privacy-preserving analytics only." 
                />
                <FeatureBlock 
                    icon={Database} 
                    title="Data Residency" 
                    desc="Region-locked database instances available." 
                    detail="EU/US specific deployment options." 
                />
            </div>
        </SectionCard>

        <SectionCard title="Audit & Governance" icon={Eye} color="amber" desc="Logging, retention, and accountability">
            <div className="flex flex-col gap-3">
                <FeatureBlock 
                    icon={FileText} 
                    title="Immutable Audit Logs" 
                    desc="Write-once logs for all sensitive actions." 
                    detail="Who, What, When, Where recorded." 
                />
                <FeatureBlock 
                    icon={Server} 
                    title="Retention Policies" 
                    desc="Automated pruning of stale data (90 days)." 
                    detail="Configurable per-tenant policies." 
                />
                <FeatureBlock 
                    icon={AlertTriangle} 
                    title="Breach Detection" 
                    desc="Automated alerts for anomalous access patterns." 
                    detail="Heuristic analysis of login attempts." 
                />
            </div>
        </SectionCard>
    </>
)

// -------------------- Sub-Components --------------------

const CollapsedBar = ({ isActive, onClick, icon: Icon, title, subtitle, color }: any) => {
    const colors: Record<string, string> = {
        red: 'text-red-500 bg-red-500/10 group-hover:bg-red-500/20',
        green: 'text-green-500 bg-green-500/10 group-hover:bg-green-500/20',
        blue: 'text-blue-500 bg-blue-500/10 group-hover:bg-blue-500/20'
    }

    return (
        <button
            onClick={onClick}
            className={`
                flex-1 flex items-center justify-between p-4 rounded-xl border transition-all duration-300 group
                ${isActive 
                    ? 'bg-bg-card border-brand-primary/50 shadow-lg ring-1 ring-brand-primary/20 scale-[1.02]' 
                    : 'bg-bg-card border-border-subtle hover:border-border-focus hover:shadow-md'}
            `}
        >
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg transition-colors ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                <div className="text-left">
                    <h3 className={`text-sm font-bold transition-colors ${isActive ? 'text-text-main' : 'text-text-main/80 group-hover:text-text-main'}`}>
                        {title}
                    </h3>
                    <p className="text-xs text-text-muted group-hover:text-text-muted/80">
                        {subtitle}
                    </p>
                </div>
            </div>
            <div className={`
                p-1.5 rounded-full transition-all duration-300
                ${isActive ? 'bg-brand-primary text-white rotate-180' : 'bg-bg-page text-text-muted group-hover:bg-bg-hover'}
            `}>
                <ChevronDown size={16} />
            </div>
        </button>
    )
}

const SectionCard = ({ title, icon: Icon, color, desc, children }: any) => (
  <div className="rounded-xl border border-border-subtle bg-bg-page/50 flex flex-col h-full hover:border-border-focus transition-colors duration-300 overflow-hidden">
    {/* Header - Compact */}
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-bg-card/50 shrink-0">
      <Icon className={`text-${color}-500`} size={18} />
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-text-main leading-none truncate">{title}</h3>
        <p className="text-[10px] text-text-muted mt-0.5 truncate">{desc}</p>
      </div>
    </div>
    
    {/* Content - Scrollable if needed, but designed to fit */}
    <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {children}
    </div>
  </div>
)

const FeatureBlock = ({ title, icon: Icon, desc, detail }: { title: string, icon: any, desc: string, detail: string }) => (
  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle group hover:border-border-focus transition-colors">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={16} className="text-text-muted group-hover:text-brand-primary transition-colors" />
      <span className="text-sm font-bold text-text-main">{title}</span>
    </div>
    <div className="pl-6">
       <Tooltip content={desc} detail={detail}>
          <p className="text-xs text-text-muted leading-relaxed cursor-help decoration-dotted underline decoration-border-subtle underline-offset-2 hover:text-text-main transition-colors">
            {desc}
          </p>
       </Tooltip>
    </div>
  </div>
)

// -------------------- Shared Tooltip (Optimized) --------------------

const Tooltip = ({ content, detail, children }: { content: string, detail?: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false)
  const [displayCoords, setDisplayCoords] = useState({ x: 0, y: 0 })
  const [placement, setPlacement] = useState({ x: 'left', y: 'top' })
  
  const targetCoordsRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!show) return

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

    const animate = () => {
      setDisplayCoords(prev => ({
        x: lerp(prev.x, targetCoordsRef.current.x, 0.15),
        y: lerp(prev.y, targetCoordsRef.current.y, 0.15)
      }))
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [show])

  const updateTarget = (clientX: number, clientY: number) => {
    const isRightHalf = clientX > window.innerWidth / 2
    const isBottomHalf = clientY > window.innerHeight / 2

    setPlacement({
      x: isRightHalf ? 'right' : 'left',
      y: isBottomHalf ? 'bottom' : 'top'
    })
    
    targetCoordsRef.current = { x: clientX, y: clientY }
  }

  return (
    <div 
      className="inline-block w-full" 
      onMouseEnter={(e) => {
        setShow(true)
        updateTarget(e.clientX, e.clientY)
        setDisplayCoords({ x: e.clientX, y: e.clientY })
      }}
      onMouseMove={(e) => updateTarget(e.clientX, e.clientY)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      {show && createPortal(
        <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                top: displayCoords.y,
                left: displayCoords.x,
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
              className="fixed"
            >
              <div className={`
                w-72 rounded-lg overflow-hidden
                bg-linear-to-br from-gray-900 via-gray-900 to-gray-800
                border border-gray-700/50 
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                ${placement.x === 'right' ? '-translate-x-full -ml-6' : 'ml-6'}
                ${placement.y === 'bottom' ? '-translate-y-full -mt-3' : 'mt-3'}
              `}>
                <div className="px-4 pt-3 pb-2 bg-linear-to-r from-red-500/10 to-transparent border-b border-gray-700/30">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-red-400/90">
                    Security Context
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {content}
                  </p>
                </div>
                {detail && (
                  <div className="px-4 py-2.5 bg-black/30 border-t border-gray-700/20">
                    <div className="flex items-start gap-2">
                      <Shield size={12} className="text-red-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-400 font-mono">
                        {detail}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
