//import React from 'react';
import { motion } from 'framer-motion';

// Mock data moved here for simplicity, but should be in src/mock/
const timelineEvents = [
  { year: 'Q3 2024', category: 'Hardware', title: 'Breadboard Prototype', desc: 'Proof of concept using Arduino Uno.' },
  { year: 'Q4 2024', category: 'Firmware', title: 'I2C Protocol', desc: 'Established comms between MCU and Sensors.' },
  { year: 'Q4 2024', category: 'Software', title: 'React Initial Commit', desc: 'Set up Vite + TypeScript monorepo.' },
  { year: 'Q1 2025', category: 'Hardware', title: 'PCB v1.0', desc: 'First custom PCB printed and assembled.' },
  { year: 'Q1 2025', category: 'Security', title: 'AES Implementation', desc: 'Added local encryption for offline data.' },
  { year: 'Q2 2025', category: 'Software', title: 'Native Bridge', desc: 'Implemented Java-to-JS bridge for NFC.' },
];

export const UnifiedTimelinePage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <h1 className="text-4xl font-bold text-white mb-12 text-center">Development Timeline</h1>
      
      <div className="relative border-l-2 border-slate-800 ml-4 md:ml-1/2 space-y-12">
        {timelineEvents.map((event, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`relative pl-8 md:pl-0 flex flex-col md:flex-row items-center ${
              index % 2 === 0 ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Timeline Dot */}
            <div className="absolute -left-1.25 md:left-1/2 md:-translate-x-1/2 w-4 h-4 bg-slate-900 border-2 border-blue-500 rounded-full z-10" />

            {/* Content Card */}
            <div className="w-full md:w-1/2 px-4">
              <div className={`p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500/50 transition-colors ${
                 index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                    event.category === 'Hardware' ? 'bg-orange-500/20 text-orange-400' :
                    event.category === 'Software' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {event.category}
                  </span>
                  <span className="text-mono text-xs text-slate-500">{event.year}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{event.title}</h3>
                <p className="text-slate-400 text-sm mt-2">{event.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
