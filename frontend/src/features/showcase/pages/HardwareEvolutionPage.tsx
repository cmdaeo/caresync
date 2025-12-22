import /*React,*/ { useState } from 'react';
import { motion } from 'framer-motion';

export const HardwareEvolutionPage = () => {
  const [stage, setStage] = useState<'breadboard' | 'pcb' | 'final'>('breadboard');

  const stages = {
    breadboard: { title: "Prototype v1", desc: "Arduino Uno + Jumper Wires", color: "border-yellow-500/50" },
    pcb: { title: "Custom PCB v2", desc: "SMD Components, Integrated Power", color: "border-green-500/50" },
    final: { title: "Production v3", desc: "Injection Molded Enclosure", color: "border-blue-500/50" }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Hardware Evolution</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        {(Object.keys(stages) as Array<keyof typeof stages>).map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            className={`px-4 py-2 rounded text-sm font-mono transition-all ${
              stage === s ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Visualizer */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`aspect-video rounded-xl border-2 ${stages[stage].color} bg-slate-900/50 flex items-center justify-center relative overflow-hidden`}
      >
        <div className="absolute top-4 left-4">
          <div className="text-xl font-bold text-white">{stages[stage].title}</div>
          <div className="text-sm text-slate-400">{stages[stage].desc}</div>
        </div>

        {/* Dynamic Content Simulation */}
        {stage === 'breadboard' && (
          <div className="w-64 h-48 border-4 border-slate-700 bg-slate-800 rounded grid grid-cols-12 gap-1 p-2">
            {/* Simulated Breadboard holes */}
            {[...Array(48)].map((_, i) => <div key={i} className="bg-black/40 rounded-full w-full h-full" />)}
          </div>
        )}
        
        {stage === 'pcb' && (
          <div className="w-48 h-48 bg-green-900/80 border border-green-700 rounded relative">
            <div className="absolute top-2 left-2 w-8 h-8 bg-black rounded" /> {/* Chip */}
            <div className="absolute bottom-4 right-4 w-32 h-1 bg-yellow-600/50" /> {/* Trace */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-400 font-mono text-xs">ATMEGA328P</div>
          </div>
        )}

        {stage === 'final' && (
          <div className="w-40 h-56 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-center">
            <span className="text-blue-400 font-bold">CareSync</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
