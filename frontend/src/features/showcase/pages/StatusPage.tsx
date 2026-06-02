// frontend/src/features/showcase/pages/StatusPage.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  Server,
  Database,
  Shield,
  Smartphone,
  Globe,
  CheckCircle,
  Clock,
  Wifi,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import { InstagramIcon } from '../icons/SocialIcons'
import { useTheme } from '../../../context/ThemeContext'

// ─── Types ───
interface ServiceStatus {
  id: string
  name: string
  description: string
  status: 'operational' | 'degraded' | 'outage'
  icon: React.ElementType
  latency: number
}

// ─── Data ───
const SERVICES: ServiceStatus[] = [
  {
    id: 'api',
    name: 'API Server',
    description: 'Core REST API powering all client applications',
    status: 'operational',
    icon: Server,
    latency: 45,
  },
  {
    id: 'database',
    name: 'Database (PostgreSQL)',
    description: 'Primary data store hosted on Supabase',
    status: 'operational',
    icon: Database,
    latency: 12,
  },
  {
    id: 'auth',
    name: 'Authentication',
    description: 'Supabase Auth with JWT token management',
    status: 'operational',
    icon: Shield,
    latency: 38,
  },
  {
    id: 'iot',
    name: 'IoT / CareBox Service',
    description: 'MQTT broker and device telemetry pipeline',
    status: 'operational',
    icon: Wifi,
    latency: 89,
  },
  {
    id: 'mobile',
    name: 'Mobile App (Android/iOS)',
    description: 'Native mobile application via Capacitor',
    status: 'operational',
    icon: Smartphone,
    latency: 22,
  },
  {
    id: 'web',
    name: 'Web Dashboard',
    description: 'React-based web application on Vercel',
    status: 'operational',
    icon: Globe,
    latency: 31,
  },
]

// ─── Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

// ─── Uptime Bar Component ───
const UptimeBar = () => {
  const days = Array.from({ length: 30 }, (_, i) => i)
  return (
    <div className="flex items-center gap-[2px]">
      {days.map((day) => (
        <div
          key={day}
          className="flex-1 h-6 rounded-[2px] bg-emerald-500/80 hover:bg-emerald-400 transition-colors cursor-default"
          title={`${30 - day} day${30 - day !== 1 ? 's' : ''} ago — 100% uptime`}
        />
      ))}
    </div>
  )
}

// ─── Status Badge ───
const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'operational') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Operational
      </span>
    )
  }
  return null
}

// ─── Service Card ───
const ServiceCard = ({ service }: { service: ServiceStatus }) => {
  const Icon = service.icon

  return (
    <motion.div variants={itemVariants}>
      <div className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-300 group h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/15 transition-colors">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main leading-tight">{service.name}</h3>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{service.description}</p>
            </div>
          </div>
        </div>

        {/* Status + Latency */}
        <div className="flex items-center justify-between mt-4">
          <StatusBadge status={service.status} />
          <div className="flex items-center gap-1.5 text-text-muted">
            <Activity size={12} />
            <span className="text-[11px] font-mono font-medium">{service.latency}ms</span>
          </div>
        </div>

        {/* Uptime Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">30-day uptime</span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">100%</span>
          </div>
          <UptimeBar />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Page ───
export const StatusPage = () => {
  const { theme: _ } = useTheme()
  const navigate = useNavigate()
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  useEffect(() => {
    document.title = 'System Status — CareSync'
  }, [])

  // Simulate periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const formattedTime = lastChecked.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  return (
    <div className="h-dvh overflow-y-auto bg-bg-page text-text-main">
      {/* ─── STANDARDIZED Sticky Header ─── */}
      <header className="sticky top-0 z-50 bg-bg-page/80 backdrop-blur-xl border-b border-border-subtle/50">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-14">
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
            <Activity size={18} className="text-brand-primary shrink-0" />
            <h1 className="text-sm font-bold text-text-main truncate">System Status</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <Link
              to="/privacy"
              className="text-xs text-text-muted hover:text-brand-primary transition-colors hidden sm:inline"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-text-muted hover:text-brand-primary transition-colors hidden sm:inline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">

        {/* ─── Overall Status Banner ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8">
            {/* Subtle gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-main">All Systems Operational</h2>
                  <p className="text-sm text-text-muted mt-0.5">All CareSync services are running normally</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted bg-bg-card/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-border-subtle/50">
                <Clock size={14} />
                <span className="text-xs font-mono">{formattedTime}</span>
                <span className="relative flex h-1.5 w-1.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Uptime Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          {[
            { label: 'Overall Uptime', value: '99.9%', sub: 'Last 90 days' },
            { label: 'Avg. Response', value: '39ms', sub: 'All services' },
            { label: 'Active Services', value: '6/6', sub: 'Operational' },
            { label: 'Incidents', value: '0', sub: 'Last 90 days' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-4 text-center"
            >
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-text-main font-mono">{stat.value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ─── Service Status Cards ─── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center gap-2 mb-5"
          >
            <Server size={16} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Service Details</h3>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </motion.div>
        </div>

        {/* ─── Incident History ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Incident History</h3>
          </div>

          <div className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-text-main mb-2">No incidents reported</h4>
            <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
              No incidents have been reported in the last 90 days. All services have been operating normally with 99.9%
              uptime.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              Monitoring is active
            </div>
          </div>
        </motion.div>

        {/* ─── Subscribe to Updates ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-bg-card/30 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
                <InstagramIcon size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-main">Subscribe to Updates</h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Follow us for real-time service status and announcements
                </p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/caresync_2025_2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-hover border border-border-subtle/50 text-sm font-medium text-text-main hover:border-pink-500/30 hover:text-pink-400 transition-all group"
            >
              @caresync_2025_2026
              <ExternalLink size={14} className="text-text-muted group-hover:text-pink-400 transition-colors" />
            </a>
          </div>
        </motion.div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-subtle/50 bg-bg-card/30 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} CareSync — University of Aveiro
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-text-muted hover:text-text-main transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-text-muted hover:text-text-main transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="text-xs text-text-muted hover:text-text-main transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}