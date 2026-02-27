// frontend/src/features/showcase/pages/HardwareEvolutionPage.tsx
import { motion } from 'framer-motion';
import { Hammer, Layers } from 'lucide-react';

export const HardwareEvolutionPage = () => {
  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg mx-auto"
      >
        <div className="rounded-2xl border border-border-subtle bg-bg-card p-12 text-center shadow-sm">
          
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-bg-page border border-border-subtle flex items-center justify-center mb-6 text-text-muted">
            <Layers size={32} strokeWidth={1.5} />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-text-main mb-3 tracking-tight">
            Hardware Evolution
          </h2>
          
          {/* Subtext */}
          <p className="text-text-muted text-sm leading-relaxed max-w-xs mx-auto mb-8">
            Detailed documentation of our hardware iterations, from breadboard prototypes to final PCB designs, is coming soon.
          </p>

          {/* Simple Status Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-page border border-border-subtle text-xs font-medium text-text-muted">
            <Hammer size={12} className="text-brand-primary" />
            <span>Work in Progress</span>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
