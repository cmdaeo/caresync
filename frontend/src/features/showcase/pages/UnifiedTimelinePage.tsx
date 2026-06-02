import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Check,
  ChevronRight
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   DATA MAPPING
════════════════════════════════════════════════════════════════ */
const timelineData = [
  {
    month: "October 2025",
    title: "Concept Definition & Planning",
    events: [
      {
        date: "02/10/2025",
        text: "Project concept selected: Smart Medication Management System.",
        subsystems: ["CareBox", "CareBand", "CareApp", "Infrastructure", "Marketing"]
      },
      {
        date: "09/10/2025",
        text: "Team responsibilities assigned and organizational structure established."
      },
      {
        date: "23/10/2025",
        text: "Functional and technical specifications completed. Key technical risks identified and a two-iteration development strategy defined."
      }
    ]
  },
  {
    month: "November 2025",
    title: "Architecture & Components",
    events: [
      {
        date: "06/11/2025",
        text: "Initial component list finalized and system block diagrams completed. CareBox ↔ CareBand ↔ CareApp architecture consolidated."
      },
      {
        date: "20/11/2025",
        text: "Project assessed as fully on track. First version of the CareSync website launched."
      }
    ]
  },
  {
    month: "December 2025",
    title: "First Prototypes",
    events: [
      {
        date: "04–11/12/2025",
        text: "CareApp NFC communication demonstrated with smartphones. Significant progress in automated prescription parsing and initial breadboard testing."
      },
      {
        date: "18/12/2025",
        text: "CareBand prototype operational on breadboard. First CareBox CAD model completed while prescription-parsing pipeline remains under development."
      }
    ]
  },
  {
    month: "February 2026",
    title: "Integration Phase Begins",
    events: [
      {
        date: "18/02/2026",
        text: "CareBox breadboard prototype completed. First CareBand PCB version designed and initial finite state machine (FSM) architecture defined."
      },
      {
        date: "25/02/2026",
        text: "First physical CareBox prototype successfully 3D printed and mechanical structure validated. CareApp advanced prescription-processing and cybersecurity implementation."
      }
    ]
  },
  {
    month: "March 2026",
    title: "Technological Evolution",
    events: [
      {
        date: "04/03/2026",
        text: "Critical CareBox–CareBand communication challenge identified; NFC + Bluetooth strategy proposed."
      },
      {
        date: "11/03/2026",
        text: "Bluetooth limitations identified. Migration to Raspberry Pi architecture with integrated Bluetooth support. Hybrid NFC + BLE architecture adopted."
      },
      {
        date: "18–25/03/2026",
        text: "Handshake protocol developed and validated. Magnetic reed-switch system integrated. CareBox PCB development initiated."
      }
    ]
  },
  {
    month: "April 2026",
    title: "System Consolidation",
    events: [
      {
        date: "08/04/2026",
        text: "CareBox finite state machine completed with core operational states. RFID-based schedule loading integrated."
      },
      {
        date: "15 & 22/04/2026",
        text: "CareBox operating on breadboard, PCB design nearly finalized, and drawer verification systems validated. CareBand firmware debugging completed."
      },
      {
        date: "30/04/2026",
        text: "Automated prescription parsing finalized with local LLM fallback (Ollama/Qwen 2.5). Zero-Trust architecture and AES-256 encrypted databases validated."
      }
    ]
  },
  {
    month: "May 2026",
    title: "Validation & Final Dev",
    events: [
      {
        date: "06–13/05/2026",
        text: "Minimum, target, and stretch goals established. CareBand operating successfully and full-system integration initiated."
      },
      {
        date: "20/05/2026",
        text: "Cybersecurity audit completed: 71 automated security tests executed with a 100% pass rate. No critical vulnerabilities identified."
      },
      {
        date: "26–29/05/2026",
        text: "Ecosystem validated with functional hardware integration. Final project report, technical documentation, and commercialization plans completed."
      }
    ]
  },
  {
    month: "June 2026",
    title: "Project Closure",
    events: [
      {
        date: "02/06/2026",
        text: "End-to-end CareSync ecosystem demonstrated across hardware and application endpoints."
      },
      {
        date: "June 2026",
        text: "Official completion of the CareSync project with the final demonstration video released and the final website version published."
      }
    ]
  }
];

