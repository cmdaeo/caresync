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
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   DATA MAPPING
════════════════════════════════════════════════════════════════ */
const timelineData = [
  {
    month: "October 2025",
    title: "Concept Definition & Planning",
    images: [
      "/1-1.jpeg",
      "/1-2.jpeg",
      "/1-3.jpeg"
    ],
    events: [
      {
        date: "02/10/2025",
        text: "Project concept selected: Smart Medication Management System.",
        subsystems: ["CareBox", "CareBand", "CareApp", "Infrastructure", "Marketing"]
      },
      {
        date: "15/10/2025",
        text: "CareSync Logo Creation",
        subsystems: ["Marketing"]
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
    images: [
      "/2-1.jpeg",
      "/2-2.jpeg",
      "/2-3.jpeg"
    ],
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
    images: [
      "/3-1.jpeg",
      "/3-2.jpeg",
      "/3-3.jpeg"
    ],
    events: [
      {
        date: "11/12/2025",
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
    images: [
      "/4-1.jpeg",
      "/4-2.jpeg",
      "/4-3.jpeg",
      "/4-4.jpeg",
    ],
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
    images: [
      "/5-1.jpeg",
      "/5-2.jpeg",
      "/5-3.jpeg"
    ],
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
        date: "25/03/2026",
        text: "Handshake protocol developed and validated. Magnetic reed-switch system integrated. CareBox PCB development initiated."
      }
    ]
  },
  {
    month: "April 2026",
    title: "System Consolidation",
    images: [
      "/6-1.jpeg",
      "/6-2.jpeg",
      "/6-3.jpeg",
      "/6-4.jpeg",
      "/6-5.jpeg",
      "/6-6.jpeg",
      "/6-7.jpeg"
    ],    
    events: [
      {
        date: "08/04/2026",
        text: "CareBox finite state machine completed with core operational states. RFID-based schedule loading integrated."
      },
      {
        date: "22/04/2026",
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
    images: [
      "/7-1.jpeg",
      "/7-2.jpeg",
      "/7-3.jpeg",
      "/7-4.jpeg",
      "/7-5.jpeg",
      "/7-6.jpeg",
      "/7-7.jpeg"
    ], 
    events: [
      {
        date: "13/05/2026",
        text: "Minimum, target, and stretch goals established. CareBand operating successfully and full-system integration initiated."
      },
      {
        date: "20/05/2026",
        text: "Cybersecurity audit completed: 71 automated security tests executed with a 100% pass rate. No critical vulnerabilities identified."
      },
      {
        date: "29/05/2026",
        text: "Ecosystem validated with functional hardware integration. Final project report, technical documentation, and commercialization plans completed."
      }
    ]
  },
  {
    month: "June 2026",
    title: "Project Closure",
    images: [
      "/8-1.jpeg",
      "/8-2.jpeg",
      "/8-3.jpeg",
      "/8-4.jpeg",
    ], 
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
   ANIMATION ORCHESTRATION (Staggering & Parallax)
════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, 
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1 
    }
  }
};

const parallaxFadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const UnifiedTimelinePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentSection = timelineData[activeIndex];

  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden flex flex-col">
      
      {/* Background Micro Gradients */}
      <motion.div 
        animate={{ 
          x: activeIndex * -15, 
          scale: 1 + (activeIndex * 0.02)
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-primary/[0.02] rounded-full blur-[100px]" 
      />

      {/* Main Container */}
      <div className="w-full max-w-5xl mx-auto flex-grow flex flex-col relative z-10">
        
        {/* Consistent Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-4xl mx-auto mb-10 text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-main tracking-tight mb-4">
            Project Timeline
          </h1>
        </motion.div>

        {/* 1. HORIZONTAL TRACK SELECTOR */}
        <div className="w-full bg-bg-card/40 border border-border-subtle rounded-xl p-2 mb-8 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1">
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
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              exit="exit"
              className="flex flex-col gap-8"
            >
              
              {/* ════════ TEXT CONTENT GRID (ON TOP) ════════ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* LEFT COLUMN: META BLOCK */}
                <motion.div 
                  variants={parallaxFadeUp}
                  className="lg:col-span-1 bg-bg-card/20 border border-border-subtle p-5 rounded-xl flex flex-col sticky top-4"
                >
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
                </motion.div>

                {/* RIGHT COLUMN: EVENTS LIST */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                  {currentSection.events.map((event, idx) => (
                    <motion.div 
                      variants={parallaxFadeUp}
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
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ════════ BOTTOM: NO-CROP HORIZONTAL IMAGE GALLERY ════════ */}
              {currentSection.images && (
                <motion.div variants={parallaxFadeUp} className="w-full border-t border-border-subtle pt-6">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <ImageIcon size={14} className="text-brand-primary" />
                    <span className="text-[11px] font-mono font-bold tracking-widest text-text-main uppercase">
                      Gallery
                    </span>
                    <span className="text-[10px] text-text-muted ml-2 bg-bg-card px-2 py-0.5 rounded-full border border-border-subtle">
                      Scroll →
                    </span>
                  </div>
                  
                  {/* Container with Horizontal Scroll */}
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-thin scrollbar-thumb-border-subtle hover:scrollbar-thumb-brand-primary/50 scrollbar-track-transparent">
                    {currentSection.images.map((img, i) => (
                      <div key={i} className="shrink-0 snap-center">
                        <img 
                          src={img} 
                          alt={`Milestone visual ${i + 1}`} 
                          className="h-48 sm:h-56 md:h-64 w-auto rounded-xl object-contain border border-border-subtle bg-bg-card/50 shadow-sm" 
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};