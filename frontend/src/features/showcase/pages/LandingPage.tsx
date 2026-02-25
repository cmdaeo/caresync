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
  AnimatePresence, useMotionValue, useInView,
} from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Code2, Wifi, Shield, Activity, Users,
  Globe, CircuitBoard, Briefcase, 
  FlaskConical, Cpu, Radio, Battery,
  ChevronRight
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
    @keyframes osc { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -500 } }
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

    /* ─── HORIZONTAL SCROLL PIN ──────────────────────────────────────────
       Works by making .hs-outer very tall so the page scrolls through it.
       .hs-inner is sticky at top:0, height:100dvh - it never moves.
       The motion.div rail slides horizontally inside it.

       On mobile (< 640px): everything un-pins, cards stack vertically.
    ──────────────────────────────────────────────────────────────────── */
    .hs-inner {
      position: sticky;
      top: 20%;               /* Sticks it nicely near the top instead of flush to 0 */
      height: 50vh;           /* Give it just enough height, not the whole screen */
      min-height: 400px;      /* Ensure it doesn't get too small */
      overflow: hidden;
      display: flex;
      align-items: center;    
    }
    .hs-rail {
      display: flex;
      gap: 16px;
      padding-left: 6vw;
      padding-right: 12vw;   /* ensure last card is fully visible */
      will-change: transform;
    }

        @media (max-width: 639px) {
      .hs-outer  { height: auto !important; }
      .hs-inner  { 
        position: static; 
        height: auto; 
        overflow: visible;
        display: flex;
        flex-direction: column;
        align-items: center; /* Ensures the rail inside gets centered */
      }
      .hs-rail { 
        flex-direction: column; 
        align-items: center; /* Centers the cards inside the rail */
        padding: 0 1rem;     /* Overrides the 6vw padding-left and 12vw padding-right */
        gap: 16px; 
        width: 100%;         /* Ensures the rail spans the screen */
        transform: none !important; /* Force disables Framer Motion's X transform on mobile */
      }
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

const CURRICULUM_PT = [
  {
    sem1: [['Intro. aos Sistemas Digitais','IA',6],['Intro. à Eng. Eletrotécnica','ELE',6],['Programação','I',6],['Cálculo I','M',6],['Álgebra Linear','M',6]],
    sem2: [['Lab. de Sistemas Digitais','IA',6],['Programação por Objectos','I',6],['Cálculo II','M',6],['Circuitos I','ELE',6],['Mecânica e Oscilações','F',6]],
  },
  {
    sem1: [['Métodos Numéricos','M',6],['Competências Transferíveis I','MTD',6],['Arq. de Computadores I','I',6],['Cálculo III','M',6],['Circuitos II','ELE',6]],
    sem2: [['Campo Eletromagnético','F',6],['Dispositivos Eletrónicos','ELE',6],['Arq. de Computadores II','I',6],['Competências Transferíveis II','CENG',6],['Fund. de Sinais e Sistemas','ELEA',6]],
  },
  {
    sem1: [['Redes de Telecomunicações','ELE',6],['Métodos Probabilísticos','ELE',6],['Sistemas e Controlo','ELE',6],['Circuitos Eletrónicos','ELE',6]],
    sem2: [['Sistemas de Comunicação','ELE',6],['Propagação de Ondas EM','ELE',6],['Eletrotecnia Aplicada','ELE',6],['Eletrónica de Sistema','ELE',6]],
    annual: [['Projeto em Eng. Eletrotécnica','ELE',12]],
  },
] as const;

const T = {
  en: {
    sw: 'PT',
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
  pt: {
    sw: 'EN',
    badge: 'LEEC · Universidade de Aveiro',
    eyebrow: 'Engenharia Eletrotécnica e de Computadores',
    heroLines: ['Constrói o que', 'alimenta', 'o mundo.'],
    heroGrad: 1,
    sub: '3 anos · 180 ECTS. De transístores a sistemas distribuídos - a LEEC prepara-te para cada camada da tecnologia moderna.',
    cta1: 'Explorar o Projeto', cta2: 'Candidatar Agora', scroll: 'descer',
    discH: 'O que vais dominar',
    disc: [
      { label: 'Hardware e Eletrónica',   desc: 'Routing de PCBs, FPGAs, a camada física da tecnologia.', col: '#22d3ee' },
      { label: 'Software e Computadores', desc: 'Firmware embebido, apps full-stack, sistemas distribuídos.', col: '#60a5fa' },
      { label: 'Redes e Energia',         desc: 'Protocolos 5G, energia renovável, controlo em tempo real.', col: '#a78bfa' },
    ],
    stats: [['3','anos','laboratórios práticos'],['12','eng','criaram o CareSync'],['100','%','empregabilidade'],['180','ects','créditos totais']],
    currH: 'Plano Curricular', currSub: '6 semestres · 180 ECTS · 3 anos',
    yr: ['Ano 1','Ano 2','Ano 3'],
    s1: '1º Semestre', s2: '2º Semestre', sa: 'Projeto Anual',
    carH: 'Saídas Profissionais', carSub: 'Para onde vão os licenciados da LEEC',
    careers: [
      { icon: Cpu,          label: 'Sistemas Eletrónicos',    desc: 'Microcontroladores, FPGAs e IoT para a indústria.' },
      { icon: Code2,        label: 'Software e Web',          desc: 'Do firmware em tempo real a serviços cloud.' },
      { icon: Radio,        label: 'Telecomunicações 5G',     desc: 'Protocolos e hardware para ligar o mundo.' },
      { icon: Battery,      label: 'Energia Renovável',       desc: 'Redes inteligentes e conversores de energia.' },
      { icon: FlaskConical, label: 'Investigação',            desc: 'Mestrado/Doutoramento nas melhores universidades.' },
      { icon: Briefcase,    label: 'Startups e Consultoria',  desc: 'Funda empresas ou lidera transformação digital.' },
    ],
    projH: 'Dentro do CareSync', projSub: 'Um produto real - feito de raiz por estudantes da LEEC',
    proj: [
      { t: 'Hardware',       d: 'Da breadboard à PCB de produção.' },
      { t: 'Software',       d: 'React · Node.js · C Embebido.'    },
      { t: 'Segurança',      d: 'Zero-trust · Compatível HIPAA.'   },
      { t: 'Linha do Tempo', d: 'Cada sprint e milestone.'         },
      { t: 'Equipa',         d: '12 engenheiros, uma missão.'      },
    ],
    demoLabel: 'Demo ao Vivo', demoH: 'Vê ao vivo.',
    demoSub: 'Lança o dashboard CareSync - uma app real de gestão de medicação construída por estudantes da LEEC.',
    demoBtn: 'Lançar Dashboard',
    finalH: ['O teu circuito', 'começa aqui.'],
    finalGrad: 1,
    finalSub: 'Junta-te a um curso onde te licencias com um portefólio, e não apenas um diploma.',
    meet: 'Conhecer a Equipa', apply: 'Candidatar na UA',
    curriculum: CURRICULUM_PT,
  },
} as const;
type Lang = 'en' | 'pt';

/* ═══════════════════════════════════════════════════════════════════════════
   SMALL ATOMS
═══════════════════════════════════════════════════════════════════════════ */
function OscWave() {
  return (
    <svg viewBox="0 0 500 50" preserveAspectRatio="none" className="w-full h-full">
      <path className="oa" stroke="rgba(74,164,225,.45)" strokeWidth="1.5" fill="none" strokeDasharray="700"
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
   CURRICULUM
═══════════════════════════════════════════════════════════════════════════ */
function Curriculum({ t }: { t: typeof T[Lang] }) {
  const [yr, setYr] = useState(0);
  const data = t.curriculum[yr] as any;

  const areaClass = (a: string) => `chp border a${a.replace(/[^a-zA-Z]/g, '')}`;

  const SemBlock = ({ rows, title }: { rows: readonly (readonly [string, string, number])[]; title: string }) => (
    <div className="rounded-xl overflow-hidden border border-border-subtle bg-bg-card">
      <div className="px-3 py-2 jm text-[9px] uppercase tracking-widest text-brand-primary border-b border-border-subtle bg-brand-primary/5">
        {title}
      </div>
      {rows.map(([name, area, ects], i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-bg-hover transition-colors ${i < rows.length - 1 ? 'border-b border-border-subtle' : ''}`}>
          <span className="flex-1 text-text-main min-w-0 leading-snug">{name}</span>
          <span className={areaClass(area)}>{area}</span>
          <span className="jm text-[10px] text-text-muted w-5 text-right shrink-0">{ects}</span>
        </div>
      ))}
    </div>
  );

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 md:px-10 border-t border-border-subtle">
      <div className="max-w-5xl mx-auto">
        <Reveal className="mb-8">
          <p className="jm text-[10px] uppercase tracking-[.2em] text-brand-primary mb-2">{t.currH}</p>
          <h2 className="sy font-800 text-3xl sm:text-4xl mb-1">{t.currH} <GText>-</GText></h2>
          <p className="jm text-xs text-text-muted">{t.currSub}</p>
        </Reveal>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-bg-card border border-border-subtle rounded-lg w-fit">
          {t.yr.map((y, i) => (
            <button key={i} onClick={() => setYr(i)}
              className={`px-4 py-1.5 rounded-md jm text-xs font-700 transition-all duration-200 ${yr === i ? 'bg-brand-primary text-white shadow' : 'text-text-muted hover:text-text-main'}`}>
              {y}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={yr}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .25 }}>
            <div className="grid sm:grid-cols-2 gap-3">
              <SemBlock rows={data.sem1} title={t.s1} />
              <SemBlock rows={data.sem2} title={t.s2} />
            </div>
            {data.annual && (
              <div className="mt-3">
                <SemBlock rows={data.annual} title={t.sa} />
              </div>
            )}
            <p className="jm text-[10px] text-right mt-2 text-text-muted">
              Total: <span className="text-brand-primary">60 ECTS</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HORIZONTAL SCROLL
   scrollRef = the page's overflow-y container
   outerRef  = the tall outer div (target for useScroll)
═══════════════════════════════════════════════════════════════════════════ */
const PROJ_ROUTES = ['/showcase/hardware', '/showcase/software', '/showcase/security', '/showcase/timeline', '/showcase/team'];
const PROJ_ICONS = [CircuitBoard, Code2, Shield, Activity, Users];
const PROJ_COLS = ['#22d3ee', '#60a5fa', '#f87171', '#c084fc', '#4ade80'];

function HScroll({ t, scrollRef }: { t: typeof T[Lang]; scrollRef: React.RefObject<HTMLDivElement> }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    if (!railRef.current) return;
    const rw = railRef.current.scrollWidth;
    const vw = window.innerWidth;
    
    // Disable horizontal scroll logic on mobile viewports
    if (vw < 640) {
      setTravel(0);
      setReady(false);
      return;
    }
    
    // Multiply by 2.5 to slow down the scroll speed by 2.5x. 
    const SCROLL_MULTIPLIER = 5; 
    const t = Math.max(rw - vw, 0) * SCROLL_MULTIPLIER;
    
    setTravel(t);
    if (t > 0) setReady(true);
  }, []);

  useEffect(() => {
    // Defer measurement until layout is complete
    const id = setTimeout(measure, 100);
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(id); ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  // KEY FIX: pass the page scroll container as `container`
  // so framer-motion tracks scroll position within that div, not window
  const { scrollYProgress } = useScroll({
    container: scrollRef as React.RefObject<HTMLElement>,
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0px', `-${travel / 5}px`]);

  // outerHeight: 100dvh (the sticky viewport) + travel distance
  const outerH = ready ? `calc(max(50vh, 400px) + ${travel}px)` : 'auto';

  return (
    <section className="border-t border-border-subtle">
      {/* Section header - sits in normal document flow, above sticky zone */}
      <div className="px-4 sm:px-6 md:px-10 pt-12 sm:pt-16 pb-6 max-w-5xl mx-auto">
        <Reveal>
          <p className="jm text-[10px] uppercase tracking-[.2em] text-brand-primary mb-1">{t.projSub}</p>
          <h2 className="sy font-800 text-3xl sm:text-4xl">{t.projH}</h2>
        </Reveal>
      </div>

      {/* Tall outer - scroll target */}
      <div ref={outerRef} className="hs-outer relative" style={{ height: outerH }}>
        <div className="hs-inner relative w-full overflow-hidden">

          {/* Edge fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-20 z-10 hidden sm:block"
            style={{ background: 'linear-gradient(90deg, var(--bg-page, #020617), transparent)' }} />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-20 z-10 hidden sm:block"
            style={{ background: 'linear-gradient(270deg, var(--bg-page, #020617), transparent)' }} />

          {/* The sliding rail */}
          <motion.div ref={railRef} className="hs-rail" style={{ x }}>
            {t.proj.map((p, i) => {
              const Icon = PROJ_ICONS[i];
              const col = PROJ_COLS[i];
              return (
                <Link key={p.t} to={PROJ_ROUTES[i]}
                  style={{
                    '--col': col,
                    width: 'min(70vw, 280px)',
                    minWidth: '220px',
                    minHeight: '180px',    // Enough room for the icons and text
                    borderColor: `rgba(255,255,255,.08)`,
                  } as React.CSSProperties}
                  className="lft group flex flex-col shrink-0 rounded-2xl bg-bg-card border p-5
                    hover:border-(--col) transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="chp border" style={{ background: `${col}18`, borderColor: `${col}44`, color: col }}>
                      0{i + 1}
                    </div>
                    <Icon size={16} className="text-text-muted transition-colors group-hover:text-(--col)" />
                  </div>
                  <div className="mt-auto">
                    <h3 className="sy font-700 text-lg text-text-main mb-1 group-hover:text-(--col) transition-colors">{p.t}</h3>
                    <p className="text-xs text-text-muted leading-relaxed mb-4">{p.d}</p>
                    <div className="flex items-center gap-1 jm text-[9px] uppercase tracking-widest text-text-muted group-hover:text-(--col) transition-colors">
                      Explore <ArrowRight size={9} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>

          {/* Progress dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex gap-2 z-20">
            {t.proj.map((_, i) => (
              <div key={i} className="h-0.5 w-6 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full bg-brand-primary rounded-full origin-left"
                  style={{
                    scaleX: useTransform(scrollYProgress,
                      [i / t.proj.length, (i + 1) / t.proj.length], [0, 1])
                  }} />
              </div>
            ))}
          </div>

          {/* Hint */}
          <motion.div
            style={{ opacity: useTransform(scrollYProgress, [0, .08], [1, 0]) }}
            className="absolute bottom-6 right-6 sm:right-10 hidden sm:flex items-center gap-1.5 jm text-[9px] uppercase tracking-widest text-text-muted z-20 pointer-events-none">
            scroll <ArrowRight size={9} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
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

      {/* Lang toggle - fixed overlay */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .9 }}
        onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')}
        className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
          bg-bg-card/85 backdrop-blur-sm border border-border-subtle
          hover:border-brand-primary/40 transition-all jm text-[10px] text-text-muted hover:text-text-main shadow-sm">
        <Globe size={10} />
        <AnimatePresence mode="wait">
          <motion.span key={lang}
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: .1 }}>{t.sw}
          </motion.span>
        </AnimatePresence>
      </motion.button>

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
            CURRICULUM
        ════════════════════════════════════════════════════════════════ */}
        <Curriculum t={t} />

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
            HORIZONTAL SCROLL CARDS
        ════════════════════════════════════════════════════════════════ */}
        <HScroll t={t} scrollRef={scrollRef as React.RefObject<HTMLDivElement>} />

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

        {/* ════════════════════════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative py-24 sm:py-32 px-5 text-center border-t border-border-subtle overflow-hidden bpg">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(74,164,225,.09), transparent)' }} />
          <div className="relative z-10 max-w-xl mx-auto">
            <Reveal>

              {/* Same safe sizing as hero */}
              {t.finalH.map((line, i) => (
                <div key={i} className="overflow-hidden">
                  <h2 className={`sy font-800 leading-[.9] tracking-tight mb-1
                    text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                    ${i === t.finalGrad ? '' : 'text-text-main'}`}
                    style={i === t.finalGrad ? {
                      background: 'linear-gradient(135deg,#4AA4E1 0%,#22d3ee 45%,#4AA4E1 100%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    } : {}}>
                    {line}
                  </h2>
                </div>
              ))}

              <p className="text-text-muted text-sm sm:text-base max-w-md mx-auto mt-5 mb-8 leading-relaxed">{t.finalSub}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/showcase/team"
                  className="shm group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                    bg-text-main text-bg-page font-700 text-sm hover:scale-105 transition-all shadow-2xl w-full sm:w-auto">
                  {t.meet}
                  <Users size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a href="https://www.ua.pt/pt/curso/480" target="_blank" rel="noreferrer"
                  className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                    border border-border-subtle text-text-muted font-600 text-sm
                    hover:text-text-main hover:bg-bg-card hover:border-brand-primary/40 transition-all w-full sm:w-auto">
                  {t.apply}
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </Reveal>
          </div>
          <div className="relative z-10 mt-14 flex items-center justify-center gap-4 opacity-20">
            <div className="h-px w-8 sm:w-12 bg-brand-primary" />
            <span className="jm text-[8px] uppercase tracking-[.28em] text-text-muted">LEEC · DETI · UA · 2026</span>
            <div className="h-px w-8 sm:w-12 bg-brand-primary" />
          </div>
        </section>

      </div>{/* end scroll root */}
    </>
  );
}