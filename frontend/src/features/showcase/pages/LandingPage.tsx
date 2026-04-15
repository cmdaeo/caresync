/**
 * LandingPage - LEEC · Universidade de Aveiro
 *
 * Viewport safety rules applied throughout:
 *  • No whitespace-nowrap on large headline text
 *  • Font sizes use px breakpoints (Tailwind sm/md/lg), never raw vw
 *  • All containers have max-w + overflow-hidden guards
 *  • Horizontal scroll: useScroll({ container, target }) - container = page scroll div
 */
import { useRef, useState, useEffect } from 'react';
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Code2, Wifi, Shield, Activity, Users,
  CircuitBoard, Briefcase, 
  FlaskConical, Cpu, Radio, Battery,
  ChevronRight,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

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

function CountUp({ n }: { n: number }) {
  const r = useRef<HTMLSpanElement>(null);
  const v = useInView(r, { once: true });
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!v) return;
    const t0 = performance.now(), dur = 1200;
    const f = (t: number) => {
      const p = Math.min((t - t0) / dur, 1);
      setC(Math.round((1 - Math.pow(1 - p, 3)) * n));
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }, [v, n]);
  return <span ref={r}>{c}</span>;
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIDEO SHOWCASE - Interactive project demos
═══════════════════════════════════════════════════════════════════════════ */
interface VideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  src: string;
  icon: any;
  tech: string[];
}

