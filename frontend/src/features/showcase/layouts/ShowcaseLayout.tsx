//import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { CircuitBoard, Shield, Layers, Users, Activity } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }: any) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-400 hover:text-white'
      }`
    }
  >
    <Icon size={18} />
    <span className="font-mono text-sm">{label}</span>
  </NavLink>
);

export const ShowcaseLayout = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(30,41,59,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.1)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none" />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-slate-800/60 bg-[#020617]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">C</div>
            <span className="font-bold tracking-tight text-white">CareSync <span className="text-blue-500 font-mono text-xs">ENG</span></span>
          </div>
          <div className="flex gap-2">
            <NavItem to="/showcase/hardware" icon={CircuitBoard} label="Hardware" />
            <NavItem to="/showcase/software" icon={Layers} label="Software" />
            <NavItem to="/showcase/security" icon={Shield} label="Security" />
            <NavItem to="/showcase/timeline" icon={Activity} label="Timeline" />
            <NavItem to="/showcase/team" icon={Users} label="Team" />
          </div>
          <NavLink to="/app" className="bg-white text-black px-4 py-1.5 rounded text-sm font-semibold hover:bg-gray-200">
            Live Demo
          </NavLink>
        </div>
      </nav>

      <main className="relative max-w-7xl mx-auto px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
};
