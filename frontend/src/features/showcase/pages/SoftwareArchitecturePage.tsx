// frontend/src/features/showcase/pages/SoftwareArchitecturePage.tsx
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Smartphone,
  Lock
} from 'lucide-react';
import apiDocumentationRaw from '../../../assets/api-docs.json';

import { useTheme } from '../../../context/ThemeContext';

/* ════════════════════════════════════════════════════════════════
   INTERFACES & TYPES
════════════════════════════════════════════════════════════════ */
interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  responseBody?: any;
}

interface ApiDocumentation {
  endpoints: ApiEndpoint[];
  totalEndpoints: number;
  generated: string;
  version: string;
}

interface TechItem {
  label: string;
  description: string;
  detail?: string;
}

type ThemeColor = 'blue' | 'green' | 'purple';

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
const TechCard = ({ icon: Icon, title, items, color }: { icon: any, title: string, items: TechItem[], color: ThemeColor }) => {
  const colorMap = {
    blue: 'border-blue-500/20 text-blue-500 bg-blue-500/10 hover:border-blue-500/40 hover:bg-blue-500/[0.02]',
    green: 'border-green-500/20 text-green-500 bg-green-500/10 hover:border-green-500/40 hover:bg-green-500/[0.02]',
    purple: 'border-purple-500/20 text-purple-500 bg-purple-500/10 hover:border-purple-500/40 hover:bg-purple-500/[0.02]'
  };

  const bgHoverMap = {
    blue: 'hover:border-blue-500/40 hover:bg-blue-500/[0.02]',
    green: 'hover:border-green-500/40 hover:bg-green-500/[0.02]',
    purple: 'hover:border-purple-500/40 hover:bg-purple-500/[0.02]'
  };

  return (
    <motion.div variants={fadeUp} className={`p-5 rounded-xl border border-border-subtle bg-bg-card/40 transition-all duration-300 group ${bgHoverMap[color]}`}>
      <div className="flex items-center gap-3 mb-5 border-b border-border-subtle/50 pb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${colorMap[color].split(' hover')[0]}`}>
          <Icon size={20} />
        </div>
        <h4 className="text-base font-bold text-text-main">{title}</h4>
      </div>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${colorMap[color].split(' ')[1].replace('text-', 'bg-')}`} />
            <div>
              <span className="text-sm font-bold text-text-main">{item.label}</span>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.description}</p>
              {item.detail && (
                <p className="text-[10px] font-mono text-text-muted/70 mt-1 uppercase tracking-wider">{item.detail}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const EndpointRow = ({ endpoint, isExpanded, onToggle }: { endpoint: ApiEndpoint, isExpanded: boolean, onToggle: () => void }) => {
  const methodColors: Record<string, string> = {
    GET: 'text-green-500 bg-green-500/10 border-green-500/20',
    POST: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    PUT: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    DELETE: 'text-red-500 bg-red-500/10 border-red-500/20',
    PATCH: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  };

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-card/40 hover:border-border-focus transition-colors">
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <div className="flex items-center gap-4 min-w-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${methodColors[endpoint.method] || 'text-text-muted'}`}>
            {endpoint.method}
          </span>
          <code className="text-sm font-mono text-text-main truncate">{endpoint.path}</code>
        </div>
        <ChevronDown size={16} className={`text-text-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border-subtle bg-bg-page/50"
          >
            <div className="p-4 text-sm space-y-4">
              <p className="text-text-muted leading-relaxed">{endpoint.description}</p>
              {endpoint.responseBody && (
                <div>
                  <div className="text-xs font-bold text-text-main mb-2 uppercase tracking-wider">Response Example</div>
                  <pre className="p-3 rounded-lg bg-bg-card border border-border-subtle overflow-x-auto text-xs font-mono text-text-muted custom-scrollbar">
                    {JSON.stringify(endpoint.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const SoftwareArchitecturePage = () => {
  const { theme: _theme } = useTheme();
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const apiDocumentation = apiDocumentationRaw as ApiDocumentation;
  const apiEndpoints: ApiEndpoint[] = apiDocumentation.endpoints || [];

  const updatedLabel = useMemo(() => {
    try {
      return new Date(apiDocumentation.generated).toLocaleDateString();
    } catch {
      return apiDocumentation.generated;
    }
  }, [apiDocumentation.generated]);

  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-primary/[0.03] rounded-full blur-[120px]" />
      
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto mb-20 text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight mb-5 leading-tight">
          Software Architecture
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-24">
        
        {/* ════════ FRONTEND SECTION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <Globe className="text-blue-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Frontend Stack</h2>
              <p className="text-[11px] font-mono text-blue-500 uppercase tracking-widest mt-1">React 19 SPA + Capacitor</p>
            </div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TechCard 
              color="blue" title="Core Architecture" icon={Code2}
              items={[
                { label: 'Vite 7', description: 'Instant server start with lightning-fast HMR.', detail: 'Cold start in <500ms' },
                { label: 'React 19', description: 'Latest concurrency features and server components.', detail: '15% smaller bundle' },
                { label: 'Zustand', description: 'Minimal boilerplate and transient state updates.', detail: 'Just 1.1kB gzipped' },
              ]} 
            />
            <TechCard 
              color="blue" title="Styling & Motion" icon={Zap}
              items={[
                { label: 'Tailwind 4', description: 'Zero-runtime CSS-in-JS alternative.', detail: 'JIT engine optimization' },
                { label: 'Framer Motion', description: 'Production-grade hardware-accelerated animations.', detail: 'Declarative layout transitions' },
                { label: 'Dark Mode', description: 'System-aware theming built into core design tokens.', detail: 'Dynamic CSS variables' },
              ]} 
            />
            <TechCard 
              color="blue" title="Mobile Bridge" icon={Smartphone}
              items={[
                { label: 'Capacitor 8', description: 'Bridges web app to native iOS/Android containers.', detail: 'Single Codebase' },
                { label: 'Custom NFC', description: 'Custom Java/Swift plugin for medical-grade NFC.', detail: 'Hardware access layer' },
                { label: 'Biometrics', description: 'Uses FaceID/TouchID for secure, fast login.', detail: 'Native OS integration' },
              ]} 
            />
          </motion.div>
        </section>

        {/* ════════ BACKEND SECTION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <Server className="text-green-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Backend Stack</h2>
              <p className="text-[11px] font-mono text-green-500 uppercase tracking-widest mt-1">Node.js REST + Real-time</p>
            </div>
          </div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TechCard 
              color="green" title="Core Services" icon={Server}
              items={[
                { label: 'Express 4.18', description: 'Battle-tested middleware architecture.', detail: 'Highly extensible' },
                { label: 'Socket.IO 4.7', description: 'Real-time patient vitals and sync events.', detail: 'WebSockets + Polling' },
                { label: 'Winston', description: 'Structured JSON logging for observability.', detail: 'Daily log rotation' },
              ]} 
            />
            <TechCard 
              color="green" title="Data Layer" icon={Database}
              items={[
                { label: 'Sequelize ORM', description: 'Type-safe queries and migration management.', detail: 'Postgres Dialect' },
                { label: 'PostgreSQL', description: 'Supabase-hosted database for scalable persistence.', detail: 'Managed Cloud SQL' },
                { label: 'Redis', description: 'High-performance cache for sessions & rate limits.', detail: 'Sub-millisecond latency' },
              ]} 
            />
            <TechCard 
              color="green" title="Security Middleware" icon={Lock}
              items={[
                { label: 'Helmet', description: 'Sets secure HTTP headers (CSP, HSTS).', detail: 'Prevents XSS & Clickjacking' },
                { label: 'Express Validator', description: 'Request payload validation and sanitization.', detail: 'Chained rule sets' },
                { label: 'Rate Limiting', description: 'Prevents DDoS via Redis-backed IP tracking.', detail: 'Global & Auth routes' },
              ]} 
            />
          </motion.div>
        </section>

        {/* ════════ API DOCUMENTATION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <FileText className="text-purple-500" size={28} />
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-main">API Documentation</h2>
                <p className="text-[11px] font-mono text-purple-500 uppercase tracking-widest mt-1">RESTful Architecture</p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold mb-1">
                  v{apiDocumentation.version}
                </span>
                <p className="text-xs text-text-muted">{apiDocumentation.totalEndpoints} Endpoints • Updated {updatedLabel}</p>
              </div>
            </div>
          </div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-3">
            {apiEndpoints.map((endpoint, i) => (
              <EndpointRow
                key={`${endpoint.method}-${endpoint.path}-${i}`}
                endpoint={endpoint}
                isExpanded={expandedEndpoint === endpoint.path}
                onToggle={() => setExpandedEndpoint(expandedEndpoint === endpoint.path ? null : endpoint.path)}
              />
            ))}
          </motion.div>
        </section>

      </div>
    </div>
  );
};