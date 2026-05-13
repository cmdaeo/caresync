/**
 * LandingPage - LEEC · Universidade de Aveiro
 *
 * Viewport safety rules applied throughout:
 *  • No whitespace-nowrap on large headline text
 *  • Font sizes use px breakpoints (Tailwind sm/md/lg), never raw vw
 *  • All containers have max-w + overflow-hidden guards
 *  • Horizontal scroll: useScroll({ container, target }) - container = page scroll div
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, AnimatePresence
} from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Code2, Shield, Activity, Users,
  CircuitBoard, Briefcase, 
  FlaskConical, Cpu, Radio, Battery,
  ChevronRight,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import logo from '../../../assets/caresync.svg';

import "@google/model-viewer/dist/model-viewer"

/* ═══════════════════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════════════════ */
const CSS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@600;700;800&display=swap');

    /* reset */
    *, *::before, *::after { box-sizing: border-box; }

    .jm { font-family: 'JetBrains Mono', monospace; }
    .sy { font-family: 'Syne', sans-serif; }

    /* Blueprint grid - theme-aware */
    .bpg {
      background-image:
        linear-gradient(rgba(74,164,225,.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74,164,225,.055) 1px, transparent 1px),
        linear-gradient(rgba(74,164,225,.11) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74,164,225,.11) 1px, transparent 1px);
      background-size: 22px 22px, 22px 22px, 110px 110px, 110px 110px;
    }
    .light .bpg {
      background-image:
        linear-gradient(rgba(15,23,42,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15,23,42,.04) 1px, transparent 1px),
        linear-gradient(rgba(15,23,42,.09) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15,23,42,.09) 1px, transparent 1px);
    }

    /* Oscilloscope path animation */
    @keyframes osc { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -700 } }
    .oa { animation: osc  4s linear infinite }
    .ob { animation: osc 12s linear infinite }

    /* Ticker */
    @keyframes tick { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    .tkr { animation: tick 32s linear infinite }

    /* Blink cursor */
    @keyframes bl { 0%,100%{opacity:1} 50%{opacity:0} }
    .bln { animation: bl 1s step-end infinite }

    /* Pulse glow */
    @keyframes pg {
      0%,100% { box-shadow: 0 0 5px 1px rgba(74,164,225,.3) }
      50%      { box-shadow: 0 0 14px 4px rgba(74,164,225,.6) }
    }
    .pgn { animation: pg 2.2s ease-in-out infinite }

    /* Shimmer button */
    .shm { position: relative; overflow: hidden }
    .shm::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.18) 50%, transparent 60%);
      transform: translateX(-100%); transition: transform .5s;
    }
    .shm:hover::after { transform: translateX(100%) }

    /* Card hover lift */
    .lft { transition: transform .25s cubic-bezier(.34,1.56,.64,1) }
    .lft:hover { transform: translateY(-3px) scale(1.01) }

    /* Tiny chip */
    .chp {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 7px; border-radius: 3px;
      font-family: 'JetBrains Mono', monospace; font-size: 9px;
      font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
    }

    /* Thin scrollbar */
    .tsc::-webkit-scrollbar { width: 4px }
    .tsc::-webkit-scrollbar-thumb { background: rgba(74,164,225,.2); border-radius: 2px }
    .tsc::-webkit-scrollbar-track { background: transparent }

    /* Spark blink */
    @keyframes spk { 0%,100%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1)} }
    .s0 { animation: spk 2s ease-in-out        infinite }
    .s1 { animation: spk 2s ease-in-out  .65s  infinite }
    .s2 { animation: spk 2s ease-in-out 1.3s   infinite }

    /* Scan lines */
    .scn::after {
      content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 1;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px,
        rgba(0,0,0,.01) 2px, rgba(0,0,0,.01) 4px);
    }


    /* curriculum area colours */
    .aM    { background: rgba(59,130,246,.14); color: #93c5fd; border-color: rgba(59,130,246,.3) }
    .aF    { background: rgba(168,85,247,.14); color: #d8b4fe; border-color: rgba(168,85,247,.3) }
    .aELE  { background: rgba(6,182,212,.14);  color: #67e8f9; border-color: rgba(6,182,212,.3)  }
    .aI    { background: rgba(34,197,94,.14);  color: #86efac; border-color: rgba(34,197,94,.3)  }
    .aIA   { background: rgba(34,197,94,.14);  color: #86efac; border-color: rgba(34,197,94,.3)  }
    .aMTD  { background: rgba(251,191,36,.14); color: #fde68a; border-color: rgba(251,191,36,.3) }
    .aCENG { background: rgba(251,191,36,.14); color: #fde68a; border-color: rgba(251,191,36,.3) }
    .aELEA { background: rgba(6,182,212,.14);  color: #67e8f9; border-color: rgba(6,182,212,.3)  }
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════════════════
   GRADIENT TEXT helper
═══════════════════════════════════════════════════════════════════════════ */
const GText = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={className} style={{
    background: 'linear-gradient(135deg,#4AA4E1 0%,#22d3ee 45%,#4AA4E1 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  }}>
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSLATIONS
═══════════════════════════════════════════════════════════════════════════ */
const CURRICULUM_EN = [
  {
    sem1: [['Intro to Digital Systems','IA',6],['Intro to Electrical Engineering','ELE',6],['Programming','I',6],['Calculus I','M',6],['Linear Algebra','M',6]],
    sem2: [['Digital Systems Lab','IA',6],['Object-Oriented Programming','I',6],['Calculus II','M',6],['Circuits I','ELE',6],['Mechanics & Oscillations','F',6]],
  },
  {
    sem1: [['Numerical Methods','M',6],['Transferable Skills I','MTD',6],['Computer Architecture I','I',6],['Calculus III','M',6],['Circuits II','ELE',6]],
    sem2: [['Electromagnetic Field','F',6],['Electronic Devices','ELE',6],['Computer Architecture II','I',6],['Transferable Skills II','CENG',6],['Signals & Systems','ELEA',6]],
  },
  {
    sem1: [['Telecom Networks','ELE',6],['Probabilistic Methods','ELE',6],['Systems & Control','ELE',6],['Electronic Circuits','ELE',6]],
    sem2: [['Communication Systems','ELE',6],['EM Wave Propagation','ELE',6],['Applied Electrical Eng.','ELE',6],['System Electronics','ELE',6]],
    annual: [['Electrical Engineering Project','ELE',12]],
  },
] as const;

const T = {
  en: {
    badge: 'LEEC · Universidade de Aveiro',
    eyebrow: 'Electrical & Computer Engineering',
    heroLines: ['Build what', 'powers', 'the world.'],
    heroGrad: 1, // which line index gets gradient
    sub: '3 years · 180 ECTS. From transistors to distributed systems - LEEC prepares you for every layer of modern technology.',
    cta1: 'Explore the Project', cta2: 'Apply Now', scroll: 'scroll',
    discH: "What you'll master",
    disc: [
      { label: 'Hardware & Electronics', desc: 'Route PCBs, design FPGAs, build the physical layer.', col: '#22d3ee' },
      { label: 'Software & Computing',   desc: 'Embedded firmware, full-stack apps, distributed systems.', col: '#60a5fa' },
      { label: 'Networks & Energy',      desc: '5G protocols, renewable energy, real-time control.', col: '#a78bfa' },
    ],
    stats: [['3','yrs','hands-on labs'],['12','eng','built CareSync'],['100','%','employability'],['180','ects','total credits']],
    currH: 'Curriculum', currSub: '6 semesters · 180 ECTS · 3 years',
    yr: ['Year 1','Year 2','Year 3'],
    s1: '1st Semester', s2: '2nd Semester', sa: 'Annual Project',
    carH: 'Career Paths', carSub: 'Where LEEC graduates go',
    careers: [
      { icon: Cpu,          label: 'Electronics & Embedded',  desc: 'Microcontrollers, FPGAs, and IoT for industry.' },
      { icon: Code2,        label: 'Software & Full-Stack',   desc: 'Firmware to cloud-scale web services.' },
      { icon: Radio,        label: 'Telecom & 5G',            desc: 'Protocols and hardware connecting billions.' },
      { icon: Battery,      label: 'Renewable Energy',        desc: 'Smart grids, converters, sustainable systems.' },
      { icon: FlaskConical, label: 'Research & Academia',     desc: 'MSc/PhD at top European universities.' },
      { icon: Briefcase,    label: 'Startups & Consulting',   desc: 'Found tech companies or lead digital transformation.' },
    ],
    projH: 'Inside CareSync', projSub: 'A real product - built end-to-end by LEEC students',
    proj: [
      { t: 'Hardware',  d: 'Breadboard to production PCB.' },
      { t: 'Software',  d: 'React · Node.js · Embedded C.' },
      { t: 'Security',  d: 'Zero-trust · HIPAA compliant.'  },
      { t: 'Timeline',  d: 'Every sprint & milestone.'      },
      { t: 'Team',      d: '12 engineers, one mission.'     },
    ],
    demoLabel: 'Live Demo', demoH: 'See it in action.',
    demoSub: 'Launch the CareSync dashboard - a real, HIPAA-compliant medication management app built entirely by LEEC students.',
    demoBtn: 'Launch Dashboard',
    finalH: ['Your circuit', 'starts here.'],
    finalGrad: 1,
    finalSub: 'Join a programme where you graduate with a portfolio, not just a diploma.',
    meet: 'Meet the Team', apply: 'Apply at UA',
    curriculum: CURRICULUM_EN,
  },
} as const;
type Lang = 'en';

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL ATOMS
═══════════════════════════════════════════════════════════════════════════ */
function OscWave() {
  return (
    <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full">
      <path className="oa" stroke="rgba(74,164,225,.45)" strokeWidth="1.5" fill="none" strokeDasharray="300 400"
        d="M0,25L15,25L22,8L30,42L38,8L46,42L53,25L80,25L87,13L95,37L103,13L111,37L118,25L145,25L152,4L160,46L168,4L176,46L183,25L210,25L217,16L225,34L233,16L241,34L248,25L275,25L282,9L290,41L298,9L306,41L313,25L340,25L347,12L355,38L363,12L371,38L378,25L405,25L412,5L420,45L428,5L436,45L443,25L470,25L477,14L485,36L493,14L500,25"/>
      <path className="ob" stroke="rgba(74,164,225,.14)" strokeWidth="1" fill="none" strokeDasharray="700"
        d="M0,25C62,25 62,8 125,8C188,8 188,42 250,42C312,42 312,8 375,8C438,8 438,42 500,42"/>
    </svg>
  );
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const v = useInView(r, { once: true, margin: '-55px' });
  return (
    <motion.div ref={r} className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={v ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: .55, delay, ease: [.16, 1, .3, 1] }}>
      {children}
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   VIDEO SHOWCASE - Interactive project demos
═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
VIDEO SHOWCASE - Interactive project demos
═══════════════════════════════════════════════════════════════════════════ */


function SingleVideoShowcase({ t }: { t: typeof T[Lang] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative h-dvh w-full bg-black flex flex-col items-center justify-center px-4 sm:px-6 md:px-10 overflow-hidden border-t border-white/5">
      <div className="max-w-[1200px] w-full mx-auto flex flex-col items-center">
        <h3 className="text-brand-primary font-mono text-[10px] tracking-[0.2em] uppercase mb-3">
          {t.projSub}
        </h3>
        <h2 className="sy font-800 text-3xl sm:text-4xl lg:text-5xl leading-tight text-white mb-10 text-center">
          {t.projH}
        </h2>

        <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-border-subtle bg-bg-card shadow-2xl">
          {/* Clamp max height to 65vh so it doesn't break the 100vh section container */}
          <div className="relative w-full aspect-video max-h-[65vh] mx-auto bg-black">
            <video
              ref={videoRef}
              src="/videos/caresync-hardware.mp4"
              className="absolute inset-0 w-full h-full object-contain"
              loop
              muted={false}
              playsInline
            />

            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer z-10"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-primary text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-transform hover:scale-110">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1 fill-current" />
                </div>
              </div>
            )}

            {isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20 cursor-pointer z-10"
                onClick={togglePlay}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE LOADER - Aguarda modelos 3D carregarem antes de libertar o scroll
═══════════════════════════════════════════════════════════════════════════ */
function PageLoader({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);
  const loadedCount = useRef(0);

  useEffect(() => {
    const total = 2;

    const handleModelLoad = (sourceId: any) => {
      loadedCount.current += 1;
      const pct = Math.round((loadedCount.current / total) * 100);
      setProgress(pct);
      
      // We removed the setTimeout here! 
      // We now let the SVG animation completion handle the onReady trigger.
    };

    (window as any).__onModelLoad = handleModelLoad;

    return () => {
      delete (window as any).__onModelLoad;
    };
  }, []);

  const clipY = (1 - progress / 100);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="reveal-clip">
              <motion.rect 
                x="0" 
                initial={{ y: 64 }}
                animate={{ y: clipY }} 
                // A snappy tween makes it feel like a responsive progress bar
                transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
                // This is the magic bullet: wait for the visual to hit 100%
                onAnimationComplete={() => {
                  if (progress >= 100) {
                    onReady();
                  }
                }}
                width="64" 
                height="64" 
              />
            </clipPath>
          </defs>

          {/* Camada apagada — Background */}
          <image href={logo} x="0" y="0" width="64" height="64" 
          style={{ filter: 'brightness(0) invert(1)' }} opacity="1" />

          {/* Camada viva — Foreground */}
          <image href={logo} x="0" y="0" width="64" height="64"
            clipPath="url(#reveal-clip)"/>
        </svg>

        <p className="jm text-[9px] text-white/25 tracking-widest">
          {progress < 100 ? 'Loading...' : 'Ready'}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
PCB SHOWCASE - 3D Models (100vh Sections, Text over Model)
═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
PCB SHOWCASE - 3D Models (100vh Sections, Text over Model, Parallax BG Text)
═══════════════════════════════════════════════════════════════════════════ */
function PCBShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carebandRef = useRef<HTMLElement | null>(null);
  const careboxRef = useRef<HTMLElement | null>(null);

  // Parallax / mouse interaction for the massive background typography
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 40, damping: 30 });
  const smy = useSpring(my, { stiffness: 40, damping: 30 });

  const textX1 = useTransform(smx, [0, 1], [-30, 30]);
  const textY1 = useTransform(smy, [0, 1], [-30, 30]);
  const textX2 = useTransform(smx, [0, 1], [30, -30]);
  const textY2 = useTransform(smy, [0, 1], [30, -30]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mx, my]);

  /* Inside PCBShowcase component */
  useEffect(() => {
    console.log("🔵 [PCBShowcase] MOUNTED.");
    let reported = new Set();

    const notify = (id: unknown, reason: string) => {
      console.log(`🔵 [PCBShowcase] notify() called for '${id}'. Reason: ${reason}`);
      
      if (reported.has(id)) {
        console.warn(`🔵 [PCBShowcase] Wait, '${id}' was already reported. Skipping duplicate.`);
        return;
      }
      reported.add(id);
      
      console.log(`🔵 [PCBShowcase] Starting ping interval for '${id}' to deliver signal...`);
      let attempts = 0;
      
      const pingLoader = setInterval(() => {
        attempts++;
        if (typeof (window as any).__onModelLoad === 'function') {
          console.log(`🟢 [PCBShowcase] SUCCESS! Delivered signal for '${id}' on attempt ${attempts}.`);
          (window as any).__onModelLoad(id);
          clearInterval(pingLoader);
        } else {
          if (attempts % 10 === 0) {
            console.log(`🔵 [PCBShowcase] Still trying to deliver '${id}' (Attempt ${attempts}). window.__onModelLoad not found yet...`);
          }
        }
      }, 50);
    };

    const checkModels = () => {
      console.log("🔵 [PCBShowcase] Running checkModels()...");
      const models = [
        { ref: carebandRef.current, id: 'band' },
        { ref: careboxRef.current, id: 'box' }
      ];

      models.forEach(({ ref, id }) => {
        if (!ref) {
          console.error(`🔴 [PCBShowcase] REF IS NULL for '${id}'. Cannot attach listeners!`);
          return;
        }

        // Check exact properties of the model-viewer
        const hasModel = !!(ref as any).model;
        const isVisible = !!(ref as any).modelIsVisible;
        console.log(`🔵 [PCBShowcase] Status for '${id}': model=${hasModel}, modelIsVisible=${isVisible}`);

        if (hasModel || isVisible) {
          console.log(`🔵 [PCBShowcase] '${id}' is already loaded in DOM/Cache.`);
          notify(id, "preloaded_check");
        } else {
          console.log(`🔵 [PCBShowcase] '${id}' is NOT ready. Attaching load/error listeners...`);
          ref.addEventListener('load', () => notify(id, "load_event_fired"), { once: true });
          ref.addEventListener('error', (e) => {
             console.error(`🔴 [PCBShowcase] ERROR EVENT fired for '${id}'!`, e);
             notify(id, "error_event_fired"); 
          }, { once: true });
        }
      });
    };

    console.log("🔵 [PCBShowcase] Waiting for 'model-viewer' custom element to be defined...");
    customElements.whenDefined('model-viewer').then(() => {
      console.log("🔵 [PCBShowcase] 'model-viewer' is defined! Checking refs in 100ms...");
      // Tiny delay to ensure React has fully attached the refs after the element is defined
      setTimeout(checkModels, 100);
    });
  }, []);

  return (
    <>
      {/* ── CAREBAND: Full viewport ─────────────────── */}
      <section
        className="relative h-dvh w-full bg-[#020617] overflow-hidden border-t border-white/[0.02] flex items-center justify-center group"
        ref={containerRef}
      >
        {/* GLOBAL NOISE TEXTURE OVERLAY */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] z-50 mix-blend-overlay"
          style={{
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
}}
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 lg:left-2/3 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] lg:w-[600px] lg:h-[600px] bg-brand-primary/10 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none opacity-50 group-hover:opacity-80 transition-all duration-1000 ease-out" />

        {/* MASSIVE TYPOGRAPHY (Behind Model) */}
        <motion.div
          style={{ x: textX1, y: textY1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden"
        >
          <h2 className="sy font-800 text-[20vw] lg:text-[16vw] leading-none text-white/[0.02] tracking-tighter whitespace-nowrap">
            CAREBAND
          </h2>
        </motion.div>

        {/* Content Container */}
        <div className="w-full h-full max-w-[1400px] mx-auto relative z-10 flex flex-col items-center justify-center px-6 sm:px-12">
          {/* 3D MODEL */}
          <div className="absolute inset-0 lg:left-auto lg:right-[-5%] w-full lg:w-[75%] h-full flex items-center justify-center z-10 pointer-events-auto">
            <model-viewer
              ref={carebandRef as any}
              src="/careband.glb"
              alt="Careband PCB 3D Model"
              loading="eager"
              camera-controls
              auto-rotate
              auto-rotate-delay="1000"
              rotation-per-second="20deg"
              tone-mapping="aces"
              exposure="1.2"
              environment-image="legacy"
              interaction-prompt="none"
              style={{
                width: '100%',
                height: '80%',
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
          </div>

          {/* TEXT */}
          <div className="w-full max-w-[450px] lg:absolute lg:left-[5%] xl:left-[8%] z-30 pointer-events-none flex flex-col items-start text-left mt-[50vh] lg:mt-0">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] uppercase font-mono tracking-widest mb-4 pointer-events-auto border border-brand-primary/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                Wearable Node
              </div>
              <h2 className="sy font-800 text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1] mb-5 drop-shadow-2xl">
                Zero-Footprint PCB
              </h2>
              <p className="text-white/70 text-base sm:text-lg font-mono pointer-events-auto mb-8 drop-shadow-lg leading-relaxed">
                ARM Cortex-M4 core. Integrated biosensors. Rigid-flex architecture designed to curve around the human wrist.
              </p>
              <div className="space-y-3 font-mono text-xs sm:text-sm text-white/90 pointer-events-auto drop-shadow-md">
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  15µA Sleep State
                </div>
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  BLE 5.0 Stack
                </div>
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  12mm x 34mm Rigid-Flex
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CAREBOX: Full viewport ─────────────────── */}
      <section className="relative h-dvh w-full bg-[#020617] overflow-hidden border-t border-white/[0.02] flex items-center justify-center group">
        {/* GLOBAL NOISE TEXTURE OVERLAY */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] z-50 mix-blend-overlay"
          style={{
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'repeat',
}}
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] lg:w-[600px] lg:h-[600px] bg-[#c084fc]/10 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none opacity-50 group-hover:opacity-80 transition-all duration-1000 ease-out" />

        {/* MASSIVE TYPOGRAPHY (Behind Model) */}
        <motion.div
          style={{ x: textX2, y: textY2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden"
        >
          <h2 className="sy font-800 text-[20vw] lg:text-[16vw] leading-none text-white/[0.02] tracking-tighter whitespace-nowrap">
            CAREBOX
          </h2>
        </motion.div>

        {/* Content Container */}
        <div className="w-full h-full max-w-[1400px] mx-auto relative z-10 flex flex-col items-center justify-center px-6 sm:px-12">
          {/* 3D MODEL */}
          <div className="absolute inset-0 lg:right-auto lg:left-[-5%] w-full lg:w-[75%] h-full flex items-center justify-center z-10 pointer-events-auto">
            <model-viewer
              ref={careboxRef as any}
              src="/carebox.glb"
              alt="Carebox PCB 3D Model"
              loading="eager"
              camera-controls
              orientation="90deg 180deg 180deg"
              auto-rotate
              auto-rotate-delay="1000"
              rotation-per-second="-15deg"
              tone-mapping="aces"
              exposure="1.2"
              environment-image="legacy"
              interaction-prompt="none"
              style={{
                width: '100%',
                height: '80%',
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
          </div>

          {/* TEXT */}
          <div className="w-full max-w-[450px] lg:absolute lg:right-[5%] xl:right-[8%] z-30 pointer-events-none flex flex-col items-start lg:items-end text-left lg:text-right mt-[50vh] lg:mt-0">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c084fc]/10 text-[#c084fc] text-[10px] uppercase font-mono tracking-widest mb-4 pointer-events-auto border border-[#c084fc]/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse" />
                Central Hub
              </div>
              <h2 className="sy font-800 text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1] mb-5 drop-shadow-2xl">
                The Neural Core
              </h2>
              <p className="text-white/70 text-base sm:text-lg font-mono pointer-events-auto mb-8 drop-shadow-lg leading-relaxed">
                Edge-processing powerhouse built around the ESP32-S3. Handles AES-GCM decryption, real-time syncing, and OTA updates.
              </p>
              <div className="space-y-3 font-mono text-xs sm:text-sm text-white/90 pointer-events-auto drop-shadow-md flex flex-col items-start lg:items-end">
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  ESP32-S3 Xtensa Dual-Core
                </div>
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  Hardware AES / RSA Crypto
                </div>
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  Wi-Fi 4 + BLE 5.0 Mesh
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

const BENTO_ITEMS = [
  {
    id: 'hardware',
    icon: CircuitBoard,
    col: '#22d3ee',
    route: '/showcase/hardware',
    title: 'Hardware',
    headline: 'From breadboard to production PCB.',
    body: 'We designed and routed a custom PCB around an ESP32-S3, integrating power management, sensor arrays, and BLE. Every trace, every component placed by hand.',
    tags: ['ESP32-S3', 'KiCad', 'BLE 5.0', 'PCB'],
    size: 'large', // spans 2 columns
  },
  {
    id: 'software',
    icon: Code2,
    col: '#60a5fa',
    route: '/showcase/software',
    title: 'Software',
    headline: 'React · Node.js · Embedded C.',
    body: 'Three layers of code working in perfect sync — a real-time React dashboard, a Node.js REST + WebSocket backend, and bare-metal firmware flashed onto the device.',
    tags: ['React', 'Node.js', 'TypeScript', 'C'],
    size: 'large',
  },
  {
    id: 'security',
    icon: Shield,
    col: '#f87171',
    route: '/showcase/security',
    title: 'Security',
    headline: 'Zero-trust. HIPAA-compliant.',
    body: 'End-to-end AES-GCM encryption, OAuth2 auth flows, immutable audit logs.',
    tags: ['AES-GCM', 'OAuth2', 'HIPAA'],
    size: 'small',
  },
  {
    id: 'timeline',
    icon: Activity,
    col: '#c084fc',
    route: '/showcase/timeline',
    title: 'Timeline',
    headline: '14 weeks. 0 missed deadlines.',
    body: 'Agile sprints, GitHub Actions CI/CD, automated test suites. Delivered on time.',
    tags: ['Agile', 'CI/CD', 'Jest'],
    size: 'small',
  },
  {
    id: 'team',
    icon: Users,
    col: '#4ade80',
    route: '/showcase/team',
    title: 'Team',
    headline: '12 engineers. One mission.',
    body: 'Cross-functional squads, async-first culture, weekly demos. No bus factor.',
    tags: ['Git', 'Figma', 'Notion'],
    size: 'small',
  },
] as const;

function ProjectBreakdown({ t }: { t: typeof T[Lang] }) {
  return (
    <section className="min-h-dvh py-14 sm:py-20 px-4 sm:px-6 md:px-10 border-t border-border-subtle flex flex-col justify-center">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <Reveal className="mb-10">
          <p className="jm text-[10px] uppercase tracking-[.2em] text-brand-primary mb-2">
            {t.projSub}
          </p>
          <h2 className="sy font-800 text-3xl sm:text-4xl leading-tight">
            {t.projH} <GText>→</GText>
          </h2>
        </Reveal>

        {/* ── ROW 1: two large cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {BENTO_ITEMS.filter(b => b.size === 'large').map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.id} delay={i * 0.06}>
                <Link
                  to={item.route}
                  style={{ '--col': item.col } as React.CSSProperties}
                  className="lft group flex flex-col h-full min-h-[220px] p-6 rounded-2xl
                    bg-bg-card border border-border-subtle
                    hover:border-(--col) transition-all duration-300 relative overflow-hidden"
                >
                  {/* Subtle tinted corner glow */}
                  <div
                    className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0
                      group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${item.col}22 0%, transparent 70%)` }}
                  />

                  {/* Top row */}
                  <div className="flex items-center justify-between mb-auto">
                    <div className="chp border" style={{ background: `${item.col}18`, borderColor: `${item.col}44`, color: item.col }}>
                      {item.title}
                    </div>
                    <Icon size={15} className="text-text-muted group-hover:text-(--col) transition-colors" />
                  </div>

                  {/* Content — pushed to bottom */}
                  <div className="mt-8">
                    <h3 className="sy font-700 text-xl sm:text-2xl text-text-main mb-2 leading-tight
                      group-hover:text-(--col) transition-colors">
                      {item.headline}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-4">{item.body}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map(tag => (
                        <span key={tag} className="jm text-[9px] px-2 py-0.5 rounded border"
                          style={{ background: `${item.col}10`, borderColor: `${item.col}30`, color: item.col }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 jm text-[9px] uppercase tracking-widest
                    text-text-muted group-hover:text-(--col) transition-colors mt-5">
                    Explore <ArrowRight size={9} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {/* ── ROW 2: three small cards ────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BENTO_ITEMS.filter(b => b.size === 'small').map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.id} delay={0.12 + i * 0.06}>
                <Link
                  to={item.route}
                  style={{ '--col': item.col } as React.CSSProperties}
                  className="lft group flex flex-col h-full min-h-[160px] p-5 rounded-2xl
                    bg-bg-card border border-border-subtle
                    hover:border-(--col) transition-all duration-300 relative overflow-hidden"
                >
                  <div
                    className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0
                      group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${item.col}1e 0%, transparent 70%)` }}
                  />

                  <div className="flex items-center justify-between mb-auto">
                    <div className="chp border" style={{ background: `${item.col}18`, borderColor: `${item.col}44`, color: item.col }}>
                      {item.title}
                    </div>
                    <Icon size={14} className="text-text-muted group-hover:text-(--col) transition-colors" />
                  </div>

                  <div className="mt-6">
                    <h3 className="sy font-700 text-base sm:text-lg text-text-main mb-1.5 leading-tight
                      group-hover:text-(--col) transition-colors">
                      {item.headline}
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed mb-3">{item.body}</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map(tag => (
                        <span key={tag} className="jm text-[8px] px-1.5 py-0.5 rounded border"
                          style={{ background: `${item.col}10`, borderColor: `${item.col}30`, color: item.col }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 jm text-[9px] uppercase tracking-widest
                    text-text-muted group-hover:text-(--col) transition-colors mt-4">
                    Explore <ArrowRight size={9} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const lang: Lang = 'en';
  const t = T[lang];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [appReady, setAppReady] = useState(false);

  // Hero parallax - uses the same container ref
  const { scrollYProgress: hp } = useScroll({ container: scrollRef as React.RefObject<HTMLElement> });
  const heroOp = useTransform(hp, [0, .18], [1, 0]);
  const heroY  = useTransform(hp, [0, .25], ['0%', '8%']);

  // Mouse glow
  const mx = useMotionValue(0), my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 22 });
  const smy = useSpring(my, { stiffness: 50, damping: 22 });
  const glow = useMotionValue('');
  useEffect(() => {
    const u = smx.on('change', () =>
      glow.set(`radial-gradient(480px at ${smx.get()}px ${smy.get()}px, rgba(74,164,225,.08), transparent 75%)`));
    const h = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => { window.removeEventListener('mousemove', h); u(); };
  }, [mx, my, smx, smy, glow]);

  const handleReady = useCallback(() => {
    setAppReady(true);
  }, []);

  return (
    <>
      <CSS />

      {/* ── LOADER ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!appReady && (
          <PageLoader onReady={handleReady} />
        )}
      </AnimatePresence>

      {/* ── PAGE SCROLL CONTAINER ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="h-dvh w-full overflow-y-auto overflow-x-hidden tsc sy bg-bg-page text-text-main">

        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bpg scn">
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 50%, transparent 25%, var(--bg-page,#020617) 100%)' }} />
          {/* Osc bottom */}
          <div className="absolute bottom-10 inset-x-0 h-8 sm:h-10 pointer-events-none opacity-40">
            <OscWave />
          </div>

          {/* Content wrapper
              CRITICAL: max-w prevents overflow; no whitespace-nowrap on headlines */}
          <motion.div style={{ y: heroY, opacity: heroOp }}
            className="relative z-10 w-full px-5 sm:px-8 max-w-2xl mx-auto text-center">

            {/* Eyebrow */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}
              className="jm text-[9px] sm:text-[11px] text-text-muted uppercase tracking-[.16em] mb-4">
              {t.eyebrow}
              <span className="bln text-brand-primary">_</span>
            </motion.p>

            {/* HEADLINE
                ✓ Uses text-4xl/text-5xl/text-6xl/text-7xl - fixed px sizes per breakpoint
                ✓ No whitespace-nowrap - text wraps naturally within max-w-2xl
                ✓ max-w-2xl on parent + overflow-hidden on section = nothing escapes
            */}
            {t.heroLines.map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.h1
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: .75, ease: [.16, 1, .3, 1], delay: .15 + i * .08 }}
                  className={`font-800 leading-[.9] tracking-tight mb-1
                    text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                    ${i === t.heroGrad ? '' : 'text-text-main'}`}
                  style={i === t.heroGrad ? {
                    background: 'linear-gradient(135deg,#4AA4E1 0%,#22d3ee 45%,#4AA4E1 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : {}}>
                  {line}
                </motion.h1>
              </div>
            ))}

            {/* Sub */}
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .42, duration: .5 }}
              className="text-sm sm:text-base text-text-muted mt-5 mb-5 leading-relaxed max-w-lg mx-auto">
              {t.sub}
            </motion.p>

            {/* Fee pills */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5, duration: .45 }}
              className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .56, duration: .45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/showcase/hardware"
                className="shm group flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                  font-700 text-sm text-white bg-brand-primary
                  shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/45
                  hover:bg-brand-light transition-all w-full sm:w-auto">
                {t.cta1}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://www.ua.pt/pt/curso/480" target="_blank" rel="noreferrer"
                className="group flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                  font-600 text-sm text-text-main border border-border-subtle
                  hover:bg-bg-card hover:border-brand-primary/40 transition-all w-full sm:w-auto">
                {t.cta2}
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>
          </motion.div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="w-4 h-6 rounded-full border border-text-muted/30 flex items-start justify-center pt-1">
              <div className="w-0.5 h-1.5 rounded-full bg-brand-primary/60" />
            </motion.div>
            <span className="jm text-[8px] uppercase tracking-[.2em] text-text-muted/50">{t.scroll}</span>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TICKER
        ════════════════════════════════════════════════════════════════ */}
        <div className="overflow-hidden border-y border-border-subtle bg-bg-card py-2">
          <div className="flex tkr select-none">
            {[0, 1].map(k => (
              <div key={k} className="flex shrink-0 items-center gap-5 pr-5">
                {['VHDL', 'React', 'C/C++', 'PCB Layout', 'Signal Processing', 'TypeScript', 'FPGA',
                  'Node.js', 'RTOS', 'Control Systems', 'BLE', 'Python', 'RF Design', 'Embedded C',
                  'Docker', '5G Protocols', 'Renewable Energy', 'KiCad'].map(s => (
                  <span key={s} className="whitespace-nowrap jm text-[9px] text-text-muted flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-sm bg-brand-primary/40 rotate-45 shrink-0" />{s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <ProjectBreakdown t={t} />

        {/* ════════════════════════════════════════════════════════════════
            VideoShowcase
        ════════════════════════════════════════════════════════════════ */}
        <SingleVideoShowcase t={t} />
        <PCBShowcase />

        {/* ════════════════════════════════════════════════════════════════
            DEMO BANNER
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 md:px-10 border-t border-border-subtle">
  <Reveal>
    <div className="rounded-2xl border border-brand-primary/25 bg-brand-primary/6 p-5 sm:p-8
      flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 opacity-[.06] pointer-events-none">
        <OscWave />
      </div>
      <div className="relative z-10">
        
        {/* Glowing Border Badge */}
        <div className="chp relative overflow-hidden bg-green-500/14 text-green-400 mb-3 border-0">
          <span className="relative z-10">
            {t.demoLabel}
          </span>
          <div 
            className="absolute inset-0 rounded-[inherit] pointer-events-none p-px"
            style={{
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          >
            <div className="absolute inset-0 bg-green-500/30" />
            <motion.div
              className="absolute inset-[-1000%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,#4ade80_15%,transparent_30%)]"
              animate={{ rotate: 360 }}
              transition={{ ease: "linear", duration: 3, repeat: Infinity }}
            />
          </div>
        </div>

        <h3 className="sy font-800 text-xl sm:text-2xl mb-1.5">{t.demoH}</h3>
        <p className="text-text-muted text-xs sm:text-sm max-w-sm leading-relaxed">{t.demoSub}</p>
      </div>
      <Link to="/app"
        className="shm relative z-10 shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl
          bg-brand-primary text-white font-700 text-sm
          shadow-lg shadow-brand-primary/30 hover:bg-brand-light transition-all group w-full md:w-auto">
        {t.demoBtn}
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  </Reveal>
</section>

      </div>{/* end scroll root */}
    </>
  );
}