function VideoShowcase({ t }: { t: typeof T[Lang] }) {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videos: VideoItem[] = [
    {
      id: 'hardware',
      title: 'Hardware Architecture',
      description: 'From breadboard to production PCB. ESP32-S3 integration, power management, and sensor interfacing.',
      duration: '3:24',
      thumbnail: '/videos/thumbnails/hardware.jpg',
      src: '/videos/caresync-hardware.mp4',
      icon: CircuitBoard,
      tech: ['ESP32-S3', 'KiCad', 'PCB Design']
    },
    {
      id: 'software',
      title: 'Software Stack',
      description: 'React frontend, Node.js backend, embedded C firmware. Real-time synchronization across all layers.',
      duration: '4:12',
      thumbnail: '/videos/thumbnails/software.jpg',
      src: '/videos/caresync-software.mp4',
      icon: Code2,
      tech: ['React', 'Node.js', 'TypeScript']
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      description: 'HIPAA-compliant architecture. End-to-end encryption, audit logs, zero-trust security model.',
      duration: '2:58',
      thumbnail: '/videos/thumbnails/security.jpg',
      src: '/videos/caresync-security.mp4',
      icon: Shield,
      tech: ['AES-GCM', 'HIPAA', 'OAuth2']
    },
    {
      id: 'timeline',
      title: 'Development Timeline',
      description: '14-week sprint breakdown. Agile methodology, CI/CD pipeline, automated testing at every stage.',
      duration: '3:45',
      thumbnail: '/videos/thumbnails/timeline.jpg',
      src: '/videos/caresync-timeline.mp4',
      icon: Activity,
      tech: ['Agile', 'GitHub Actions', 'Jest']
    },
    {
      id: 'team',
      title: 'Team & Collaboration',
      description: '12 engineers, one mission. Cross-functional teams, code reviews, knowledge sharing sessions.',
      duration: '2:36',
      thumbnail: '/videos/thumbnails/team.jpg',
      src: '/videos/caresync-team.mp4',
      icon: Users,
      tech: ['Git', 'Figma', 'Notion']
    }
  ];

  // Logic handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted) setVolume(0);
      else setVolume(1);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setProgress(100);
    if (currentVideo < videos.length - 1) {
      setTimeout(() => {
        setCurrentVideo(prev => prev + 1);
        setIsPlaying(true);
      }, 2000);
    }
  };

  const selectVideo = (index: number) => {
    setCurrentVideo(index);
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const currentVid = videos[currentVideo];
  const Icon = currentVid.icon;

  return (
    // STRICT VIEWPORT HEIGHT: We force the section to be exactly 100dvh minus padding, or min 600px.
    // overflow-hidden prevents the page from expanding past this block if contents are too tall.
    <section className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 border-t border-border-subtle relative h-[100dvh] min-h-[600px] flex flex-col justify-center overflow-hidden">
      <div className="max-w-[1400px] w-full mx-auto relative z-10 flex flex-col h-full max-h-[900px]">
        
        {/* HEADER - Kept extremely compact */}
        <Reveal className="mb-4 sm:mb-6 shrink-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="relative flex items-center justify-center w-1.5 h-1.5">
              <div className="absolute w-1 h-1 rounded-full bg-brand-primary" />
              <div className="w-full h-full rounded-full border-[0.5px] border-brand-primary border-t-transparent animate-spin [animation-duration:3s]" />
            </div>
            <p className="jm text-[9px] uppercase tracking-[.2em] text-brand-primary">
              {t.projSub}
            </p>
          </div>
          <h2 className="sy font-800 text-2xl sm:text-3xl md:text-4xl leading-tight">
            {t.projH} <span className="text-brand-primary">→</span>
          </h2>
        </Reveal>

        {/* MAIN CONTENT GRID - Fills remaining height completely */}
        <Reveal delay={0.1} className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
            
            {/* LEFT COLUMN: Video Player & Info (8/12 cols) */}
            {/* flex flex-col h-full ensures it stretches but never overflows */}
            <div className="lg:col-span-8 flex flex-col gap-3 h-full max-h-full">
              <div 
                className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-500 bg-bg-card flex-1 min-h-0 ${
                  isPlaying ? 'border-brand-primary/40 shadow-2xl shadow-brand-primary/5' : 'border-border-subtle'
                }`}
                onMouseMove={handleInteraction}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                {/* Video Container - min-h-0 is crucial to prevent flex flexbox overflow */}
                <div className={`relative bg-black transition-all duration-500 flex-1 min-h-0 ${isPlaying ? 'brightness-95' : 'brightness-100'}`}>
                  <video
                    ref={videoRef}
                    src={currentVid.src}
                    className="w-full h-full object-contain bg-[#050505]"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnd}
                    onClick={togglePlay}
                    playsInline
                    preload="metadata"
                  />

                  {/* Play Button Overlay (Initial/Paused) */}
                  {!isPlaying && progress === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <button onClick={togglePlay} className="group flex items-center gap-3 px-6 py-3 rounded-full bg-brand-primary/90 hover:bg-brand-primary text-white font-600 text-sm transition-all hover:scale-105 shadow-2xl">
                        <Play size={18} className="ml-1 fill-current" /> Watch Demo
                      </button>
                    </div>
                  )}

                  {!isPlaying && progress > 0 && progress < 100 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-brand-primary/90 hover:bg-brand-primary flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl">
                        <Play size={24} className="ml-1 fill-current" />
                      </button>
                    </div>
                  )}

                  {/* Video Controls Overlay */}
                  <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    
                    <div className="relative h-1.5 mx-4 mb-2 cursor-pointer group" onClick={handleProgressClick}>
                      <div className="absolute inset-0 bg-white/20 rounded-full" />
                      <div className="absolute h-full bg-brand-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      <div className="absolute h-2.5 w-2.5 bg-white rounded-full -top-[2px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${progress}%`, transform: 'translateX(-50%)' }} />
                    </div>

                    <div className="relative px-3 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={togglePlay} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                          {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
                        </button>
                        <button onClick={() => skip(-10)} className="hidden sm:block p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white jm text-[9px]">-10s</button>
                        <button onClick={() => skip(10)} className="hidden sm:block p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white jm text-[9px]">+10s</button>

                        <div className="flex items-center gap-1 group/vol">
                          <button onClick={toggleMute} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white">
                            {isMuted || volume === 0 ? <Wifi size={14} className="rotate-45" /> : <Wifi size={14} />}
                          </button>
                          <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-brand-primary h-1" />
                        </div>

                        <span className="jm text-[9px] text-white/80 ml-2">
                          {videoRef.current ? `${Math.floor(videoRef.current.currentTime / 60)}:${String(Math.floor(videoRef.current.currentTime % 60)).padStart(2, '0')} / ${currentVid.duration}` : `0:00 / ${currentVid.duration}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="hidden sm:flex items-center gap-0.5 bg-white/10 rounded-lg p-0.5">
                          {[1, 1.5, 2].map(speed => (
                            <button key={speed} onClick={() => handleSpeedChange(speed)} className={`px-2 py-1 rounded-md jm text-[9px] font-600 transition-all ${playbackSpeed === speed ? 'bg-brand-primary text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Info Bar - Fixed small height to prevent stretching */}
                <div className="border-t border-border-subtle p-3 sm:p-4 shrink-0 bg-bg-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                        <Icon size={18} className="text-brand-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="sy font-700 text-sm sm:text-base text-text-main truncate">{currentVid.title}</h3>
                          <span className="jm text-[9px] text-text-muted border border-border-subtle px-2 py-0.5 rounded-md shrink-0">
                            {String(currentVideo + 1).padStart(2, '0')} / {String(videos.length).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mt-1.5 overflow-hidden">
                          {currentVid.tech.map(tech => (
                            <span key={tech} className="jm text-[8px] px-1.5 py-0.5 rounded bg-bg-hover border border-border-subtle text-text-muted whitespace-nowrap">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Playlist (4/12 cols) */}
            {/* Uses overflow-y-auto so the container stays strictly within the grid, but internal items scroll */}
            <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto lg:pr-2 snap-x snap-mandatory pb-2 lg:pb-0 custom-scrollbar h-full max-h-full">
              {videos.map((video, index) => {
                const VidIcon = video.icon;
                const isActive = index === currentVideo;
                const isCompleted = index < currentVideo;

                return (
                  <button
                    key={video.id}
                    onClick={() => selectVideo(index)}
                    className={`group text-left p-3 rounded-xl border transition-all duration-300 shrink-0 w-[260px] lg:w-full snap-start ${
                      isActive 
                        ? 'border-brand-primary/40 bg-brand-primary/5 shadow-md shadow-brand-primary/5' 
                        : 'border-border-subtle bg-bg-card hover:border-brand-primary/20 hover:bg-bg-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                        isActive ? 'bg-brand-primary/20 text-brand-primary' 
                        : isCompleted ? 'bg-green-500/10 text-green-400' 
                        : 'bg-bg-hover text-text-muted group-hover:text-brand-primary/70'
                      }`}>
                        {isCompleted ? <CheckCircle size={12} /> : <VidIcon size={12} />}
                      </div>
                      <span className="jm text-[8px] text-text-muted">{video.duration}</span>
                    </div>
                    
                    <h4 className={`text-xs font-600 mb-0.5 transition-colors truncate ${isActive ? 'text-brand-primary' : 'text-text-main'}`}>
                      {index + 1}. {video.title}
                    </h4>
                    <p className="text-[10px] text-text-muted line-clamp-1">
                      {video.description}
                    </p>

                    {isActive && isPlaying && (
                      <div className="mt-2 h-[2px] bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PROJECT BREAKDOWN — BENTO GRID
   Replaces the old horizontal scroll. Shows the 5 CareSync pillars in an
   asymmetric bento layout. The tone is "look what we built", not "apply here".
═══════════════════════════════════════════════════════════════════════════ */
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
    <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-10 border-t border-border-subtle">
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

  return (
    <>
      <CSS />

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

        {/* ════════════════════════════════════════════════════════════════
            DISCIPLINES + STATS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-14 sm:py-22 px-4 sm:px-6 md:px-10">
          <div className="max-w-5xl mx-auto">
            <Reveal className="mb-10">
              <p className="jm text-[10px] uppercase tracking-[.2em] text-brand-primary mb-2">{t.discH}</p>
              <h2 className="sy font-800 text-3xl sm:text-4xl leading-tight">
                One degree. <GText>Every direction.</GText>
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {t.disc.map(({ label, desc, col }, i) => {
                const Icon = [CircuitBoard, Code2, Wifi][i];
                return (
                  <Reveal key={label} delay={i * .07}>
                    <div className="lft p-5 rounded-xl bg-bg-card border border-border-subtle
                      hover:border-(--c) transition-all h-full"
                      style={{ '--c': col } as React.CSSProperties}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 border"
                        style={{ background: `${col}18`, borderColor: `${col}40`, color: col }}>
                        <Icon size={18} />
                      </div>
                      <p className="jm text-[9px] uppercase tracking-widest text-text-muted mb-1">0{i + 1} - module</p>
                      <h3 className="sy font-700 text-base sm:text-lg leading-tight mb-2">{label}</h3>
                      <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-border-subtle overflow-hidden">
              {t.stats.map(([v, u, l], i) => {
                const n = parseInt(v, 10);
                return (
                  <div key={i} className={`flex flex-col items-center gap-0.5 p-4 sm:p-5 bg-bg-card hover:bg-bg-hover transition-colors text-center
                    ${i < 3 ? 'border-r border-border-subtle' : ''}`}>
                    <div className="sy font-800 text-3xl sm:text-4xl flex items-end gap-0.5">
                      <GText>{!isNaN(n) ? <CountUp n={n} /> : v}</GText>
                      <span className="jm text-sm text-brand-primary mb-1">{u}</span>
                    </div>
                    <span className="jm text-[9px] uppercase tracking-widest text-text-muted leading-snug">{l}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            VideoShowcase
        ════════════════════════════════════════════════════════════════ */}
        <VideoShowcase t={t} />

        {/* ════════════════════════════════════════════════════════════════
            CAREERS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-10 border-t border-border-subtle">
          <div className="max-w-5xl mx-auto">
            <Reveal className="mb-8">
                <p className="jm text-[10px] uppercase tracking-[.2em] text-brand-primary mb-2">
                  {t.carSub}
                </p>
                <h2 className="sy font-800 text-3xl sm:text-4xl leading-tight">
                  {t.carH} <GText>→</GText>
                </h2>
              </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {t.careers.map(({ icon: Icon, label, desc }, i) => (
                <Reveal key={label} delay={i * .05}>
                  <div className="lft p-5 sm:p-6 rounded-xl bg-bg-card border border-border-subtle
  hover:border-brand-primary/35 hover:bg-bg-hover transition-all h-full flex flex-col">
  
  <div className="w-10 h-10 mb-4 rounded-lg bg-brand-primary/10 border border-brand-primary/20
    flex items-center justify-center shrink-0">
    <Icon size={18} className="text-brand-primary" />
  </div>
  
  <div className="mt-auto">
    <h3 className="sy font-700 text-[15px] text-text-main leading-snug mb-1.5">{label}</h3>
    <p className="text-[13px] text-text-muted leading-relaxed">{desc}</p>
  </div>
  
</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            QUOTE BREAK
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative py-16 sm:py-24 border-t border-border-subtle overflow-hidden bpg">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(74,164,225,.07), transparent)' }} />
          <div className="s0 absolute top-8 left-[22%] w-2 h-2 rounded-full pgn" />
          <div className="s1 absolute bottom-8 right-[28%] w-1.5 h-1.5 rounded-full pgn" style={{ animationDelay: '.6s' }} />
          <div className="s2 absolute top-12 right-[20%] w-1 h-1 rounded-full pgn" style={{ animationDelay: '1.2s' }} />
          <Reveal className="relative z-10 px-4 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/8">
              <span className="jm text-[9px] uppercase tracking-widest text-brand-primary">CareSync · LEEC Student Project 2026</span>
            </div>
            <blockquote className="sy font-800 text-3xl sm:text-4xl md:text-5xl leading-tight tracking-tight">
              Built by students.{' '}
              <GText>Ready for the world.</GText>
            </blockquote>
            <p className="jm text-xs text-text-muted mt-4 tracking-wider">- LEEC / DETI, Universidade de Aveiro</p>
          </Reveal>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PROJECT BREAKDOWN — BENTO GRID
        ════════════════════════════════════════════════════════════════ */}
        <ProjectBreakdown t={t} />

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