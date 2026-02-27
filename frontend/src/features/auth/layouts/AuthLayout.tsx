// src/features/auth/layouts/AuthLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export const AuthLayout = () => {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  // Use a precise pixel width so it's not too wide (zoomed) but fits 2 columns
  const containerWidth = isRegister ? "max-w-[460px]" : "max-w-[400px]";

  return (
    <div className="h-dvh w-full overflow-y-auto bg-bg-page text-text-main transition-colors duration-200 themed-scrollbar flex flex-col items-center px-4 sm:px-6 lg:px-8">
      
      {/* Reduced py-10 to py-6 so the form fits on shorter laptop screens without scrolling */}
      <div className={`w-full ${containerWidth} my-auto py-6 transition-all duration-300`}>
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-5 sm:mb-6"
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-all group-hover:scale-105">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-linear-to-r from-text-main via-text-main to-text-muted bg-clip-text text-transparent transition-colors tracking-tight">
              CareSync
            </span>
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-bg-card py-6 px-5 sm:py-7 sm:px-8 shadow-md rounded-2xl sm:rounded-3xl border border-border-subtle transition-colors duration-200 w-full"
        >
          <Outlet />
        </motion.div>
        
      </div>
      
    </div>
  );
};
