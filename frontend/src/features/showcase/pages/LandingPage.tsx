/**
 * LandingPage - LEEC · Universidade de Aveiro
 *
 * Viewport safety rules applied throughout:
 * • No whitespace-nowrap on large headline text
 * • Font sizes use px breakpoints (Tailwind sm/md/lg), never raw vw
 * • All containers have max-w + overflow-hidden guards
 * • Horizontal scroll: useScroll({ container, target }) - container = page scroll div
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, AnimatePresence
} from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  CheckCircle
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
    @keyframes pulse {
      0%, 100% { 
        opacity: 0.9; 
        transform: scaleX(1); 
      }
      50% { 
        opacity: 1.0; 
        transform: scaleX(0.98); 
      }
    }

    .bln {
      display: inline-block;
      transform-origin: center;
      animation: pulse 1.5s ease-in-out infinite;
    }

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
  `}</style>
);

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
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-55px' }}
      transition={{ duration: .55, delay, ease: [.16, 1, .3, 1] }}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE LOADER
═══════════════════════════════════════════════════════════════════════════ */
function PageLoader({ onReady }: { onReady: () => void }) {
  const [progress, setProgress] = useState(0);
  const loadedCount = useRef(0);

  useEffect(() => {
    const total = 3;
    const handleModelLoad = (_sourceId: any) => {
      loadedCount.current += 1;
      const pct = Math.round((loadedCount.current / total) * 100);
      setProgress(pct);
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
                transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
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
          <image href={logo} x="0" y="0" width="64" height="64" 
          style={{ filter: 'brightness(0) invert(1)' }} opacity="1" />
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
function PCBShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carebandRef = useRef<HTMLElement | null>(null);
  const careboxRef = useRef<HTMLElement | null>(null);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const smx = useSpring(mx, { stiffness: 40, damping: 30 });
  const smy = useSpring(my, { stiffness: 40, damping: 30 });

  const textX1 = useTransform(smx, [0, 1], [-30, 30]);
  const textY1 = useTransform(smy, [0, 1], [-30, 30]);
  const textX2 = useTransform(smx, [0, 1], [30, -30]);
  const textY2 = useTransform(smy, [0, 1], [30, -30]);

  // Tracks if the user is dragging any model across this split layout container
  const isInteractingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth);
      my.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mx, my]);

  // UNIVERSAL WIGGLE LOGIC FOR CAREBAND AND CAREBOX MODALS
  useEffect(() => {
    const bandViewer = carebandRef.current as any;
    const boxViewer = careboxRef.current as any;
    
    let animationFrameId: number;
    const speed = 0.0015;
    const range = 18;

    const runWiggleLoop = (time: number) => {
      // CHECK INTERACTION: Only adjust orbit if user isn't clicking/dragging manual controls
      if (!isInteractingRef.current) {
        const currentYaw = Math.sin(time * speed) * range;
        
        if (bandViewer) {
          bandViewer.cameraOrbit = `${currentYaw}deg 75deg 105%`;
        }
        if (boxViewer) {
          boxViewer.cameraOrbit = `${currentYaw}deg 75deg 105%`;
        }
      }

      animationFrameId = requestAnimationFrame(runWiggleLoop);
    };

    // Tracking activation listeners to pause tracking shifts on user contact
    const setInteractingTrue = () => { isInteractingRef.current = true; };
    const setInteractingFalse = () => { isInteractingRef.current = false; };

    // FIXED LOADING TRIGGERS: Attach sync loaders instantly before timeout shifts evaluate
    let reported = new Set();
    const notifyLoad = (id: string) => {
      if (reported.has(id)) return;
      reported.add(id);
      if (typeof (window as any).__onModelLoad === 'function') {
        (window as any).__onModelLoad(id);
      }
    };

    const bandEl = carebandRef.current;
    const boxEl = careboxRef.current;

    if (bandEl) {
      bandEl.addEventListener('pointerdown', setInteractingTrue);
      bandEl.addEventListener('pointerup', setInteractingFalse);
      bandEl.addEventListener('pointerleave', setInteractingFalse);
      if ((bandEl as any).modelIsVisible) notifyLoad('band');
      else {
        bandEl.addEventListener('load', () => notifyLoad('band'), { once: true });
        bandEl.addEventListener('error', () => notifyLoad('band'), { once: true });
      }
    }

    if (boxEl) {
      boxEl.addEventListener('pointerdown', setInteractingTrue);
      boxEl.addEventListener('pointerup', setInteractingFalse);
      boxEl.addEventListener('pointerleave', setInteractingFalse);
      if ((boxEl as any).modelIsVisible) notifyLoad('box');
      else {
        boxEl.addEventListener('load', () => notifyLoad('box'), { once: true });
        boxEl.addEventListener('error', () => notifyLoad('box'), { once: true });
      }
    }

    animationFrameId = requestAnimationFrame(runWiggleLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (bandEl) {
        bandEl.removeEventListener('pointerdown', setInteractingTrue);
        bandEl.removeEventListener('pointerup', setInteractingFalse);
        bandEl.removeEventListener('pointerleave', setInteractingFalse);
      }
      if (boxEl) {
        boxEl.removeEventListener('pointerdown', setInteractingTrue);
        boxEl.removeEventListener('pointerup', setInteractingFalse);
        boxEl.removeEventListener('pointerleave', setInteractingFalse);
      }
    };
  }, []);

  return (
    <>
      <section
        className="relative h-dvh w-full bg-[#020617] overflow-hidden border-t border-white/[0.02] flex items-center justify-center group"
        ref={containerRef}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] z-50 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        <div className="absolute top-1/2 left-1/2 lg:left-2/3 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] lg:w-[600px] lg:h-[600px] bg-brand-primary/10 rounded-full blur-[120px] sm:blur-[120px] pointer-events-none opacity-50 group-hover:opacity-80 transition-all duration-1000 ease-out" />

        <motion.div
          style={{ x: textX1, y: textY1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden"
        >
          <h2 className="sy font-800 text-[20vw] lg:text-[16vw] leading-none text-white/[0.02] tracking-tighter whitespace-nowrap">
            CAREBAND
          </h2>
        </motion.div>

        <div className="w-full h-full max-w-[1400px] mx-auto relative z-10 flex flex-col items-center justify-center px-6 sm:px-12">
          <div className="absolute inset-0 lg:left-auto lg:right-[-5%] w-full lg:w-[75%] h-full flex items-center justify-center z-10 pointer-events-auto">
            <model-viewer
              ref={carebandRef as any}
              src="/careband.glb"
              alt="Careband PCB 3D Model"
              loading="eager"
              camera-controls
              tone-mapping="aces"
              exposure="1.2"
              environment-image="legacy"
              interaction-prompt="none"
              style={{ width: '100%', height: '80%', backgroundColor: 'transparent', outline: 'none' }}
            />
          </div>

          <div className="w-full max-w-[450px] lg:absolute lg:left-[5%] xl:left-[8%] z-30 pointer-events-none flex flex-col items-start text-left mt-[35vh] sm:mt-[40vh] lg:mt-0">
            <Reveal>
              <h2 className="sy font-800 text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1] mb-5 drop-shadow-2xl">
                CAREBAND
              </h2>
              <p className="text-white/70 text-base sm:text-lg font-mono pointer-events-auto mb-4 sm:mb-8 drop-shadow-lg leading-relaxed">
                Miniaturized wearable BLE node. Features an ergonomic TPU chassis, ERM haptic actuators, and flexible NFC integration for continuous accessibility.
              </p>
              <div className="space-y-3 font-mono text-xs sm:text-sm text-white/90 pointer-events-auto drop-shadow-md">
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  BLE Central Client Architecture
                </div>
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  ERM Haptic & SMD LED Alerts
                </div>
                <div className="flex items-center gap-3 border-l-2 border-brand-primary/50 pl-3">
                  <CheckCircle size={16} className="text-brand-primary" />
                  Flexible Case & NFC Patch
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="relative h-dvh w-full bg-[#020617] overflow-hidden border-t border-white/[0.02] flex items-center justify-center group">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] z-50 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] lg:w-[600px] lg:h-[600px] bg-[#c084fc]/10 rounded-full blur-[120px] sm:blur-[120px] pointer-events-none opacity-50 group-hover:opacity-80 transition-all duration-1000 ease-out" />

        <motion.div
          style={{ x: textX2, y: textY2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden"
        >
          <h2 className="sy font-800 text-[20vw] lg:text-[16vw] leading-none text-white/[0.02] tracking-tighter whitespace-nowrap">
            CAREBOX
          </h2>
        </motion.div>

        <div className="w-full h-full max-w-[1400px] mx-auto relative z-10 flex flex-col items-center justify-center px-6 sm:px-12">
          <div className="absolute inset-0 lg:right-auto lg:left-[-5%] w-full lg:w-[75%] h-full flex items-center justify-center z-10 pointer-events-auto">
            <model-viewer
              ref={careboxRef as any}
              src="/carebox.glb"
              alt="Carebox PCB 3D Model"
              loading="eager"
              camera-controls
              orientation="90deg 180deg 180deg"
              tone-mapping="aces"
              exposure="1.2"
              environment-image="legacy"
              interaction-prompt="none"
              style={{ width: '100%', height: '80%', backgroundColor: 'transparent', outline: 'none' }}
            />
          </div>

          <div className="w-full max-w-[450px] lg:absolute lg:right-[5%] xl:right-[8%] z-30 pointer-events-none flex flex-col items-start text-left mt-[35vh] sm:mt-[40vh] lg:mt-0">
            <Reveal>
              <h2 className="sy font-800 text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1] mb-5 drop-shadow-2xl">
                CAREBOX
              </h2>
              <p className="text-white/70 text-base sm:text-lg font-mono pointer-events-auto mb-4 sm:mb-8 drop-shadow-lg leading-relaxed">
                Central dispensing hub powered by the Raspberry Pi Pico WH. Handles physical motor actuation, RFID scheduling, and closed-loop telemetry.
              </p>
              <div className="space-y-3 font-mono text-xs sm:text-sm text-white/90 pointer-events-auto drop-shadow-md flex flex-col items-start lg:items-end">
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  RP2040 Dual-Core Cortex-M0+
                </div>
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  28BYJ-48 Precision Stepper
                </div>
                <div className="flex items-center gap-3 border-l-2 lg:border-l-0 lg:border-r-2 border-[#c084fc]/50 pl-3 lg:pl-0 lg:pr-3 flex-row lg:flex-row-reverse">
                  <CheckCircle size={16} className="text-[#c084fc]" />
                  CYW43439 Wi-Fi & BLE 5.2
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   3D PCB COMPONENT REGISTRY SHOWCASE (Brutalist HUD Overlay Matrix)
═══════════════════════════════════════════════════════════════════════════ */
function PCBAuraShowcase() {
  const modelViewerRef = useRef<any>(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    let animationFrameId: number;
    const startOrbitY = 70;
    const wiggleRange = 18;
    const speed = 0.0015;

    const performWiggle = (time: number) => {
      // CHECK INTERACTION: Only perform wave transformations if cursor isn't dragging model components
      if (!isInteractingRef.current) {
        const currentYaw = Math.sin(time * speed) * wiggleRange;
        viewer.cameraOrbit = `${currentYaw}deg ${startOrbitY}deg 115%`;
      }
      animationFrameId = requestAnimationFrame(performWiggle);
    };

    // Pointers checking configurations safely overriding native controls
    const setInteractingTrue = () => { isInteractingRef.current = true; };
    const setInteractingFalse = () => { isInteractingRef.current = false; };

    let reported = false;
    const handleLoad = () => {
      if (reported) return;
      reported = true;
      
      if (typeof (window as any).__onModelLoad === 'function') {
        (window as any).__onModelLoad('assembly');
      }

      viewer.addEventListener('pointerdown', setInteractingTrue);
      viewer.addEventListener('pointerup', setInteractingFalse);
      viewer.addEventListener('pointerleave', setInteractingFalse);

      animationFrameId = requestAnimationFrame(performWiggle);
    };

    if (viewer.modelIsVisible) {
      handleLoad();
    } else {
      viewer.addEventListener('load', handleLoad, { once: true });
      viewer.addEventListener('error', handleLoad, { once: true });
    }

    return () => {
      if (viewer) {
        viewer.removeEventListener('load', handleLoad);
        viewer.removeEventListener('pointerdown', setInteractingTrue);
        viewer.removeEventListener('pointerup', setInteractingFalse);
        viewer.removeEventListener('pointerleave', setInteractingFalse);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative h-dvh w-full bg-[#020617] border-t border-white/[0.02]">
      {/* 3D Full-Bleed Background Layer */}
      <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-auto z-10">
        <model-viewer
          ref={modelViewerRef}
          src="/carebox_3d.glb"
          alt="CareSync Core Hardware PCB Architecture"
          loading="eager"
          camera-controls
          interaction-prompt="none"
          tone-mapping="aces"
          shadow-intensity="1"
          exposure="1.2"
          environment-image="legacy"
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent', outline: 'none' }}
        />
      </div>

      {/* Decorative center matrix glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* FIXED BRUTALIST HUD: Absolute Coordinate Placements Layer (No Text Cutoffs) */}
      <div className="absolute inset-0 z-20 pointer-events-none max-w-[1400px] mx-auto px-6 sm:px-12 py-[10dvh] h-full w-full">
        
        {/* Card 1: Top Left */}
        <div className="absolute top-[8dvh] left-6 sm:left-12 max-w-[340px] sm:max-w-[380px] pointer-events-auto">
          <Reveal>
            <h3 className="sy font-800 text-2xl sm:text-3xl text-white mb-3">
              Carebox
            </h3>
          </Reveal>
        </div>

        {/* Card 2: Middle Right */}
        <div className="absolute top-1/2 -translate-y-1/2 right-6 sm:right-12 max-w-[340px] sm:max-w-[380px] text-right pointer-events-auto">
          <Reveal>
            <h3 className="sy font-800 text-2xl sm:text-3xl text-white mb-3">
              10 Medication Compartments
            </h3>
          </Reveal>
        </div>

        {/* Card 3: Bottom Left */}
        <div className="absolute bottom-[8dvh] left-6 sm:left-12 max-w-[340px] sm:max-w-[380px] pointer-events-auto">
          <Reveal>
            <h3 className="text-emerald-400 sy font-800 text-2xl sm:text-3xl text-white mb-3">
              Dispensing Drawer
            </h3>
          </Reveal>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [appReady, setAppReady] = useState(false);

  const { scrollYProgress: hp } = useScroll({ container: scrollRef as React.RefObject<HTMLElement> });
  const heroOp = useTransform(hp, [0, .18], [1, 0]);
  const heroY  = useTransform(hp, [0, .25], ['0%', '8%']);

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

  const heroLines = ['Build what', 'powers', 'the world.'];

  return (
    <>
      <CSS />

      <AnimatePresence>
        {!appReady && (
          <PageLoader onReady={handleReady} />
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="relative h-dvh w-full overflow-y-auto overflow-x-hidden tsc sy bg-bg-page text-text-main"
      >
        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bpg scn">
          <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 90% 65% at 50% 50%, transparent 25%, var(--bg-page,#020617) 100%)' }} />
          <div className="absolute bottom-10 inset-x-0 h-8 sm:h-10 pointer-events-none opacity-40">
            <OscWave />
          </div>

          <motion.div style={{ y: heroY, opacity: heroOp }}
            className="relative z-10 w-full px-5 sm:px-8 max-w-2xl mx-auto text-center nb"
          >
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ 
                opacity: 1,
                color: ["var(--color-text-muted)", "var(--color-brand-primary)", "var(--color-text-muted)"]
              }} 
              transition={{ 
                opacity: { delay: 0.1 },
                color: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="jm text-[9px] sm:text-[11px] text-text-muted uppercase tracking-[.16em] mb-4 bln"
            >
              Electrical & Computer Engineering
            </motion.p>

            {heroLines.map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.h1
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: .75, ease: [.16, 1, .3, 1], delay: .15 + i * .08 }}
                  className={`font-800 leading-[.9] tracking-tight mb-1
                    text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                    ${i === 1 ? '' : 'text-text-main'}`}
                  style={i === 1 ? {
                    background: 'linear-gradient(135deg,#4AA4E1 0%,#22d3ee 45%,#4AA4E1 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  } : {}}
                >
                  {line}
                </motion.h1>
              </div>
            ))}

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .42, duration: .5 }}
              className="text-sm sm:text-base text-text-muted mt-5 mb-5 leading-relaxed max-w-lg mx-auto"
            >
              Created by 12 engineers @ Aveiro University
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .56, duration: .45 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/showcase/team"
                className="shm group flex items-center justify-center gap-2 px-6 py-3 rounded-lg
                  font-700 text-sm text-white bg-brand-primary
                  shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/45
                  hover:bg-brand-light transition-all w-full sm:w-auto"
              >
                Explore the Project
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="w-4 h-6 rounded-full border border-text-muted/30 flex items-start justify-center pt-1"
            >
              <div className="w-0.5 h-1.5 rounded-full bg-brand-primary/60" />
            </motion.div>
            <span className="jm text-[8px] uppercase tracking-[.2em] text-text-muted/50">scroll</span>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TICKER
        ════════════════════════════════════════════════════════════════ */}
        <div className="overflow-hidden border-y border-border-subtle bg-bg-card py-2">
          <div className="flex tkr select-none">
            {[0, 1].map(k => (
              <div key={k} className="flex shrink-0 items-center gap-5 pr-5">
                {['SQLite', 'React', 'C/C++', 'PCB Layout', 'Signal Processing', 'TypeScript', '3D Printing',
                  'Node.js', 'RTOS', 'BLE', 'AI', 'Schematics', 'Embedded C', 'KiCad'].map(s => (
                  <span key={s} className="whitespace-nowrap jm text-[9px] text-text-muted flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-sm bg-brand-primary/40 rotate-45 shrink-0" />{s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PCBA SHOWCASES
        ════════════════════════════════════════════════════════════════ */}
        <PCBShowcase />
        <PCBAuraShowcase />

        {/* ════════════════════════════════════════════════════════════════
            DEMO BANNER
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 md:px-10 border-t border-border-subtle">
          <Reveal>
            <div className="rounded-2xl border border-brand-primary/25 bg-brand-primary/6 p-5 sm:p-8
              flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 opacity-[.06] pointer-events-none">
                <OscWave />
              </div>
              <div className="relative z-10">
                <div className="chp relative overflow-hidden bg-green-500/14 text-green-400 mb-3 border-0">
                  <span className="relative z-10">Live Demo</span>
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

                <h3 className="sy font-800 text-xl sm:text-2xl mb-1.5">See it in action.</h3>
                <p className="text-text-muted text-xs sm:text-sm max-w-sm leading-relaxed">Register, and start using the full potential of CareSync</p>
              </div>
              <Link to="/app"
                className="shm relative z-10 shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                  bg-brand-primary text-white font-700 text-sm
                  shadow-lg shadow-brand-primary/30 hover:bg-brand-light transition-all group w-full md:w-auto"
              >
                Launch Dashboard
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Reveal>
        </section>

      </div>
    </>
  );
}