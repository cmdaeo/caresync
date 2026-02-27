// frontend/src/features/showcase/components/Footer.tsx
import { useTheme } from '../../../context/ThemeContext';
import { Moon, Sun, Monitor, Github, Twitter, Linkedin } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export const Footer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="w-full relative">
      {/* Background + subtle top glow */}
      <div className="absolute inset-0 bg-bg-card/80 backdrop-blur-xl border-t border-border-subtle/50" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-primary/10 to-transparent" />

      {/* 3 equal columns: left / center / right */}
      <div className="relative z-10 max-w-480 mx-auto px-4 py-3 sm:py-0 sm:h-12 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-xs">
        
        {/* LEFT: Copyright (centered within its column on mobile & desktop) */}
        <div className="flex items-center justify-center sm:justify-start text-text-muted/80">
          <span className="font-medium tracking-wide">© 2026 CareSync</span>
        </div>

        {/* CENTER: Footer links – ALWAYS centered */}
        <div className="flex items-center justify-center gap-6 text-text-muted font-medium">
          {['Privacy', 'Terms', 'Status'].map((item) => (
            <a 
              key={item} 
              href="#" 
              className="relative hover:text-text-main transition-colors group/link py-1"
            >
              {item}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-brand-primary group-hover/link:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* RIGHT: Socials + Theme toggle, aligned to end on desktop */}
        <div className="flex items-center justify-center sm:justify-end gap-4">
          
          {/* Social icons */}
          <div className="flex items-center gap-1 text-text-muted/70">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="p-1.5 rounded-md hover:bg-bg-hover transition-all hover:text-brand-primary hover:scale-110"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-0.5 bg-bg-page/40 p-0.5 rounded-lg border border-border-subtle/50 backdrop-blur-sm">
            {(['light', 'system', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={clsx(
                  "relative p-1.5 rounded-md transition-all outline-none cursor-pointer",
                  theme === t ? "text-brand-primary" : "text-text-muted hover:text-text-main"
                )}
                title={`Switch to ${t}`}
              >
                {theme === t && (
                  <motion.div
                    layoutId="themePill"
                    className="absolute inset-0 bg-bg-card border border-border-subtle/50 rounded-md shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 block">
                  {t === 'light' && <Sun size={12} />}
                  {t === 'system' && <Monitor size={12} />}
                  {t === 'dark' && <Moon size={12} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
