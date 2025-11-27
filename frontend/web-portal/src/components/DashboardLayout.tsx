import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Pill, 
  Settings, 
  LogOut, 
  Menu,
  Smartphone,  // Add this
  Users,       // Add this
  Bell,        // Add this
  FileText,    // Add this
  User         // Add this
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import NotificationCenter from './NotificationCenter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/dashboard' },
    { icon: <Calendar size={20} />, label: 'Schedule', path: '/dashboard/schedule' },
    { icon: <Pill size={20} />, label: 'Medications', path: '/dashboard/medications' },
    { icon: <Smartphone size={20} />, label: 'Devices', path: '/dashboard/devices' },
    { icon: <Users size={20} />, label: 'Caregivers', path: '/dashboard/caregivers' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/dashboard/notifications' },
    { icon: <FileText size={20} />, label: 'Reports', path: '/dashboard/reports' },
    { icon: <User size={20} />, label: 'Profile', path: '/dashboard/profile' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar - Hidden on mobile unless toggled */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-2xl font-bold text-teal-700">CareSync</span>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 w-full rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* --- UPDATED HEADER SECTION --- */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          
          {/* Mobile Menu Toggle (Left side) */}
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600">
              <Menu size={24} />
            </button>
            <span className="md:hidden font-bold text-lg text-teal-700">CareSync</span>
          </div>

          {/* Right Side Actions (Notification Center goes here!) */}
          <div className="flex items-center gap-4">
             {/* 👇 ADDED HERE 👇 */}
            <NotificationCenter /> 
            
            {/* Optional: User Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
              U
            </div>
          </div>

        </header>
        {/* ----------------------------- */}

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
