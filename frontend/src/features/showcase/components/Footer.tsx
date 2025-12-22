import React from 'react';
import { useTheme } from '../../../context/ThemeContext'; // Ensure this path is correct
import { Moon, Sun, Monitor } from 'lucide-react';
import clsx from 'clsx';

export const Footer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="w-full py-8 border-t border-border-subtle mt-20 bg-bg-card transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Copyright */}
        <div className="text-sm text-text-muted">
          © {new Date().getFullYear()} CareSync. All rights reserved.
        </div>

        {/* Right: Innovative Theme Toggle */}
        <div className="flex items-center gap-1 bg-bg-page p-1 rounded-full border border-border-subtle shadow-inner">
          {(['light', 'system', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={clsx(
                "relative px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-200",
                theme === t 
                  ? "bg-bg-card text-brand-primary shadow-sm border border-border-subtle" 
                  : "text-text-muted hover:text-text-main"
              )}
            >
              {t === 'light' && <Sun size={14} />}
              {t === 'system' && <Monitor size={14} />}
              {t === 'dark' && <Moon size={14} />}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
