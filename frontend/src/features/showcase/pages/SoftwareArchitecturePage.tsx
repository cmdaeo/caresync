// frontend/src/features/showcase/pages/SoftwareArchitecturePage.tsx
import { useMemo, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Server,
  Globe,
  Database,
  Shield,
  Zap,
  Code2,
  Layers,
  ChevronDown,
  FileText,
  X,
} from 'lucide-react'

import apiDocumentationRaw from '../../../api-docs.json'

// ... [Interfaces remain unchanged] ...
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  tags: string[]
  auth: boolean
  rateLimit: string
  dataCollected: string[]
  dataShared: string[]
  retention: string
  hipaaCompliant: boolean
  gdprCompliant: boolean
  requestBody?: any
  responseBody?: any
  parameters?: any[]
}

interface ApiDocumentation {
  endpoints: ApiEndpoint[]
  totalEndpoints: number
  generated: string
  version: string
}

interface TechItem {
  label: string;
  description: string;
  detail?: string;
}

const PANEL_EXIT_DURATION = 0.25
const BAR_ENTER_DELAY = 0.25
const STACKS_ENTER_DELAY = 0.05

export const SoftwareArchitecturePage = () => {
  const [apiOpen, setApiOpen] = useState(false)
  const [showStacks, setShowStacks] = useState(true)
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)

  const apiDocumentation = apiDocumentationRaw as ApiDocumentation
  const apiEndpoints: ApiEndpoint[] = apiDocumentation.endpoints || []
  const generatedAt = apiDocumentation.generated
  const totalEndpoints = apiDocumentation.totalEndpoints

  const updatedLabel = useMemo(() => {
    try {
      return new Date(generatedAt).toLocaleDateString()
    } catch {
      return generatedAt
    }
  }, [generatedAt])

  const openApi = () => {
    setShowStacks(false)
    setApiOpen(true)
  }

  const closeApi = () => {
    setApiOpen(false)
    setExpandedEndpoint(null)
  }

  return (
    <div className="h-full flex flex-col bg-bg-page px-4 py-4 overflow-hidden relative">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-4">
        
        {/* Header */}
        <div className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-primary/10">
              <Layers className="text-brand-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-main leading-none">Software Architecture</h1>
              <p className="text-xs text-text-muted mt-1">HIPAA-compliant • Production-ready • Full-stack</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 relative flex flex-col">
          
          {/* Stacks Grid */}
          <AnimatePresence mode="wait">
            {showStacks && (
              <motion.div
                key="stacks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2, delay: STACKS_ENTER_DELAY } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden"
              >
                <StackCard title="Frontend Stack" icon={Globe} color="blue" desc="React 19 SPA + Capacitor">
                  <div className="grid grid-cols-2 gap-3">
                    <TechSection 
                      title="Core" 
                      icon={Code2} 
                      items={[
                        { label: 'Vite 7', description: "Instant server start with lightning-fast HMR during development. Builds to highly optimized static assets.", detail: "Cold start in <500ms" },
                        { label: 'React 19', description: "Leveraging the latest concurrency features and server components where applicable.", detail: "15% smaller bundle vs React 18" },
                        { label: 'Zustand', description: "Selected over Redux for minimal boilerplate and transient state update capabilities.", detail: "Just 1.1kB gzipped" },
                        { label: 'Framer Motion', description: "Production-grade layout animations (like this page!) without complex CSS transitions.", detail: "Hardware-accelerated transforms" }
                      ]} 
                    />
                    <TechSection 
                      title="Styling" 
                      icon={Zap} 
                      items={[
                        { label: 'Tailwind 4', description: "Zero-runtime CSS-in-JS alternative that speeds up prototyping dramatically.", detail: "JIT engine ensures minimal CSS output" },
                        { label: 'PostCSS', description: "Handles vendor prefixing and modern CSS feature polyfills automatically." },
                        { label: 'Lucide Icons', description: "Consistent, lightweight SVG icon set with tree-shaking support.", detail: "Only imports icons you use" },
                        { label: 'Dark Mode', description: "System-aware theming built into the core design tokens for seamless UX." }
                      ]} 
                    />
                    <TechSection
                      title="Mobile"
                      icon={Globe}
                      className="col-span-2"
                      items={[
                        { label: 'Capacitor 8', description: "Bridges the web app to native iOS/Android code containers transparently.", detail: "Single codebase for web + mobile" },
                        { label: 'Custom NFC', description: "Custom Java/Swift plugin to interface with medical-grade NFC readers.", detail: "Direct hardware access layer" },
                        { label: 'Biometrics', description: "Uses FaceID/TouchID for secure, fast login on supported devices.", detail: "Native OS integration" },
                        { label: 'Gradle', description: "Automated Android build pipeline for consistent release artifacts.", detail: "CI/CD ready" }
                      ]}
                    />
                  </div>
                </StackCard>

                <StackCard title="Backend Stack" icon={Server} color="green" desc="Node.js REST + Real-time">
                  <div className="grid grid-cols-2 gap-3">
                    <TechSection 
                      title="Core Services" 
                      icon={Server} 
                      items={[
                        { label: 'Express 4.18', description: "Battle-tested middleware architecture for reliable request handling.", detail: "Powers 40%+ of all Node.js APIs" },
                        { label: 'Socket.IO 4.7', description: "Enables real-time patient vitals updates with automatic reconnection logic.", detail: "WebSockets + long-polling fallback" },
                        { label: 'JWT + bcrypt', description: "Stateless authentication scaling horizontally without sticky sessions.", detail: "Industry-standard security" },
                        { label: 'Winston', description: "Structured JSON logging aggregated for observability and debugging.", detail: "Daily log rotation to save disk" }
                      ]} 
                    />
                    <TechSection 
                      title="Data Layer" 
                      icon={Database} 
                      items={[
                        { label: 'Sequelize ORM', description: "Provides type-safe database queries and automatic migration management.", detail: "Works with SQLite, Postgres, MySQL" },
                        { label: 'SQLite3 / PG', description: "SQLite for edge deployment simplicity, Postgres for scalable cloud instances.", detail: "Same ORM for both databases" },
                        { label: 'Redis', description: "High-performance caching layer for session storage and rate limiting.", detail: "Sub-millisecond latency" },
                        { label: 'AES-256', description: "Field-level encryption for sensitive patient data at rest.", detail: "Military-grade encryption" }
                      ]} 
                    />
                    <TechSection
                      title="Security"
                      icon={Shield}
                      className="col-span-2"
                      items={[
                        { label: 'Helmet', description: "Sets secure HTTP headers (CSP, HSTS) to prevent common web attacks.", detail: "OWASP recommended" },
                        { label: 'Rate Limiting', description: "Prevents DDoS and brute-force attacks by tracking IP request frequency in Redis.", detail: "Configurable per-endpoint" },
                        { label: 'Joi Validation', description: "Strict schema validation for all incoming request payloads.", detail: "Fails fast on bad input" },
                        { label: 'CORS', description: "Strict whitelist policy allowing only trusted domains to access the API.", detail: "Production domain hardcoded" }
                      ]}
                    />
                  </div>
                </StackCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed API Bar */}
          {!apiOpen && (
            <motion.div 
              className="shrink-0 mt-auto pt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: BAR_ENTER_DELAY * 0.8, duration: 0.2 } }}
            >
              <button
                onClick={openApi}
                className="w-full border border-border-subtle rounded-xl bg-bg-card overflow-hidden hover:bg-bg-hover transition-colors"
              >
                <div className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
                      <FileText size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
                        API Documentation
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                          v{apiDocumentation.version}
                        </span>
                      </h3>
                      <p className="text-xs text-text-muted">
                        {totalEndpoints} Endpoints • Updated {updatedLabel}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="text-text-muted -rotate-90" size={18} />
                </div>
              </button>
            </motion.div>
          )}

          {/* Expanded API Panel */}
          <AnimatePresence onExitComplete={() => { if (!apiOpen) setShowStacks(true) }}>
            {apiOpen && (
              <motion.div
                key="api-panel"
                initial={{ y: "100%", opacity: 0 }} 
                animate={{ y: 0, opacity: 1, transition: { duration: 0.25, ease: "easeOut", delay: 0.15 } }}
                exit={{ y: "100%", opacity: 0, transition: { duration: PANEL_EXIT_DURATION, ease: "easeIn" } }}
                className="absolute inset-0 z-20 flex flex-col min-h-0 rounded-xl border border-border-subtle bg-bg-card overflow-hidden shadow-2xl"
              >
                <button
                  onClick={closeApi}
                  className="shrink-0 w-full p-4 border-b border-border-subtle flex items-center justify-between bg-bg-card hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-text-main truncate">API Documentation</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary shrink-0">
                          v{apiDocumentation.version}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate">
                        {totalEndpoints} Endpoints • Updated {updatedLabel}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg text-text-muted">
                    <X size={18} />
                  </div>
                </button>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-bg-page p-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2 pb-8">
                    {apiEndpoints.map((endpoint, i) => (
                      <EndpointRow
                        key={`${endpoint.method}-${endpoint.path}-${i}`}
                        endpoint={endpoint}
                        isExpanded={expandedEndpoint === endpoint.path}
                        onToggle={() => setExpandedEndpoint(expandedEndpoint === endpoint.path ? null : endpoint.path)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}

// -------------------- Sub-Components --------------------

// Damped Tooltip with Theme-matched Styling
const Tooltip = ({ content, detail, children }: { content: string, detail?: string, children: React.ReactNode }) => {
  const [show, setShow] = useState(false)
  const [displayCoords, setDisplayCoords] = useState({ x: 0, y: 0 })
  const [placement, setPlacement] = useState({ x: 'left', y: 'top' })
  
  const targetCoordsRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  // Smooth damping using requestAnimationFrame
  useEffect(() => {
    if (!show) return

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor

    const animate = () => {
      setDisplayCoords(prev => ({
        x: lerp(prev.x, targetCoordsRef.current.x, 0.15), // 0.15 = damping factor (lower = heavier)
        y: lerp(prev.y, targetCoordsRef.current.y, 0.15)
      }))
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [show])

  const updateTarget = (clientX: number, clientY: number) => {
    // Quadrant detection
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
      className="relative flex items-center"
      onMouseEnter={(e) => {
        setShow(true)
        updateTarget(e.clientX, e.clientY)
        setDisplayCoords({ x: e.clientX, y: e.clientY }) // Initialize display coords
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
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }} // Custom ease for quality feel
              style={{
                top: displayCoords.y,
                left: displayCoords.x,
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
              }}
              className="fixed"
            >
              {/* Theme-matched tooltip with your design system */}
              <div className={`
                w-80 rounded-lg overflow-hidden
                bg-linear-to-br from-gray-900 via-gray-900 to-gray-800
                border border-gray-700/50 
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                ${placement.x === 'right' ? '-translate-x-full -ml-6' : 'ml-6'}
                ${placement.y === 'bottom' ? '-translate-y-full -mt-3' : 'mt-3'}
              `}>
                {/* Header with accent */}
                <div className="px-4 pt-3 pb-2 bg-linear-to-r from-brand-primary/10 to-transparent border-b border-gray-700/30">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-primary/70">
                    Technical Context
                  </div>
                </div>

                {/* Main content */}
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                    {content}
                  </p>
                </div>

                {/* Detail footer (if provided) */}
                {detail && (
                  <div className="px-4 py-2.5 bg-black/30 border-t border-gray-700/20">
                    <div className="flex items-start gap-2">
                      <Zap size={12} className="text-brand-primary mt-0.5 shrink-0" />
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

const StackCard = ({ title, icon: Icon, color, desc, children, className }: any) => (
  <div className={`rounded-xl border border-border-subtle bg-bg-card p-4 flex flex-col min-h-0 ${className ?? ''}`}>
    <div className="flex items-center gap-3 mb-4 border-b border-border-subtle pb-3 shrink-0">
      <Icon className={`text-${color}-500`} size={20} />
      <div className="min-w-0">
        <h3 className="text-base font-bold text-text-main leading-tight truncate">{title}</h3>
        <p className="text-xs text-text-muted truncate">{desc}</p>
      </div>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
)

const TechSection = ({ title, icon: Icon, items, className }: { title: string, icon: any, items: TechItem[], className?: string }) => (
  <div className={`p-3 rounded-lg bg-bg-page border border-border-subtle ${className ?? ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <Icon size={14} className="text-text-muted" />
      <span className="text-xs font-bold text-text-main">{title}</span>
    </div>
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-1.5 min-w-0">
          <span className="w-1 h-1 rounded-full bg-brand-primary/50 shrink-0" />
          <Tooltip content={item.description} detail={item.detail}>
            <span className="text-[11px] text-text-muted truncate hover:text-text-main cursor-help transition-colors decoration-dotted underline decoration-border-subtle underline-offset-2">
              {item.label}
            </span>
          </Tooltip>
        </li>
      ))}
    </ul>
  </div>
)

const EndpointRow = ({ endpoint, isExpanded, onToggle }: { endpoint: ApiEndpoint, isExpanded: boolean, onToggle: () => void }) => {
  const methodColors: Record<string, string> = {
    GET: 'text-green-500 bg-green-500/10',
    POST: 'text-blue-500 bg-blue-500/10',
    PUT: 'text-amber-500 bg-amber-500/10',
    DELETE: 'text-red-500 bg-red-500/10',
    PATCH: 'text-orange-500 bg-orange-500/10',
  }

  return (
    <div className="border border-border-subtle rounded-lg overflow-hidden bg-bg-card/50">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-3 hover:bg-bg-hover transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${methodColors[endpoint.method] || 'text-text-muted'}`}>
            {endpoint.method}
          </span>
          <code className="text-xs font-mono text-text-main truncate">{endpoint.path}</code>
        </div>
        <ChevronDown size={14} className={`text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-border-subtle bg-bg-page overflow-hidden"
          >
            <div className="p-3 text-xs space-y-3">
              <p className="text-text-muted">{endpoint.description}</p>
              {endpoint.responseBody && (
                <div>
                  <div className="font-semibold text-text-main mb-1">Response Example</div>
                  <pre className="p-2 rounded bg-bg-card border border-border-subtle overflow-x-auto text-[10px] font-mono text-text-muted custom-scrollbar max-h-56">
                    {JSON.stringify(endpoint.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
