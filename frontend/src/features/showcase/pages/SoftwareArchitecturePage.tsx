// frontend/src/features/showcase/pages/SoftwareArchitecturePage.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Server, 
  Globe, 
  Database, 
  Shield, 
  Zap, 
  Code2, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  Eye, 
  FileText, 
  Clock 
} from 'lucide-react'

// Import the static API documentation
import apiDocumentationRaw from '../../../../public/api-docs.json'

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

export const SoftwareArchitecturePage = () => {
  const [activeLayer, setActiveLayer] = useState<'frontend' | 'backend' | 'full'>('full')
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)

  // Cast the imported JSON to our type
  const apiDocumentation = apiDocumentationRaw as ApiDocumentation
  const apiEndpoints: ApiEndpoint[] = apiDocumentation.endpoints || []
  const generatedAt = apiDocumentation.generated
  const totalEndpoints = apiDocumentation.totalEndpoints

  return (
    <div className="min-h-screen bg-bg-page py-16 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Header */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-brand-primary/10 border border-brand-primary/20"
          >
            <Layers className="text-brand-primary" size={24} />
            <span className="text-sm font-semibold text-brand-primary uppercase tracking-wider">
              Enterprise-Grade Full-Stack Platform
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-text-main"
          >
            Software Architecture
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-muted max-w-3xl mx-auto leading-relaxed"
          >
            HIPAA-compliant healthcare monitoring platform built with security-first principles,
            modern web technologies, and production-ready infrastructure.
          </motion.p>
        </div>

        {/* Layer Toggle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3"
        >
          {[
            { key: 'frontend', label: 'Frontend', icon: Globe },
            { key: 'backend', label: 'Backend', icon: Server },
            { key: 'full', label: 'Full Stack', icon: Layers }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveLayer(key as typeof activeLayer)}
              className={`
                group relative px-6 py-3 rounded-xl font-semibold transition-all duration-300
                ${activeLayer === key
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-105'
                  : 'bg-bg-card text-text-muted hover:text-text-main hover:bg-bg-hover border border-border-subtle'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <Icon size={18} />
                {label}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Architecture Cards */}
        <div className="space-y-8">
          
          {/* Frontend Stack */}
          {(activeLayer === 'frontend' || activeLayer === 'full') && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border-2 border-border-subtle bg-bg-card p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 via-cyan-500 to-blue-500" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Globe className="text-blue-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-text-main">Frontend Stack</h2>
                  <p className="text-sm text-text-muted">Modern React SPA with hybrid mobile support</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                {/* Web Layer */}
                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Code2 className="text-blue-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">React + TypeScript</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Vite 7</strong> - Lightning-fast HMR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">React 19</strong> - Component-based UI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">React Router 7</strong> - SPA routing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Zustand</strong> - State management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Axios</strong> - HTTP interceptors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Framer Motion</strong> - Animations</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Zap className="text-cyan-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Styling & UI</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Tailwind CSS 4</strong> - Utility-first</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">PostCSS</strong> - CSS processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Lucide React</strong> - SVG icons</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Theme Context</strong> - Dark/light modes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Custom design tokens</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Globe className="text-green-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Hybrid Mobile</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Capacitor 8</strong> - Native bridge</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Custom NFC Plugin</strong> - Java ↔ TS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Native APIs</strong> - Camera, BLE</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Gradle build system</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Backend Stack */}
          {(activeLayer === 'backend' || activeLayer === 'full') && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl border-2 border-border-subtle bg-bg-card p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-green-500 via-emerald-500 to-green-500" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <Server className="text-green-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-text-main">Backend Stack</h2>
                  <p className="text-sm text-text-muted">Node.js REST API with real-time capabilities</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Server className="text-green-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Core</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Express 4.18</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Socket.IO 4.7</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">JWT</strong> auth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">bcryptjs</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Winston</strong> logging</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Database className="text-purple-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Data</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Sequelize ORM</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">SQLite3</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Redis</strong> cache</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Field encryption</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Shield className="text-amber-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Security</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Helmet</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">CORS</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Rate limiting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Input validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span><strong className="text-text-main">Joi</strong> schemas</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4 p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                    <Zap className="text-orange-500" size={20} />
                    <h3 className="text-lg font-bold text-text-main">Services</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>PDF generation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>QR verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Email service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Cron jobs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-primary font-bold">•</span>
                      <span>Push notifications</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECURITY ARCHITECTURE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl border-2 border-red-500/30 bg-bg-card p-8 shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-orange-500 to-red-500" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <Shield className="text-red-500" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-text-main">Security Architecture</h2>
                <p className="text-sm text-text-muted">Enterprise-grade security with defense-in-depth strategy</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Authentication & Authorization */}
              <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-start gap-4">
                  <Lock className="text-red-500 mt-1 shrink-0" size={24} />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-text-main">Authentication & Session Management</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      We implement <strong className="text-text-main">JWT (JSON Web Tokens)</strong> for stateless authentication with a 7-day expiration window. 
                      Tokens are stored in <strong className="text-text-main">localStorage</strong> with Zustand persistence middleware, enabling automatic session restoration 
                      across page reloads while maintaining XSS protection through proper Content Security Policy (CSP) headers.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={16} />
                        <span className="text-text-muted">
                          <strong className="text-text-main">bcrypt</strong> password hashing (10 salt rounds)
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={16} />
                        <span className="text-text-muted">
                          <strong className="text-text-main">HS256</strong> algorithm for JWT signing
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={16} />
                        <span className="text-text-muted">
                          <strong className="text-text-main">Role-based access control</strong> (RBAC)
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={16} />
                        <span className="text-text-muted">
                          <strong className="text-text-main">Token refresh</strong> mechanism
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XSS & CSRF Protection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 mt-1 shrink-0" size={20} />
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-text-main">XSS Prevention</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        <strong className="text-text-main">Cross-Site Scripting (XSS)</strong> attacks are mitigated through multiple layers:
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">CSP Headers</strong> - Strict content policy blocking inline scripts</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">React's JSX escaping</strong> - Automatic sanitization</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">DOMPurify</strong> for user-generated HTML (future)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">X-XSS-Protection</strong> header via Helmet</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-start gap-3">
                    <Shield className="text-blue-500 mt-1 shrink-0" size={20} />
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-text-main">CSRF Protection</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        <strong className="text-text-main">Cross-Site Request Forgery (CSRF)</strong> protection through:
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">SameSite cookies</strong> - Future httpOnly implementation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Origin validation</strong> - CORS whitelist</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Double-submit pattern</strong> for state-changing ops</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Custom headers</strong> - X-Requested-With</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SQL Injection & Input Validation */}
              <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-start gap-4">
                  <Database className="text-purple-500 mt-1 shrink-0" size={24} />
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-text-main">SQL Injection Prevention & Input Validation</h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                      <strong className="text-text-main">SQL Injection</strong> attacks are completely eliminated through <strong className="text-text-main">Sequelize ORM</strong> parameterized queries. 
                      All database operations use prepared statements with automatic escaping. We implement a three-layer validation strategy:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="font-semibold text-text-main text-sm">1. Client-Side</div>
                        <ul className="space-y-1 text-xs text-text-muted">
                          <li>• React Hook Form validation</li>
                          <li>• Real-time field-level checks</li>
                          <li>• UX-friendly error messages</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-text-main text-sm">2. Middleware Layer</div>
                        <ul className="space-y-1 text-xs text-text-muted">
                          <li>• <strong>express-validator</strong> middleware</li>
                          <li>• Schema-based validation</li>
                          <li>• Sanitization of inputs</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-text-main text-sm">3. Business Logic</div>
                        <ul className="space-y-1 text-xs text-text-muted">
                          <li>• <strong>Joi</strong> schema validation</li>
                          <li>• Type checking (TypeScript)</li>
                          <li>• Domain-specific rules</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate Limiting & DDoS Protection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-start gap-3">
                    <Zap className="text-yellow-500 mt-1 shrink-0" size={20} />
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-text-main">Rate Limiting & DDoS</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        Multi-tier <strong className="text-text-main">rate limiting</strong> strategy:
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Global limit:</strong> 100 req/15min per IP</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Auth endpoints:</strong> 5 attempts/15min</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Redis-backed</strong> distributed limiting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Exponential backoff</strong> on violations</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-start gap-3">
                    <Lock className="text-green-500 mt-1 shrink-0" size={20} />
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-text-main">Data Encryption</h4>
                      <p className="text-sm text-text-muted leading-relaxed">
                        End-to-end <strong className="text-text-main">encryption</strong> at multiple layers:
                      </p>
                      <ul className="space-y-2 text-sm text-text-muted">
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">TLS 1.3</strong> - Transport layer security</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">AES-256-CBC</strong> field-level encryption</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">PHI data</strong> encrypted at rest</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-brand-primary font-bold">•</span>
                          <span><strong className="text-text-main">Key rotation</strong> policy (90 days)</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Headers */}
              <div className="p-6 rounded-xl bg-linear-to-br from-red-500/5 to-orange-500/5 border border-red-500/20">
                <h4 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
                  <Shield className="text-red-500" size={20} />
                  Security Headers (via Helmet.js)
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <div className="font-mono font-bold text-text-main mb-1">X-Frame-Options</div>
                    <div className="text-text-muted">DENY - Clickjacking protection</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <div className="font-mono font-bold text-text-main mb-1">X-Content-Type</div>
                    <div className="text-text-muted">nosniff - MIME-sniffing block</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <div className="font-mono font-bold text-text-main mb-1">HSTS</div>
                    <div className="text-text-muted">Strict-Transport-Security</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <div className="font-mono font-bold text-text-main mb-1">Referrer-Policy</div>
                    <div className="text-text-muted">no-referrer - Privacy</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* API DOCUMENTATION - STATIC FILE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative overflow-hidden rounded-2xl border-2 border-border-subtle bg-bg-card p-8 shadow-xl"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <FileText className="text-indigo-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-text-main">Live API Documentation</h2>
                  <p className="text-sm text-text-muted">
                    Auto-generated from backend Swagger comments • Last updated: {new Date(generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-primary">{totalEndpoints}</div>
                <div className="text-xs text-text-muted">Total Endpoints</div>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="text-green-500" size={16} />
                <span className="text-sm font-semibold text-green-500">HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <CheckCircle2 className="text-blue-500" size={16} />
                <span className="text-sm font-semibold text-blue-500">GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Eye className="text-purple-500" size={16} />
                <span className="text-sm font-semibold text-purple-500">Full Transparency</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Code2 className="text-amber-500" size={16} />
                <span className="text-sm font-semibold text-amber-500">Auto-Generated from Code</span>
              </div>
            </div>

            {/* API Endpoints */}
            <div className="space-y-4">
              {apiEndpoints.map((endpoint, index) => (
                <EndpointCard 
                  key={`${endpoint.method}-${endpoint.path}-${index}`}
                  endpoint={endpoint}
                  isExpanded={expandedEndpoint === endpoint.path}
                  onToggle={() => setExpandedEndpoint(expandedEndpoint === endpoint.path ? null : endpoint.path)}
                />
              ))}
            </div>

            {/* Compliance Footer */}
            <div className="mt-8 p-6 rounded-xl bg-linear-to-br from-green-500/5 to-blue-500/5 border border-border-subtle">
              <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                <Shield className="text-green-500" size={20} />
                Privacy & Compliance Commitments
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-text-main mb-2">HIPAA Compliance</div>
                  <ul className="space-y-1 text-xs text-text-muted">
                    <li>• PHI encrypted at rest & in transit</li>
                    <li>• Audit logs for all PHI access</li>
                    <li>• Business Associate Agreements (BAA)</li>
                    <li>• 7-year data retention</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-text-main mb-2">GDPR Compliance</div>
                  <ul className="space-y-1 text-xs text-text-muted">
                    <li>• Right to erasure (DELETE /api/auth/account)</li>
                    <li>• Data portability (export feature)</li>
                    <li>• Explicit consent management</li>
                    <li>• Privacy by design</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-text-main mb-2">Security Measures</div>
                  <ul className="space-y-1 text-xs text-text-muted">
                    <li>• End-to-end encryption (AES-256)</li>
                    <li>• Rate limiting & DDoS protection</li>
                    <li>• JWT with bcrypt password hashing</li>
                    <li>• Regular security audits</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

// Endpoint Card Component
const EndpointCard = ({ endpoint, isExpanded, onToggle }: {
  endpoint: ApiEndpoint
  isExpanded: boolean
  onToggle: () => void
}) => {
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'POST': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      case 'PUT': return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      case 'PATCH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'DELETE': return 'text-red-500 bg-red-500/10 border-red-500/20'
      default: return 'text-text-muted bg-bg-page border-border-subtle'
    }
  }

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-page">
      {/* Endpoint Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <span className={`px-3 py-1 rounded-md text-xs font-bold border ${getMethodColor(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <code className="text-sm font-mono text-text-main">{endpoint.path}</code>
          <span className="text-sm text-text-muted hidden md:block">{endpoint.description}</span>
        </div>
        <div className="flex items-center gap-3">
          {endpoint.hipaaCompliant && (
            <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-semibold">HIPAA</span>
          )}
          {endpoint.gdprCompliant && (
            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-semibold">GDPR</span>
          )}
          <ChevronDown
            className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            size={20}
          />
        </div>
      </button>

      {/* Endpoint Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border-subtle"
          >
            <div className="p-6 space-y-6">
              {/* Metadata */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="text-amber-500" size={16} />
                    <span className="font-semibold text-text-main">Authentication:</span>
                    <span className="text-text-muted">{endpoint.auth ? 'Required (JWT)' : 'Public'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="text-yellow-500" size={16} />
                    <span className="font-semibold text-text-main">Rate Limit:</span>
                    <span className="text-text-muted">{endpoint.rateLimit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-blue-500" size={16} />
                  <div>
                    <span className="font-semibold text-text-main">Data Retention:</span>
                    <p className="text-text-muted text-xs mt-1">{endpoint.retention}</p>
                  </div>
                </div>
              </div>

              {/* Privacy Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                  <h5 className="font-bold text-text-main text-sm mb-3 flex items-center gap-2">
                    <Database className="text-red-500" size={16} />
                    Data Collected
                  </h5>
                  <ul className="space-y-2">
                    {endpoint.dataCollected.map((item, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <h5 className="font-bold text-text-main text-sm mb-3 flex items-center gap-2">
                    <Eye className="text-blue-500" size={16} />
                    Data Shared With
                  </h5>
                  <ul className="space-y-2">
                    {endpoint.dataShared.map((item, i) => (
                      <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Request/Response Examples */}
              {endpoint.requestBody && endpoint.responseBody && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-bold text-text-main text-sm mb-2">Request Example</h5>
                    <pre className="p-4 rounded-lg bg-bg-card border border-border-subtle text-xs overflow-x-auto">
                      <code className="text-text-muted">{JSON.stringify(endpoint.requestBody, null, 2)}</code>
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-bold text-text-main text-sm mb-2">Response Example</h5>
                    <pre className="p-4 rounded-lg bg-bg-card border border-border-subtle text-xs overflow-x-auto">
                      <code className="text-text-muted">{JSON.stringify(endpoint.responseBody, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              )}

              {!endpoint.requestBody && endpoint.responseBody && (
                <div>
                  <h5 className="font-bold text-text-main text-sm mb-2">Response Example</h5>
                  <pre className="p-4 rounded-lg bg-bg-card border border-border-subtle text-xs overflow-x-auto">
                    <code className="text-text-muted">{JSON.stringify(endpoint.responseBody, null, 2)}</code>
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
