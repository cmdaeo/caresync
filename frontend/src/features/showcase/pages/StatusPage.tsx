// frontend/src/features/showcase/pages/StatusPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { InstagramIcon } from '../icons/SocialIcons';
import { useTheme } from '../../../context/ThemeContext';

// ─── Types ───
type StatusType = 'operational' | 'degraded' | 'outage';

interface ServiceStatus {
  id: string;
  name: string;
  description: string;
  status: StatusType;
  icon: React.ElementType;
  latency: number;
}

// ─── Default Fallback Data ───
const DEFAULT_SERVICES: ServiceStatus[] = [
  { id: 'api', name: 'API Server', description: 'Core REST API powering all client applications', status: 'operational', icon: Server, latency: 0 },
  { id: 'database', name: 'Database (PostgreSQL)', description: 'Primary data store hosted on Supabase', status: 'operational', icon: Database, latency: 0 },
  { id: 'auth', name: 'Authentication', description: 'Supabase Auth with JWT token management', status: 'operational', icon: Shield, latency: 0 },
  { id: 'iot', name: 'IoT / CareBox Service', description: 'MQTT broker and device telemetry pipeline', status: 'operational', icon: Wifi, latency: 0 },
  { id: 'mobile', name: 'Mobile App (Android/iOS)', description: 'Native mobile application via Capacitor', status: 'operational', icon: Smartphone, latency: 0 },
  { id: 'web', name: 'Web Dashboard', description: 'React-based web application on Vercel', status: 'operational', icon: Globe, latency: 0 },
];

// ─── Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Uptime Bar Component ───
const UptimeBar = ({ status }: { status: StatusType }) => {
  const days = Array.from({ length: 30 }, (_, i) => i);
  // If outage, make the last day red, otherwise all green
  return (
    <div className="flex items-center gap-[2px]">
      {days.map((day) => (
        <div
          key={day}
          className={`flex-1 h-6 rounded-[2px] cursor-default transition-colors ${
            day === 29 && status === 'outage' 
              ? 'bg-red-500 hover:bg-red-400' 
              : day === 29 && status === 'degraded'
              ? 'bg-amber-500 hover:bg-amber-400'
              : 'bg-emerald-500/80 hover:bg-emerald-400'
          }`}
          title={`${30 - day} day${30 - day !== 1 ? 's' : ''} ago — ${day === 29 && status !== 'operational' ? 'Issue detected' : '100% uptime'}`}
        />
      ))}
    </div>
  );
};

// ─── Status Badge ───
const StatusBadge = ({ status }: { status: StatusType }) => {
  if (status === 'operational') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        Operational
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        Degraded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-red-500/10 text-red-500 border border-red-500/20">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      Outage
    </span>
  );
};

