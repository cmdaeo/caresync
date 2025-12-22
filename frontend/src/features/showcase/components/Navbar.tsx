import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Server, Code, Shield, Activity, Users, ArrowRight } from 'lucide-react';

const navItems = [
  { name: 'Hardware', path: '/showcase/hardware', icon: Server },
  { name: 'Software', path: '/showcase/software', icon: Code },
  { name: 'Security', path: '/showcase/security', icon: Shield },
  { name: 'Timeline', path: '/showcase/timeline', icon: Activity },
  { name: 'Team', path: '/showcase/team', icon: Users },
];

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-page/80 backdrop-blur-md transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center gap-2">
          {/* Brand Box: Keep text-white because background is always blue */}
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-primary/20">
            C
          </div>
          {/* Text: Adapts automatically */}
          <span className="text-xl font-bold text-text-main tracking-tight">
            CareSync
          </span>
        </div>

        {/* NAV LINKS */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 group
                ${isActive 
                  ? 'text-brand-primary bg-brand-primary/5' 
                  : 'text-text-muted hover:text-text-main hover:bg-bg-hover' // Uses semantic hover color
                }
              `}
            >
              <item.icon size={16} className="opacity-70 group-hover:opacity-100" />
              {item.name}
            </NavLink>
          ))}
        </div>

        {/* BUTTON */}
        <div>
          <NavLink 
            to="/app" 
            className="hidden md:flex items-center gap-2 bg-text-main text-bg-page px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            {/* Logic: In Light Mode, Button is Black (text-main) with White Text (bg-page). 
                In Dark Mode, Button is White (text-main) with Black Text (bg-page). 
                It creates a high-contrast inverse button automatically. */}
            Live Demo <ArrowRight size={14} />
          </NavLink>
        </div>

      </div>
    </motion.nav>
  );
};
