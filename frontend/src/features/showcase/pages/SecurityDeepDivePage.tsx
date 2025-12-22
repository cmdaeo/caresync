import /*React,*/ { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, AlertTriangle } from 'lucide-react';

export const SecurityDeepDivePage = () => {
  const [attackActive, setAttackActive] = useState(false);

  return (
    <div className="space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Security Architecture</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          CareSync implements defense-in-depth using AES-256 encryption at rest and strict CSP headers to mitigate XSS attacks.
        </p>
      </div>

      {/* Interactive XSS Defense Demo */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-blue-400">Cross-Site Scripting (XSS) Defense</h2>
          <p className="text-sm text-slate-400">
            React's automatic escaping combined with our Content Security Policy (CSP) neutralizes malicious script injection attempts.
          </p>
          <button 
            onClick={() => setAttackActive(true)}
            disabled={attackActive}
            className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors"
          >
            {attackActive ? 'Attack Neutralized' : 'Simulate XSS Attack'}
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 h-64 relative overflow-hidden flex items-center justify-center">
          <AnimatePresence>
            {attackActive && (
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onAnimationComplete={() => setTimeout(() => setAttackActive(false), 2000)}
                className="absolute flex items-center gap-2 text-red-500 font-mono"
              >
                <AlertTriangle />
                <span>&lt;script&gt;alert('hacked')&lt;/script&gt;</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Shield */}
          <motion.div 
            animate={{ scale: attackActive ? 1.2 : 1 }}
            className="z-10 bg-blue-500/10 p-6 rounded-full border border-blue-500/50 backdrop-blur-sm"
          >
            <ShieldCheck size={48} className="text-blue-400" />
          </motion.div>
        </div>
      </div>

      {/* Encryption Flow Diagram */}
      <div className="border-t border-slate-800 pt-16">
        <h2 className="text-2xl font-bold text-white mb-8">Data Encryption Flow</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-6 bg-slate-900 rounded border border-slate-800">
            <div className="font-mono text-green-400 mb-2">Plaintext</div>
            <div className="text-xs text-slate-500">User Medical Data</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-1 w-full bg-slate-800 relative">
              <motion.div 
                animate={{ x: [0, 100, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-1.5 left-0 w-3 h-3 bg-blue-500 rounded-full"
              />
            </div>
            <Lock className="mx-4 text-yellow-500" />
            <div className="h-1 w-full bg-slate-800" />
          </div>
          <div className="p-6 bg-slate-900 rounded border border-slate-800">
            <div className="font-mono text-red-400 mb-2">Ciphertext</div>
            <div className="text-xs text-slate-500">AES-256 Storage</div>
          </div>
        </div>
      </div>
    </div>
  );
};