const getSectionIcon = (month: string) => {
  if (month.includes("October") || month.includes("November")) return <Layers size={16} />;
  if (month.includes("December") || month.includes("February")) return <Cpu size={16} />;
  if (month.includes("March") || month.includes("April")) return <Activity size={16} />;
  return <ShieldCheck size={16} />;
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const UnifiedTimelinePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentSection = timelineData[activeIndex];

  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 pt-10 pb-4 sm:px-8 lg:px-16 overflow-x-hidden flex flex-col justify-between">
      
      {/* Background Micro Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/[0.02] rounded-full blur-[100px]" />

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col justify-center">
        
        {/* Simplified, Compact Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight mb-2 flex items-center justify-center gap-2">
            <Activity size={22} className="text-brand-primary animate-pulse" />
            CareSync Project Timeline
          </h1>
          <p className="text-xs text-text-muted max-w-xl mx-auto">
            Select a milestones phase to review system specifications, prototype iterations, and security baselines.
          </p>
        </div>

        {/* 1. HORIZONTAL TRACK SELECTOR (Extremely Scalable & Clean) */}
        <div className="w-full bg-bg-card/40 border border-border-subtle rounded-xl p-2 mb-6 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1">
          {timelineData.map((section, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={section.month}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  isSelected 
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-inner' 
                    : 'text-text-muted hover:text-text-main hover:bg-bg-page/50 border border-transparent'
                }`}
              >
                {getSectionIcon(section.month)}
                <span>{section.month.split(' ')[0]}</span>
                {idx < timelineData.length - 1 && <ChevronRight size={12} className="opacity-30 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* 2. LIVE ACTIVE STEP DISPLAY LAYER */}
        <div className="min-h-[280px] sm:min-h-[240px] w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
            >
              {/* Target Highlight Meta Block */}
              <div className="md:col-span-1 bg-bg-card/20 border border-border-subtle p-5 rounded-xl flex flex-col justify-center">
                <span className="text-[10px] font-mono font-bold tracking-widest text-brand-primary uppercase mb-1">
                  Active Milestone
                </span>
                <h2 className="text-xl font-bold text-text-main mb-2">
                  {currentSection.month}
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  {currentSection.title}
                </p>
                
                {activeIndex === timelineData.length - 1 && (
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded w-max">
                    <CheckCircle2 size={12} />
                    System Live
                  </div>
                )}
              </div>

              {/* Dynamic Event Mapping Row */}
              <div className="md:col-span-2 flex flex-col justify-center gap-3">
                {currentSection.events.map((event, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl border border-border-subtle bg-bg-card/40 hover:border-border-subtle/80 transition-all flex items-start gap-3"
                  >
                    <div className="flex items-center gap-1 bg-bg-page px-2 py-1 rounded border border-border-subtle text-[10px] font-mono text-text-muted shrink-0 mt-0.5">
                      <Calendar size={11} className="text-brand-primary" />
                      {event.date.split('/')[0]}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-text-main leading-relaxed">
                        {event.text}
                      </p>

                      {event.subsystems && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {event.subsystems.map((sub) => (
                            <span 
                              key={sub} 
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-brand-primary/5 text-brand-primary border border-brand-primary/10"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}

                      {event.text.includes("core operational states") && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {["Initialization", "Configuration", "Waiting", "Alert", "Dispensing"].map((state) => (
                            <span key={state} className="inline-flex items-center gap-1 text-[10px] text-text-muted bg-bg-page border border-border-subtle px-1.5 py-0.5 rounded">
                              <Check size={10} className="text-brand-primary" />
                              {state}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};