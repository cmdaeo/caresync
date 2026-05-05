// frontend/src/features/showcase/components/Footer.tsx
import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import { GithubIcon, LinkedinIcon, TwitterIcon} from '../icons/SocialIcons';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const Footer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="w-full relative bg-bg-page border-t border-border-subtle/50 pt-16 pb-8 text-sm">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/showcase" className="text-xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent inline-block mb-4">
              CareSync
            </Link>
            <p className="text-text-muted leading-relaxed mb-6">
              A zero-trust healthcare platform connecting patients, caregivers, and customized IoT hardware.
            </p>
            <div className="flex items-center gap-4 text-text-muted">
              {[GithubIcon, TwitterIcon, LinkedinIcon].map((Icon, i) => (
                <a key={i} href="#" className="hover:text-brand-primary hover:-translate-y-1 transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="text-text-main font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/showcase" className="text-text-muted hover:text-brand-primary transition-colors">Overview</Link></li>
              <li><Link to="/showcase/hardware" className="text-text-muted hover:text-brand-primary transition-colors">Hardware Architecture</Link></li>
              <li><Link to="/showcase/software" className="text-text-muted hover:text-brand-primary transition-colors">Software Stack</Link></li>
              <li><Link to="/showcase/api" className="text-text-muted hover:text-brand-primary transition-colors">Developer API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-main font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/showcase/team" className="text-text-muted hover:text-brand-primary transition-colors">Our Team</Link></li>
              <li><Link to="/showcase/timeline" className="text-text-muted hover:text-brand-primary transition-colors">Project Timeline</Link></li>
              <li><Link to="/status" className="text-text-muted hover:text-brand-primary transition-colors">System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-main font-semibold mb-4">Legal & Privacy</h4>
            <ul className="space-y-3">
              <li><Link to="/legal/privacy" className="text-text-muted hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="text-text-muted hover:text-brand-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/security" className="text-text-muted hover:text-brand-primary transition-colors">Security Overview</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-border-subtle/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} CareSync Ecosystem. All rights reserved.</p>

          {/* Theme toggle */}
          <div className="flex items-center gap-1 bg-bg-card border border-border-subtle p-1 rounded-xl">
            {(['light', 'system', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  "relative p-2 rounded-lg transition-all",
                  theme === t ? "text-brand-primary" : "text-text-muted hover:text-slate-200"
                )}
                title={`Switch to ${t}`}
              >
                {theme === t && (
                  <motion.div
                    layoutId="themePill"
                    className="absolute inset-0 bg-bg-hover rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 block">
                  {t === 'light' && <Sun size={14} />}
                  {t === 'system' && <Monitor size={14} />}
                  {t === 'dark' && <Moon size={14} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
