// frontend/src/features/showcase/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';
import { Layers, Code2, Shield, Activity, Users, ArrowRight, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

export const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [location]);

  const navLinks = [
    { path: '/showcase/hardware', label: 'Hardware', icon: Layers },
    { path: '/showcase/software', label: 'Software', icon: Code2 },
    { path: '/showcase/security', label: 'Security', icon: Shield },
    { path: '/showcase/timeline', label: 'Timeline', icon: Activity },
    { path: '/showcase/team', label: 'Team', icon: Users },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="w-full relative">
      {/* Glass-morphism background with subtle transparency */}
      <div className="absolute inset-0 bg-bg-card/70 backdrop-blur-2xl" />
      
      {/* Subtle bottom glow - barely noticeable accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-brand-primary/10 to-transparent blur-sm" />
      
      {/* Main border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-border-subtle" />

      {/* Content */}
      <div className="relative z-10 max-w-480 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 lg:h-16">
          
          {/* Logo - Enhanced with better shadow and animation */}
          <Link to="/showcase" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative">
              {/* Glow effect on logo */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-cyan-500 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:scale-110 group-hover:shadow-blue-500/40">
                <span className="text-white font-bold text-lg lg:text-xl">C</span>
              </div>
            </div>
            <span className="text-lg lg:text-xl font-bold bg-linear-to-r from-text-main via-text-main to-text-muted bg-clip-text text-transparent hidden xs:block transition-all group-hover:tracking-wide">
              CareSync
            </span>
          </Link>

          {/* Desktop Navigation - Enhanced spacing and effects */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={clsx(
                  "relative px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 lg:gap-2 group overflow-hidden",
                  isActive(path)
                    ? "text-brand-primary"
                    : "text-text-muted hover:text-text-main"
                )}
              >
                {/* Hover background effect */}
                <div className={clsx(
                  "absolute inset-0 rounded-lg transition-colors duration-150",
                  isActive(path) 
                    ? "bg-brand-primary/10 border border-brand-primary/20" 
                    : "bg-transparent group-hover:bg-bg-hover"
                )} />
                
                <Icon size={14} className="relative z-10 group-hover:scale-110 transition-transform lg:w-4 lg:h-4" />
                <span className="relative z-10">{label}</span>
                
                {/* Active indicator - animated bottom line */}
                {isActive(path) && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-linear-to-r from-blue-500 to-cyan-500 rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Enhanced CTA Button with shimmer effect */}
            <Link
              to="/app"
              className="hidden sm:flex relative px-4 py-1.5 lg:px-5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold items-center gap-1.5 lg:gap-2 overflow-hidden group active:scale-95 transition-transform"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-cyan-500" />
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {/* Shadow glow */}
              <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-cyan-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              
              <span className="relative z-10 text-white">Live Demo</span>
              <ArrowRight size={12} className="relative z-10 text-white lg:w-3.5 lg:h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="md:hidden p-2 -mr-2 text-text-muted hover:text-text-main hover:bg-bg-hover/50 rounded-lg transition-all active:scale-95"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={mobileMenuOpen ? 'close' : 'open'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu with glass effect */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden relative overflow-hidden"
          >
            {/* Glass background for mobile menu */}
            <div className="absolute inset-0 bg-bg-card/90 backdrop-blur-xl border-t border-border-subtle" />
            
            <div className="relative z-10 px-4 py-4 space-y-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <motion.div
                  key={path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={path}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive(path)
                        ? "text-brand-primary bg-brand-primary/10 border border-brand-primary/20"
                        : "text-text-muted hover:text-text-main hover:bg-bg-hover"
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  to="/app"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 mt-4 rounded-lg bg-linear-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform"
                >
                  Launch Live Demo
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
