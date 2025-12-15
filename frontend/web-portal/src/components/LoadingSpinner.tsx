import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { COLORS } from '../theme/colors';

interface LoadingSpinnerProps {
  isLoading?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isLoading = true }) => {
  const progress = useMotionValue(0);
  const [isVisible, setIsVisible] = useState(true);
  const roundedProgress = useTransform(progress, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(progress, 90, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      animate(progress, 100, { duration: 0.2 }).then(() => {
         setTimeout(() => setIsVisible(false), 200);
      });
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        
        <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
            <svg width="0" height="0">
              <defs>
                <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={COLORS.balticBlue} />
                  <stop offset="100%" stopColor={COLORS.freshSky} />
                </linearGradient>
              </defs>
            </svg>

            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160">
               <circle 
                 cx="80" cy="80" r="70" 
                 stroke={COLORS.slate200} 
                 strokeWidth="6" 
                 fill="none" 
               />
               <motion.circle
                  cx="80" cy="80" r="70" 
                  stroke="url(#spinnerGradient)" 
                  strokeWidth="6" 
                  fill="none"
                  strokeLinecap="round"
                  style={{ pathLength: useTransform(progress, v => v / 100) }}
               />
            </svg>
            
            <motion.div 
              className="font-mono text-4xl font-bold"
              style={{ color: COLORS.balticBlue }}
            >
                <ProgressValue value={roundedProgress} />%
            </motion.div>
        </div>

        <div className="text-center space-y-3">
          <h2 
            className="text-2xl font-bold tracking-tight"
            style={{ color: COLORS.balticBlue }}
          >
            CareSync
          </h2>
          
          <p 
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: COLORS.balticBlueDark, opacity: 0.6 }}
          >
            © 2025 CareSync Ecosystem
          </p>
        </div>

      </div>
    </div>
  );
};

const ProgressValue = ({ value }: { value: any }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => value.on("change", setDisplay), [value]);
  return <>{display}</>;
};

export default LoadingSpinner;
