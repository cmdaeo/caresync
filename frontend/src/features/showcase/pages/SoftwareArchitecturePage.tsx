import { motion } from 'framer-motion'
import {
  Server,
  Globe,
  Database,
  Shield,
  Zap,
  Code2,
  Layers,
  Bluetooth,
  Smartphone,
  Cpu
} from 'lucide-react'

const STACKS_ENTER_DELAY = 0.05

export const SoftwareArchitecturePage = () => {
  return (
    <div className="h-full flex flex-col bg-bg-page px-4 py-8 overflow-hidden relative overflow-y-auto themed-scrollbar">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 pb-12">
        
        {/* Header */}
        <div className="shrink-0 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-primary/10">
              <Layers className="text-brand-primary" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-main leading-tight">Software Architecture</h1>
              <p className="text-sm text-text-muted mt-1">HIPAA-compliant • Production-ready • Full-stack</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: STACKS_ENTER_DELAY } }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Frontend Stack */}
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
              <Globe className="text-blue-500" size={24} />
              <div>
                <h3 className="text-lg font-bold text-text-main leading-tight">Frontend Stack</h3>
                <p className="text-xs text-text-muted">React 19 SPA + Capacitor Native</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 size={16} className="text-blue-400" />
                  <span className="text-sm font-bold text-text-main">Web Core</span>
                </div>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li><strong className="text-text-main">Vite:</strong> Instant HMR and optimized builds.</li>
                  <li><strong className="text-text-main">React 19:</strong> Concurrency & optimal rendering.</li>
                  <li><strong className="text-text-main">Zustand:</strong> Minimal boilerplate state management.</li>
                  <li><strong className="text-text-main">Framer Motion:</strong> Hardware-accelerated animations.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone size={16} className="text-blue-400" />
                  <span className="text-sm font-bold text-text-main">Mobile Core</span>
                </div>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li><strong className="text-text-main">Capacitor:</strong> Native iOS/Android bridging.</li>
                  <li><strong className="text-text-main">NFC Bridge:</strong> Secure hardware token scanning.</li>
                  <li><strong className="text-text-main">BLE Plugin:</strong> Direct CareBox pairing.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Backend Stack */}
          <div className="rounded-2xl border border-border-subtle bg-bg-card p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
              <Server className="text-emerald-500" size={24} />
              <div>
                <h3 className="text-lg font-bold text-text-main leading-tight">Backend Stack</h3>
                <p className="text-xs text-text-muted">Node.js REST + Supabase PostgreSQL</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-text-main">Data Layer</span>
                </div>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li><strong className="text-text-main">PostgreSQL:</strong> Supabase-hosted relational DB.</li>
                  <li><strong className="text-text-main">Sequelize:</strong> Type-safe ORM models.</li>
                  <li><strong className="text-text-main">Redis:</strong> Edge caching & rate limits.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-text-main">Security</span>
                </div>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li><strong className="text-text-main">AES-256:</strong> PII Encryption at rest.</li>
                  <li><strong className="text-text-main">Zero-Trust:</strong> Granular RBAC validation.</li>
                  <li><strong className="text-text-main">Helmet/CORS:</strong> strict edge security.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Embedded Firmware & Protocol Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } }}
          className="rounded-2xl border border-border-subtle bg-bg-card p-6 md:p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <Cpu className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-main leading-tight">Device Communication Protocol</h3>
              <p className="text-sm text-text-muted mt-1">CareBox / CareBand BLE Data Interchange</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-bold text-text-main mb-3 flex items-center gap-2">
                <Bluetooth size={18} className="text-blue-400" /> The BLE Challenge
              </h4>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                When transmitting medication schedules to the embedded CareBox via Bluetooth Low Energy (BLE), we face strict Maximum Transmission Unit (MTU) limitations. Standard BLE 4.0 only guarantees 20 bytes per packet.
              </p>
              
              <div className="bg-bg-card border border-border-subtle rounded-lg p-4 mb-4">
                <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Original Format</h5>
                <code className="text-red-400 font-mono text-sm break-all">
                  MED|NOME|IntervaloMinutos|DuracaoDias
                </code>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-text-main mb-3">Protocol Redesign</h4>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                We replaced the original string-based format with a structured TLV (Tag-Length-Value) binary protocol. 
              </p>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Zap size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Why change?</strong> The original pipe-delimited format is brittle, wastes bytes on string delimiters, requires heavy string parsing on the micro-controller, and lacks message type identifiers (making OTA updates or setting configurations impossible).</span>
                </li>
                <li className="flex gap-2">
                  <Shield size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>The New Format:</strong> We use a compact binary payload: <code className="text-blue-300 bg-blue-500/10 px-1 rounded">0x01 [ID:2b] [INT:2b] [DUR:1b] [NAME:15b]</code>. This drops the payload size significantly, prevents buffer overflows on the ESP32, and allows for single-packet transmission within the 20-byte MTU limit.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