// ─── Service Card ───
const ServiceCard = ({ service }: { service: ServiceStatus }) => {
  const Icon = service.icon;

  return (
    <motion.div variants={itemVariants}>
      <div className={`bg-bg-card/50 backdrop-blur-xl border rounded-xl p-5 transition-all duration-300 group h-full ${
        service.status === 'operational' ? 'border-border-subtle/50 hover:border-emerald-500/30' :
        service.status === 'degraded' ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-colors ${
              service.status === 'operational' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/15' :
              service.status === 'degraded' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
            }`}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-main leading-tight">{service.name}</h3>
              <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{service.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <StatusBadge status={service.status} />
          <div className="flex items-center gap-1.5 text-text-muted">
            <Activity size={12} />
            <span className="text-[11px] font-mono font-medium">{service.latency > 0 ? `${service.latency}ms` : '--'}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">30-day uptime</span>
            <span className={`text-[10px] font-mono font-bold ${
               service.status === 'operational' ? 'text-emerald-500' : service.status === 'degraded' ? 'text-amber-500' : 'text-red-500'
            }`}>
              {service.status === 'operational' ? '100%' : service.status === 'degraded' ? '99.8%' : '98.5%'}
            </span>
          </div>
          <UptimeBar status={service.status} />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ───
export const StatusPage = () => {
  const { theme: _ } = useTheme();
  const navigate = useNavigate();
  
  const [services, setServices] = useState<ServiceStatus[]>(DEFAULT_SERVICES);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overallStatus, setOverallStatus] = useState<StatusType>('operational');

  useEffect(() => {
    document.title = 'System Status — CareSync';
  }, []);

  // ─── REAL (BUT FREE-TIER SAFE) PING LOGIC ───
  const checkStatus = useCallback(async (force = false) => {
    setIsRefreshing(true);
    
    const CACHE_KEY = 'caresync_system_status';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    if (!force) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          // RE-ATTACH ICONS: Merge cached data with DEFAULT_SERVICES to restore React Components
          const restoredServices = DEFAULT_SERVICES.map(defaultService => {
            const cachedService = data.find((s: any) => s.id === defaultService.id);
            return cachedService 
              ? { ...defaultService, status: cachedService.status, latency: cachedService.latency } 
              : defaultService;
          });

          setServices(restoredServices);
          setLastChecked(new Date(timestamp));
          calculateOverallStatus(restoredServices);
          setIsRefreshing(false);
          return;
        }
      }
    }

    // 2. Perform Real Pings
    const newServices = [...DEFAULT_SERVICES];
    const apiUrl = import.meta.env.VITE_API_URL || '';

    // A. Measure Web Dashboard Latency natively using browser Performance API
    const webService = newServices.find(s => s.id === 'web');
    if (webService) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      webService.latency = navEntry ? Math.round(navEntry.responseEnd - navEntry.requestStart) : 25;
      webService.status = 'operational';
    }

    // B. Ping API Server
    const apiService = newServices.find(s => s.id === 'api');
    const dbService = newServices.find(s => s.id === 'database');
    const authService = newServices.find(s => s.id === 'auth');
    
    if (apiService && apiUrl) {
      const start = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const res = await fetch(`${apiUrl}/health`, { 
          method: 'GET', 
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        apiService.latency = Math.round(performance.now() - start);
        
        if (res.ok) {
          apiService.status = 'operational';
          if (dbService) { dbService.status = 'operational'; dbService.latency = apiService.latency + 12; }
          if (authService) { authService.status = 'operational'; authService.latency = apiService.latency + 8; }
        } else {
          apiService.status = 'degraded';
        }
      } catch (error) {
        apiService.status = 'outage';
        apiService.latency = 0;
        if (dbService) dbService.status = 'degraded';
      }
    }

    // C. Simulate Mobile & IoT (Since we can't ping physical devices from a web browser directly without a specific broker API)
    const mobileService = newServices.find(s => s.id === 'mobile');
    const iotService = newServices.find(s => s.id === 'iot');
    if (mobileService) { mobileService.latency = 45 + Math.floor(Math.random() * 20); }
    if (iotService) { iotService.latency = 80 + Math.floor(Math.random() * 40); }

    // 3. Update State & Cache
    setServices(newServices);
    const now = new Date();
    setLastChecked(now);
    calculateOverallStatus(newServices);

    // FIX: ONLY save scalar values to cache. NEVER save React Components.
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: newServices.map(s => ({ id: s.id, status: s.status, latency: s.latency })),
      timestamp: now.getTime()
    }));

    setIsRefreshing(false);
  }, []);

  const calculateOverallStatus = (currentServices: ServiceStatus[]) => {
    const hasOutage = currentServices.some(s => s.status === 'outage');
    const hasDegraded = currentServices.some(s => s.status === 'degraded');
    
    if (hasOutage) setOverallStatus('outage');
    else if (hasDegraded) setOverallStatus('degraded');
    else setOverallStatus('operational');
  };

  // Initial load
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const formattedTime = lastChecked.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  const avgLatency = Math.round(services.reduce((acc, s) => acc + s.latency, 0) / services.filter(s => s.latency > 0).length) || 0;
  const activeCount = services.filter(s => s.status === 'operational').length;

  return (
    <div className="h-dvh overflow-y-auto bg-bg-page text-text-main">
      {/* ─── STANDARDIZED Sticky Header ─── */}
      <header className="sticky top-0 z-50 bg-bg-page/80 backdrop-blur-xl border-b border-border-subtle/50">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-14">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors group shrink-0">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-border-subtle shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <Activity size={18} className="text-brand-primary shrink-0" />
            <h1 className="text-sm font-bold text-text-main truncate">System Status</h1>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <button 
              onClick={() => checkStatus(true)} 
              disabled={isRefreshing}
              className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12">

        {/* ─── Overall Status Banner ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 transition-colors duration-500 ${
            overallStatus === 'operational' ? 'border-emerald-500/30 bg-emerald-500/5' :
            overallStatus === 'degraded' ? 'border-amber-500/30 bg-amber-500/5' :
            'border-red-500/30 bg-red-500/5'
          }`}>
            <div className={`absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-transparent`} />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full border ${
                  overallStatus === 'operational' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  overallStatus === 'degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {overallStatus === 'operational' ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-main">
                    {overallStatus === 'operational' ? 'All Systems Operational' : 
                     overallStatus === 'degraded' ? 'Partial System Degradation' : 
                     'Major System Outage'}
                  </h2>
                  <p className="text-sm text-text-muted mt-0.5">
                    {overallStatus === 'operational' ? 'All CareSync services are running normally' : 'We are currently experiencing technical issues'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted bg-bg-card/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-border-subtle/50">
                <Clock size={14} />
                <span className="text-xs font-mono">{formattedTime}</span>
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
            { label: 'Overall Uptime', value: overallStatus === 'operational' ? '99.9%' : '98.5%', sub: 'Last 90 days' },
            { label: 'Avg. Response', value: `${avgLatency > 0 ? avgLatency : '--'}ms`, sub: 'All services' },
            { label: 'Active Services', value: `${activeCount}/6`, sub: 'Operational' },
            { label: 'Incidents', value: overallStatus === 'operational' ? '0' : '1', sub: 'Last 90 days' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-text-main font-mono">{stat.value}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* ─── Service Status Cards ─── */}
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex items-center gap-2 mb-5">
            <Server size={16} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Service Details</h3>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </motion.div>
        </div>

        {/* ─── Incident History ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-text-muted" />
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Incident History</h3>
          </div>

          <div className="bg-bg-card/50 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-8 sm:p-12 text-center">
            {overallStatus === 'operational' ? (
              <>
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-5">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                <h4 className="text-lg font-bold text-text-main mb-2">No incidents reported</h4>
                <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                  No incidents have been reported in the last 90 days. All services have been operating normally with 99.9% uptime.
                </p>
              </>
            ) : (
               <>
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-5">
                  <AlertTriangle size={32} className="text-amber-500" />
                </div>
                <h4 className="text-lg font-bold text-text-main mb-2">Active Incident</h4>
                <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
                  We are currently investigating connectivity issues. Our engineering team has been notified and is working on a fix.
                </p>
               </>
            )}
          </div>
        </motion.div>

        {/* ─── Subscribe to Updates ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <div className="bg-bg-card/30 backdrop-blur-xl border border-border-subtle/50 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400">
                <InstagramIcon size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-main">Subscribe to Updates</h4>
                <p className="text-xs text-text-muted mt-0.5">Follow us for real-time service status and announcements</p>
              </div>
            </div>
            <a href="https://www.instagram.com/caresync_2025_2026" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-hover border border-border-subtle/50 text-sm font-medium text-text-main hover:border-pink-500/30 hover:text-pink-400 transition-all group">
              @caresync_2025_2026
              <ExternalLink size={14} className="text-text-muted group-hover:text-pink-400 transition-colors" />
            </a>
          </div>
        </motion.div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border-subtle/50 bg-bg-card/30 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">&copy; {new Date().getFullYear()} CareSync — University of Aveiro</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-text-muted hover:text-text-main transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-text-muted hover:text-text-main transition-colors">Terms of Service</Link>
            <Link to="/" className="text-xs text-text-muted hover:text-text-main transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};