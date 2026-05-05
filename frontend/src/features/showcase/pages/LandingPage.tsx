/**
 * LandingPage - CareSync
 *
 * - 4 snap sections, each exactly 100dvh
 * - scroll-snap-type: y mandatory (magnetic feel)
 * - Hero: refined, compact, no badge, no blinking dot
 * - clamp() fluid type throughout, 12px floor
 */
import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Shield,
  Activity,
  Users,
  CircuitBoard,
  CheckCircle,
  Play,
  Pause,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════ */
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');

    .jm  { font-family: 'JetBrains Mono', monospace; }
    .sy  { font-family: 'Syne', sans-serif; }

    /* ── snap container ── */
    .lp-scroll {
      height: 100dvh;
      overflow-y: scroll;
      overflow-x: hidden;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
    }
    .lp-scroll::-webkit-scrollbar { width: 4px; }
    .lp-scroll::-webkit-scrollbar-thumb {
      background: rgba(74,164,225,.2);
      border-radius: 2px;
    }

    /* ── snap section ── */
    .lp-section {
      scroll-snap-align: start;
      scroll-snap-stop: always;
      height: 100dvh;
      min-height: 100dvh;
      max-height: 100dvh;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* ── blueprint grid ── */
    .bpg {
      background-image:
        linear-gradient(rgba(74,164,225,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74,164,225,.035) 1px, transparent 1px),
        linear-gradient(rgba(74,164,225,.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74,164,225,.07) 1px, transparent 1px);
      background-size: 22px 22px, 22px 22px, 110px 110px, 110px 110px;
    }
    .light .bpg {
      background-image:
        linear-gradient(rgba(15,23,42,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15,23,42,.025) 1px, transparent 1px),
        linear-gradient(rgba(15,23,42,.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15,23,42,.06) 1px, transparent 1px);
    }

    /* ── oscilloscope ── */
    @keyframes osc  { from { stroke-dashoffset: 0 }   to { stroke-dashoffset: -700 } }
    .oa { animation: osc  4s linear infinite; }
    .ob { animation: osc 12s linear infinite; }

    /* ── shimmer button ── */
    .shm { position: relative; overflow: hidden; }
    .shm::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(105deg,transparent 40%,rgba(255,255,255,.15) 50%,transparent 60%);
      transform: translateX(-100%); transition: transform .5s;
    }
    .shm:hover::after { transform: translateX(100%); }

    /* ── card lift ── */
    .lft { transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
    .lft:hover { transform: translateY(-3px) scale(1.01); }

    /* ── tiny chip ── */
    .chp {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 3px;
      font-family: 'JetBrains Mono', monospace;
      font-size: clamp(7px, 0.85vw, 9px);
      font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
    }

    /* ── pulse spark ── */
    @keyframes pg {
      0%,100% { box-shadow: 0 0 5px 1px rgba(74,164,225,.28); }
      50%      { box-shadow: 0 0 12px 3px rgba(74,164,225,.55); }
    }
    .pgn { animation: pg 2.2s ease-in-out infinite; }
    @keyframes spk { 0%,100%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1)} }
    .s0 { animation: spk 2s ease-in-out        infinite; }
    .s1 { animation: spk 2s ease-in-out  .65s  infinite; }
    .s2 { animation: spk 2s ease-in-out 1.3s   infinite; }

    /* ── gradient text ── */
    .gtext {
      background: linear-gradient(135deg, #4AA4E1 0%, #22d3ee 55%, #4AA4E1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── playlist mobile scroll ── */
    .pl-scroll {
      overflow-x: auto; overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(74,164,225,.2) transparent;
    }
    .pl-scroll::-webkit-scrollbar { height: 3px; }
    .pl-scroll::-webkit-scrollbar-thumb { background: rgba(74,164,225,.2); border-radius: 2px; }
    @media (min-width: 1024px) {
      .pl-scroll { overflow-x: hidden; overflow-y: auto; }
    }

    /* ── progress bar ── */
    .progress-fill { background: #4AA4E1; }

    /* ── hero layout specific ── */
    .hero-inner {
      display: grid;
      align-items: center;
      gap: clamp(2rem, 4vw, 5rem);
      grid-template-columns: 1fr;
    }
    @media (min-width: 1024px) {
      .hero-inner {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
      }
    }

    /* Prevent text from ever overflowing */
    .hero-headline {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      line-height: 1.0;
      letter-spacing: -0.02em;
      color: var(--text-main);
      /* Tightly clamped — never goes above ~72px regardless of viewport */
      font-size: clamp(1.9rem, 4.2vw + 0.5rem, 4.5rem);
      overflow-wrap: break-word;
      word-break: break-word;
    }
  `}</style>
);

/* ═══════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════ */
function OscWave() {
  return (
    <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full" aria-hidden>
      <path className="oa" stroke="rgba(74,164,225,.38)" strokeWidth="1.5" fill="none" strokeDasharray="300 400"
        d="M0,25L15,25L22,8L30,42L38,8L46,42L53,25L80,25L87,13L95,37L103,13L111,37L118,25
           L145,25L152,4L160,46L168,4L176,46L183,25L210,25L217,16L225,34L233,16L241,34L248,25
           L275,25L282,9L290,41L298,9L306,41L313,25L340,25L347,12L355,38L363,12L371,38L378,25
           L405,25L412,5L420,45L428,5L436,45L443,25L470,25L477,14L485,36L493,14L500,25" />
      <path className="ob" stroke="rgba(74,164,225,.10)" strokeWidth="1" fill="none" strokeDasharray="700"
        d="M0,25C62,25 62,8 125,8C188,8 188,42 250,42C312,42 312,8 375,8C438,8 438,42 500,42" />
    </svg>
  );
}

function Reveal({
  children, delay = 0, className = '',
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const v = useInView(r, { once: true, margin: '-40px' });
  return (
    <motion.div ref={r} className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={v ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 1 — HERO
   Compact, no badge, no blinking dot, no stretched text
═══════════════════════════════════════════════════════ */
function HeroSection({ glowStyle }: { glowStyle: any }) {
  return (
    <section className="lp-section bpg" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {/* Mouse glow */}
      <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ background: glowStyle }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 130% 90% at 50% 5%, transparent 0%, var(--bg-page) 82%)' }} />

      {/* Osc strip */}
      <div className="absolute bottom-0 inset-x-0 h-8 pointer-events-none z-0" style={{ opacity: 0.2 }}>
        <OscWave />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col justify-center h-full max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        <div className="hero-inner">

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.4rem)' }}>

            {/* Eyebrow — plain text, no pill/badge */}
            <motion.p
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="jm uppercase tracking-[.22em]"
              style={{ fontSize: 'clamp(9px, 1vw, 11px)', color: '#4AA4E1', letterSpacing: '0.22em' }}>
              CareSync
            </motion.p>

            {/* Headline — two lines, tight */}
            <div style={{ overflow: 'hidden' }}>
              <motion.h1
                className="hero-headline"
                initial={{ y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>
                Medication adherence
              </motion.h1>
              <motion.h1
                className="hero-headline gtext"
                initial={{ y: 48, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}>
                built for caregivers.
              </motion.h1>
            </div>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{
                fontSize: 'clamp(0.82rem, 1.3vw, 1rem)',
                color: 'var(--text-muted)',
                lineHeight: 1.65,
                maxWidth: '38ch',
              }}>
              NFC and Bluetooth pill devices. Real-time dashboard.
              Audit-ready reports — all in one place.
            </motion.p>

            {/* Stat row */}
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {([
                { val: '96%', label: 'avg adherence' },
                { val: 'E2E', label: 'encrypted' },
                { val: 'NFC', label: '+ Bluetooth' },
              ] as const).map(({ val, label }) => (
                <div key={label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', borderRadius: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                  <span className="sy" style={{ fontWeight: 800, fontSize: 'clamp(0.78rem, 1.2vw, 0.9rem)', color: '#4AA4E1' }}>
                    {val}
                  </span>
                  <span className="jm" style={{ fontSize: 'clamp(8px, 0.8vw, 9px)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.46 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/app"
                className="shm"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10,
                  background: '#4AA4E1',
                  color: '#fff',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: 'clamp(0.78rem, 1.1vw, 0.875rem)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 18px rgba(74,164,225,.28)',
                  transition: 'opacity .2s',
                }}>
                Launch dashboard <ArrowRight size={14} />
              </Link>
              <a
                href="#lp-video"
                onClick={e => { e.preventDefault(); document.getElementById('lp-video')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px', borderRadius: 10,
                  color: 'var(--text-main)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(0.78rem, 1.1vw, 0.875rem)',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  textDecoration: 'none',
                  transition: 'border-color .2s',
                  cursor: 'pointer',
                }}>
                <Play size={13} style={{ fill: '#4AA4E1', color: '#4AA4E1' }} />
                Watch demo
              </a>
            </motion.div>
          </div>

          {/* RIGHT — mini dashboard card */}
          <motion.div
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'none',
              // shown via media query below
            }}
            className="hidden lg:block">
            <div style={{
              borderRadius: 18,
              overflow: 'hidden',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 16px 48px rgba(0,0,0,.22)',
              width: 'clamp(260px, 25vw, 310px)',
            }}>
              {/* Titlebar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                  <span className="jm" style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>caresync.app</span>
                </div>
                <span className="jm" style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>live</span>
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Adherence row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <p className="jm" style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Today</p>
                    <p className="sy" style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', marginTop: 2 }}>
                      <span style={{ background: 'linear-gradient(135deg,#4AA4E1,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>96%</span>
                      {' '}doses taken
                    </p>
                  </div>
                  <CheckCircle size={16} style={{ color: '#4ade80', flexShrink: 0 }} />
                </div>

                {/* 2-col */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {([
                    { label: 'Devices online', val: '7 / 7', color: '#4AA4E1' },
                    { label: 'Alerts', val: '0 critical', color: '#4ade80' },
                  ] as const).map(({ label, val, color }) => (
                    <div key={label} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                      <p className="jm" style={{ fontSize: 7.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                      <p className="sy" style={{ fontWeight: 700, fontSize: '0.72rem', color, marginTop: 4 }}>{val}</p>
                    </div>
                  ))}
                </div>

                {/* Osc strip */}
                <div style={{ position: 'relative', height: 38, borderRadius: 8, overflow: 'hidden', background: 'rgba(0,0,0,.75)' }}>
                  <OscWave />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => document.getElementById('lp-video')?.scrollIntoView({ behavior: 'smooth' })}
                      className="jm"
                      style={{ fontSize: 9, color: 'rgba(255,255,255,.55)', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Play size={10} style={{ fill: 'rgba(255,255,255,.55)' }} /> architecture tour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 10 }}>
        <motion.div
          animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{ width: 16, height: 24, borderRadius: 8, border: '1px solid rgba(148,163,184,.28)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4 }}>
          <div style={{ width: 2, height: 6, borderRadius: 2, background: 'rgba(74,164,225,.55)' }} />
        </motion.div>
        <span className="jm" style={{ fontSize: 8, color: 'rgba(148,163,184,.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>scroll</span>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 2 — VIDEO SHOWCASE
═══════════════════════════════════════════════════════ */
interface VideoItem {
  id: string; title: string; description: string; duration: string;
  src: string; icon: any; tech: string[];
}

function VideoSection() {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showCtrl, setShowCtrl] = useState(true);
  const vRef = useRef<HTMLVideoElement>(null);
  const ctrlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videos: VideoItem[] = [
    { id: 'hw', title: 'Hardware', description: 'Prototype boards to a custom PCB.', duration: '3:24', src: '/videos/caresync-hardware.mp4', icon: CircuitBoard, tech: ['ESP32‑S3', 'KiCad', 'BLE 5.0'] },
    { id: 'sw', title: 'Software', description: 'React, Node.js and embedded C.', duration: '4:12', src: '/videos/caresync-software.mp4', icon: Code2, tech: ['React', 'Node.js', 'TypeScript'] },
    { id: 'sec', title: 'Security', description: 'Auth, encryption and audit logs.', duration: '2:58', src: '/videos/caresync-security.mp4', icon: Shield, tech: ['JWT', 'AES‑256', 'Audit'] },
    { id: 'tl', title: 'Timeline', description: 'How the project evolved.', duration: '3:45', src: '/videos/caresync-timeline.mp4', icon: Activity, tech: ['Planning', 'CI/CD', 'Tests'] },
    { id: 'tm', title: 'Team', description: 'Collaboration and code reviews.', duration: '2:36', src: '/videos/caresync-team.mp4', icon: Users, tech: ['GitHub', 'Figma', 'Notion'] },
  ];

  const v = videos[current];
  const Icon = v.icon;

  const togglePlay = () => {
    if (!vRef.current) return;
    playing ? vRef.current.pause() : vRef.current.play();
    setPlaying(p => !p);
  };
  const handleTime = () => {
    if (vRef.current?.duration)
      setProgress((vRef.current.currentTime / vRef.current.duration) * 100);
  };
  const handleEnd = () => {
    setPlaying(false);
    if (current < videos.length - 1)
      setTimeout(() => { setCurrent(c => c + 1); setPlaying(true); }, 1600);
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!vRef.current?.duration) return;
    const p = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.offsetWidth;
    vRef.current.currentTime = p * vRef.current.duration;
  };
  const skip = (s: number) => { if (vRef.current) vRef.current.currentTime += s; };
  const interact = () => {
    setShowCtrl(true);
    if (ctrlTimer.current) clearTimeout(ctrlTimer.current);
    if (playing) ctrlTimer.current = setTimeout(() => setShowCtrl(false), 2500);
  };
  const selectVideo = (i: number) => {
    setCurrent(i); setPlaying(false); setProgress(0);
    setTimeout(() => { vRef.current?.load(); vRef.current?.play(); setPlaying(true); }, 80);
  };
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

  const accent = '#4AA4E1';

  return (
    <section id="lp-video" className="lp-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 1400, margin: '0 auto', padding: 'clamp(14px,2vw,20px) clamp(16px,3vw,28px)', gap: 12 }}>

        {/* Header */}
        <Reveal style={{ flexShrink: 0 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ position: 'relative', width: 6, height: 6 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: accent }} />
              <div style={{ position: 'absolute', inset: -1, borderRadius: '50%', border: `0.5px solid ${accent}`, borderTopColor: 'transparent', animation: 'spin 3s linear infinite' }} />
            </div>
            <p className="jm" style={{ fontSize: 'clamp(8px,1vw,10px)', color: accent, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              A real product · designed and built end-to-end
            </p>
          </div>
          <h2 className="sy" style={{ fontWeight: 800, fontSize: 'clamp(1.3rem,2.8vw,2rem)', color: 'var(--text-main)', lineHeight: 1.2 }}>
            Inside CareSync <span style={{ color: accent }}>→</span>
          </h2>
        </Reveal>

        {/* Grid */}
        <Reveal delay={0.08} style={{ flex: 1, minHeight: 0 } as any}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, height: '100%' }}
            className="lg:grid-cols-[1fr_260px]">

            {/* ── PLAYER ── */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  borderRadius: 12, overflow: 'hidden', flex: 1, minHeight: 0,
                  background: 'var(--bg-card)',
                  border: `1px solid ${playing ? 'rgba(74,164,225,.38)' : 'var(--border-subtle)'}`,
                  transition: 'border-color .4s, box-shadow .4s',
                  boxShadow: playing ? '0 8px 32px rgba(74,164,225,.06)' : 'none',
                }}
                onMouseMove={interact}
                onMouseLeave={() => playing && setShowCtrl(false)}>

                <div style={{ position: 'relative', background: '#000', flex: 1, minHeight: 0 }}>
                  <video ref={vRef} src={v.src}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onTimeUpdate={handleTime} onEnded={handleEnd}
                    onClick={togglePlay} playsInline preload="metadata" />

                  {!playing && progress === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.44)' }}>
                      <button onClick={togglePlay}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 20px', borderRadius: 100, background: 'rgba(74,164,225,.9)', color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 'clamp(0.75rem,1.1vw,0.85rem)', border: 'none', cursor: 'pointer', transition: 'transform .15s', boxShadow: '0 4px 16px rgba(74,164,225,.3)' }}>
                        <Play size={15} style={{ fill: '#fff', marginLeft: 2 }} /> Watch demo
                      </button>
                    </div>
                  )}
                  {!playing && progress > 0 && progress < 100 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.3)' }}>
                      <button onClick={togglePlay}
                        style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(74,164,225,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <Play size={20} style={{ fill: '#fff', marginLeft: 2 }} />
                      </button>
                    </div>
                  )}

                  {/* Controls */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, transition: 'opacity .3s, transform .3s', opacity: showCtrl || !playing ? 1 : 0, transform: showCtrl || !playing ? 'translateY(0)' : 'translateY(10px)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.4), transparent)' }} />
                    <div style={{ position: 'relative', height: 4, margin: '0 12px 8px', cursor: 'pointer', borderRadius: 2, background: 'rgba(255,255,255,.18)' }} onClick={seek}>
                      <div style={{ position: 'absolute', height: '100%', borderRadius: 2, background: accent, width: `${progress}%` }} />
                    </div>
                    <div style={{ position: 'relative', padding: '0 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={togglePlay} style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                          {playing ? <Pause size={13} style={{ fill: '#fff' }} /> : <Play size={13} style={{ fill: '#fff' }} />}
                        </button>
                        <button onClick={() => skip(-10)} className="jm hidden sm:block" style={{ padding: '4px 6px', borderRadius: 5, background: 'rgba(255,255,255,.06)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontSize: 8 }}>-10s</button>
                        <button onClick={() => skip(10)} className="jm hidden sm:block" style={{ padding: '4px 6px', borderRadius: 5, background: 'rgba(255,255,255,.06)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.7)', fontSize: 8 }}>+10s</button>
                        <span className="jm" style={{ fontSize: 8, color: 'rgba(255,255,255,.6)', marginLeft: 4 }}>
                          {vRef.current ? `${fmt(vRef.current.currentTime)} / ${v.duration}` : `0:00 / ${v.duration}`}
                        </span>
                      </div>
                      <div className="hidden sm:flex" style={{ gap: 2, background: 'rgba(255,255,255,.1)', borderRadius: 6, padding: 2 }}>
                        {[1, 1.5, 2].map(s => (
                          <button key={s} onClick={() => { if (vRef.current) vRef.current.playbackRate = s; setSpeed(s); }}
                            className="jm" style={{ padding: '3px 6px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 8, fontWeight: 700, background: speed === s ? accent : 'transparent', color: speed === s ? '#fff' : 'rgba(255,255,255,.55)', transition: 'background .15s' }}>
                            {s}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info bar */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                  <div style={{ width: 30, height: 30, flexShrink: 0, borderRadius: 8, background: 'rgba(74,164,225,.1)', border: '1px solid rgba(74,164,225,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: accent }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 className="sy" style={{ fontWeight: 700, fontSize: 'clamp(0.72rem,1.1vw,0.85rem)', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.title}
                      </h3>
                      <span className="jm" style={{ flexShrink: 0, fontSize: 7.5, color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 4 }}>
                        {String(current + 1).padStart(2, '0')} / {String(videos.length).padStart(2, '0')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                      {v.tech.map(t => (
                        <span key={t} className="jm" style={{ fontSize: 7, color: 'var(--text-muted)', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', padding: '1px 5px', borderRadius: 3 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── PLAYLIST ── */}
            <div className="pl-scroll" style={{ display: 'flex', flexDirection: 'row', gap: 8, paddingBottom: 4 }}
            // on lg: flex-col
            >
              <style>{`@media(min-width:1024px){.pl-inner{flex-direction:column!important}}`}</style>
              <div className="pl-inner" style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {videos.map((vid, i) => {
                  const VI = vid.icon;
                  const isActive = i === current;
                  const isDone = i < current;
                  return (
                    <button key={vid.id} onClick={() => selectVideo(i)}
                      style={{
                        textAlign: 'left', padding: 10, borderRadius: 10,
                        flexShrink: 0, width: 200,
                        border: `1px solid ${isActive ? 'rgba(74,164,225,.38)' : 'var(--border-subtle)'}`,
                        background: isActive ? 'rgba(74,164,225,.055)' : 'var(--bg-card)',
                        boxShadow: isActive ? '0 2px 12px rgba(74,164,225,.07)' : 'none',
                        cursor: 'pointer', transition: 'all .25s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(74,164,225,.18)' : isDone ? 'rgba(74,222,128,.1)' : 'var(--bg-hover)', color: isActive ? accent : isDone ? '#4ade80' : 'var(--text-muted)', flexShrink: 0 }}>
                          {isDone ? <CheckCircle size={11} /> : <VI size={11} />}
                        </div>
                        <span className="jm" style={{ fontSize: 7.5, color: 'var(--text-muted)' }}>{vid.duration}</span>
                      </div>
                      <h4 className="sy" style={{ fontWeight: 600, fontSize: 'clamp(0.68rem,0.9vw,0.78rem)', color: isActive ? accent : 'var(--text-main)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {i + 1}. {vid.title}
                      </h4>
                      <p style={{ fontSize: 'clamp(0.62rem,0.82vw,0.7rem)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vid.description}
                      </p>
                      {isActive && playing && (
                        <div style={{ marginTop: 6, height: 2, borderRadius: 1, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: accent, width: `${progress}%` }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 3 — PROJECT BREAKDOWN
═══════════════════════════════════════════════════════ */
const BENTO = [
  { id: 'hardware', icon: CircuitBoard, col: '#22d3ee', route: '/showcase/hardware', title: 'Hardware', headline: 'From prototype boards to a custom PCB.', body: 'ESP32‑S3 with power domains, sensors and BLE — designed specifically for adherence tracking.', tags: ['ESP32‑S3', 'KiCad', 'BLE 5.0'], size: 'large' },
  { id: 'software', icon: Code2, col: '#60a5fa', route: '/showcase/software', title: 'Software', headline: 'React, Node.js and embedded C.', body: 'A shared domain model connects dashboard, API and firmware so all layers stay in sync.', tags: ['React', 'Node.js', 'TypeScript', 'C'], size: 'large' },
  { id: 'security', icon: Shield, col: '#f87171', route: '/showcase/security', title: 'Security', headline: 'Privacy and safety first.', body: 'Auth, encryption and logging built around sensitive health data requirements.', tags: ['AES‑256', 'JWT', 'Audit logs'], size: 'small' },
  { id: 'timeline', icon: Activity, col: '#c084fc', route: '/showcase/timeline', title: 'Timeline', headline: 'How the project evolved.', body: 'Decisions and refactors documented as a technical history.', tags: ['Planning', 'CI/CD', 'Testing'], size: 'small' },
  { id: 'team', icon: Users, col: '#4ade80', route: '/showcase/team', title: 'Team', headline: 'People behind CareSync.', body: 'How responsibilities were split and how the group kept a consistent direction.', tags: ['Git', 'Figma', 'Notion'], size: 'small' },
] as const;

function BreakdownSection() {
  const accent = '#4AA4E1';
  return (
    <section className="lp-section" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(16px,2.5vw,24px) clamp(16px,4vw,40px)', gap: 14 }}>

        <Reveal style={{ flexShrink: 0 } as any}>
          <p className="jm" style={{ fontSize: 'clamp(8px,1vw,10px)', color: accent, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>
            A real product · designed and built end-to-end
          </p>
          <h2 className="sy" style={{ fontWeight: 800, fontSize: 'clamp(1.3rem,2.8vw,2rem)', color: 'var(--text-main)', lineHeight: 1.2 }}>
            Inside CareSync <span style={{ color: accent }}>→</span>
          </h2>
        </Reveal>

        {/* Row 1 */}
        <Reveal delay={0.05} style={{ flex: 1, minHeight: 0 } as any}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, height: '100%' }}>
            {BENTO.filter(b => b.size === 'large').map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.id} to={item.route}
                  className="lft group"
                  style={{ display: 'flex', flexDirection: 'column', padding: 'clamp(14px,2vw,20px)', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none', position: 'relative', overflow: 'hidden', transition: 'border-color .25s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = item.col + '55')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                  <div style={{ position: 'absolute', top: -32, right: -32, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${item.col}1e 0%, transparent 70%)`, opacity: 0, transition: 'opacity .4s', pointerEvents: 'none' }} className="group-hover:opacity-100" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'auto' }}>
                    <div className="chp" style={{ background: `${item.col}18`, border: `1px solid ${item.col}44`, color: item.col }}>{item.title}</div>
                    <Icon size={13} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ marginTop: 'clamp(12px,2vw,20px)' }}>
                    <h3 className="sy" style={{ fontWeight: 700, fontSize: 'clamp(0.9rem,1.8vw,1.15rem)', color: 'var(--text-main)', lineHeight: 1.3, marginBottom: 6 }}>{item.headline}</h3>
                    <p style={{ fontSize: 'clamp(0.7rem,1.05vw,0.8rem)', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 10 }}>{item.body}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.tags.map(tag => (
                        <span key={tag} className="jm" style={{ background: `${item.col}10`, border: `1px solid ${item.col}30`, color: item.col, fontSize: 'clamp(7px,0.75vw,8.5px)', padding: '1px 6px', borderRadius: 3 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="jm" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 'clamp(7px,0.75vw,8.5px)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Explore <ArrowRight size={8} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>

        {/* Row 2 */}
        <Reveal delay={0.12} style={{ flexShrink: 0 } as any}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {BENTO.filter(b => b.size === 'small').map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.id} to={item.route}
                  className="lft"
                  style={{ display: 'flex', flexDirection: 'column', padding: 'clamp(12px,1.8vw,16px)', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textDecoration: 'none', transition: 'border-color .25s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = item.col + '55')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'auto' }}>
                    <div className="chp" style={{ background: `${item.col}18`, border: `1px solid ${item.col}44`, color: item.col }}>{item.title}</div>
                    <Icon size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ marginTop: 'clamp(10px,1.5vw,14px)' }}>
                    <h3 className="sy" style={{ fontWeight: 700, fontSize: 'clamp(0.72rem,1.3vw,0.9rem)', color: 'var(--text-main)', lineHeight: 1.3, marginBottom: 4 }}>{item.headline}</h3>
                    <p style={{ fontSize: 'clamp(0.63rem,0.9vw,0.72rem)', color: 'var(--text-muted)', lineHeight: 1.55 }}>{item.body}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SECTION 4 — DEMO CTA
═══════════════════════════════════════════════════════ */
function DemoSection() {
  const accent = '#4AA4E1';
  return (
    <section className="lp-section bpg" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="s0 absolute" style={{ top: 40, left: '22%', width: 8, height: 8, borderRadius: '50%' }} />
      <div className="s1 absolute" style={{ bottom: 48, right: '28%', width: 6, height: 6, borderRadius: '50%' }} />
      <div className="s2 absolute" style={{ top: 64, right: '18%', width: 4, height: 4, borderRadius: '50%' }} />
      <div className="pgn absolute" style={{ top: 40, left: '22%', width: 8, height: 8, borderRadius: '50%', background: accent }} />
      <div className="pgn absolute" style={{ bottom: 48, right: '28%', width: 6, height: 6, borderRadius: '50%', background: accent, animationDelay: '.6s' }} />
      <div className="pgn absolute" style={{ top: 64, right: '18%', width: 4, height: 4, borderRadius: '50%', background: accent, animationDelay: '1.2s' }} />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(74,164,225,.055), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 24px', gap: 20 }}>

        <Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 100, border: '1px solid rgba(74,164,225,.2)', background: 'rgba(74,164,225,.055)', marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'inline-block' }} />
            <span className="jm" style={{ fontSize: 'clamp(8px,1vw,10px)', color: accent, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              CareSync · Student-built, real stack
            </span>
          </div>

          <h2 className="sy" style={{ fontWeight: 800, fontSize: 'clamp(1.8rem,4.5vw,4rem)', color: 'var(--text-main)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Built as a project.{' '}
            <span style={{ background: 'linear-gradient(135deg,#4AA4E1,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Designed like a product.
            </span>
          </h2>

          <p className="jm" style={{ fontSize: 'clamp(0.7rem,1.1vw,0.82rem)', color: 'var(--text-muted)', maxWidth: '40ch', margin: '12px auto 0', lineHeight: 1.7 }}>
            Architecture, API surface and security decisions are documented and visible in the app.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            <Link to="/app"
              className="shm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 11, background: accent, color: '#fff', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 'clamp(0.78rem,1.1vw,0.875rem)', textDecoration: 'none', boxShadow: '0 4px 22px rgba(74,164,225,.28)' }}>
              Launch live dashboard <ArrowRight size={14} />
            </Link>
            <Link to="/showcase"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 11, color: 'var(--text-main)', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 'clamp(0.78rem,1.1vw,0.875rem)', border: '1px solid var(--border-subtle)', background: 'transparent', textDecoration: 'none' }}>
              Explore project <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>

        {/* Page dots */}
        <Reveal delay={0.2} style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 } as any}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: 6, borderRadius: 3, background: i === 3 ? accent : 'rgba(148,163,184,.22)', width: i === 3 ? 18 : 6, transition: 'all .3s' }} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 22 });
  const smy = useSpring(my, { stiffness: 50, damping: 22 });
  const glow = useMotionValue('');

  useEffect(() => {
    const u = smx.on('change', () =>
      glow.set(`radial-gradient(440px at ${smx.get()}px ${smy.get()}px, rgba(74,164,225,.065), transparent 75%)`)
    );
    const h = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => { window.removeEventListener('mousemove', h); u(); };
  }, [mx, my, smx, smy, glow]);

  return (
    <>
      <PageStyles />
      <div className="lp-scroll sy" style={{ background: 'var(--bg-page)', color: 'var(--text-main)' }}>
        <HeroSection glowStyle={glow} />
        <VideoSection />
        <BreakdownSection />
        <DemoSection />
      </div>
    </>
  );
}