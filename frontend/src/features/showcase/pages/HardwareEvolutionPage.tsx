// frontend/src/features/showcase/pages/HardwareEvolutionPage.tsx
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Battery, 
  Layers, 
  Watch, 
  Server,
  RotateCw,
  Radio,
  Volume2,
  SmartphoneNfc,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/* ════════════════════════════════════════════════════════════════
   THEMED COMPONENTS
════════════════════════════════════════════════════════════════ */
type Theme = 'purple' | 'cyan';

const TechBadge = ({ children, theme }: { children: React.ReactNode, theme: Theme }) => {
  const isPurple = theme === 'purple';
  return (
    <span className={`px-2 py-1 rounded border text-[9px] font-mono uppercase tracking-widest whitespace-nowrap
      ${isPurple 
        ? 'bg-[#c084fc]/10 border-[#c084fc]/20 text-[#c084fc]' 
        : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'}`}
    >
      {children}
    </span>
  );
};

const SpecCard = ({ icon: Icon, title, specs, desc, theme }: { icon: any, title: string, specs: string[], desc: string, theme: Theme }) => {
  const isPurple = theme === 'purple';
  
  return (
    <motion.div variants={fadeUp} 
      className={`p-5 rounded-xl border bg-bg-card/40 transition-all duration-300 group
        ${isPurple 
          ? 'border-border-subtle hover:border-[#c084fc]/40 hover:bg-[#c084fc]/[0.02]' 
          : 'border-border-subtle hover:border-brand-primary/40 hover:bg-brand-primary/[0.02]'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110
          ${isPurple ? 'bg-[#c084fc]/10 text-[#c084fc]' : 'bg-brand-primary/10 text-brand-primary'}`}
        >
          <Icon size={24} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {specs.map(spec => <TechBadge key={spec} theme={theme}>{spec}</TechBadge>)}
        </div>
      </div>
      <h4 className="text-base font-bold text-text-main mb-2">{title}</h4>
      <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
    </motion.div>
  );
};

const TimelineNode = ({ step, title, desc, theme, isLast = false }: { step: string, title: string, desc: string, theme: Theme, isLast?: boolean }) => {
  const isPurple = theme === 'purple';
  
  return (
    <div className="relative flex gap-5 pb-8">
      {!isLast && <div className="absolute top-8 left-[19px] bottom-0 w-px bg-border-subtle" />}
      
      <div className={`relative z-10 w-10 h-10 shrink-0 rounded-full bg-bg-page border-2 flex items-center justify-center text-xs font-mono font-bold
        ${isPurple 
          ? 'border-[#c084fc]/40 text-[#c084fc] shadow-[0_0_15px_rgba(192,132,252,0.15)]' 
          : 'border-brand-primary/40 text-brand-primary shadow-[0_0_15px_rgba(34,211,238,0.15)]'}`}
      >
        {step}
      </div>
      
      <div className="pt-1.5">
        <h4 className="text-sm font-bold text-text-main mb-1.5 uppercase tracking-wide">{title}</h4>
        <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const HardwareEvolutionPage = () => {
  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#c084fc]/[0.03] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-primary/[0.03] rounded-full blur-[120px]" />

      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto mb-20 text-center"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight mb-5 leading-tight">
          Hardware Architecture
        </h1>
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-32">
        
        {/* ════════ CAREBOX SECTION (PURPLE) ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-[#c084fc]/10 border border-[#c084fc]/20">
              <Server className="text-[#c084fc]" size={28} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">CareBox</h2>
              <p className="text-[11px] font-mono text-[#c084fc] uppercase tracking-widest mt-1">Central Dispensing Hub</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpecCard 
                theme="purple"
                icon={Cpu} 
                title="Processing Core" 
                specs={['RP2040', '133 MHz Cortex-M0+']}
                desc="Raspberry Pi Pico WH driving centralized logic via an onboard CYW43439 Wi-Fi/BLE 5.2 module." 
              />
              <SpecCard 
                theme="purple"
                icon={RotateCw} 
                title="Actuation Engine" 
                specs={['28BYJ-48', 'ULN2003 Driver']}
                desc="Precision 5V unipolar stepper motor driving a custom 10-compartment medication carousel." 
              />
              <SpecCard 
                theme="purple"
                icon={Radio} 
                title="Data Ingestion" 
                specs={['13.56MHz RC522', 'I2C 1602A LCD']}
                desc="Instant schedule ingestion via SPI RFID, paired with an offline rotary encoder UI." 
              />
              <SpecCard 
                theme="purple"
                icon={Activity} 
                title="Closed-Loop Sensors" 
                specs={['Reed Switch', 'RGB / Acoustic']}
                desc="Magnetic reed switches detect drawer states for precise telemetry, backed by multi-sensory alarms." 
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-5 bg-bg-card/20 border border-border-subtle p-6 sm:p-8 rounded-2xl">
              <h3 className="text-xs font-mono text-text-main uppercase tracking-widest mb-8 border-b border-border-subtle pb-3">Engineering Evolution</h3>
              <TimelineNode theme="purple" step="V1" title="Ergonomics & CAD" desc="SolidWorks modeled. 3D-printed PETG chassis features a sloped dispensing drawer to assist users with osteoarthritis." />
              <TimelineNode theme="purple" step="V2" title="PCB Routing" desc="Autodesk EAGLE design. Integrated +5V/+3V3 power rails, widened motor traces, and a continuous ground plane to slash EMI." />
              <TimelineNode theme="purple" step="V3" title="MVP Assembly" desc="Navigated strict supply chain lead times by deploying a secured breadboard assembly, retaining production-ready Gerber files." isLast />
            </motion.div>
          </div>
        </section>

        {/* ════════ CAREBAND SECTION (CYAN) ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
              <Watch className="text-brand-primary" size={28} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">CareBand</h2>
              <p className="text-[11px] font-mono text-brand-primary uppercase tracking-widest mt-1">Wearable Notification Node</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SpecCard 
                theme="cyan"
                icon={Layers} 
                title="Wearable MCU" 
                specs={['BLE Central', 'Ultra-Low Power']}
                desc="Miniaturized silicon architecture optimized for lightweight execution and persistent BLE synchronization." 
              />
              <SpecCard 
                theme="cyan"
                icon={Volume2} 
                title="Haptic Actuator" 
                specs={['ERM Motor', 'High-G Alerts']}
                desc="Low-mass Eccentric Rotating Mass (ERM) motor delivers immediate, accessible physical notifications." 
              />
              <SpecCard 
                theme="cyan"
                icon={SmartphoneNfc} 
                title="NFC & Optics" 
                specs={['SMD LEDs', 'Flex Antenna']}
                desc="Integrates Surface-Mount Device LEDs for visual queues alongside a flexible internal NFC antenna patch." 
              />
              <SpecCard 
                theme="cyan"
                icon={Zap} 
                title="Power Subsystem" 
                specs={['LiPo Cell', '15µA Deep Sleep']}
                desc="Custom power management circuitry paired with a compact LiPo battery to maximize standby uptime." 
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:col-span-5 bg-bg-card/20 border border-border-subtle p-6 sm:p-8 rounded-2xl">
              <h3 className="text-xs font-mono text-text-main uppercase tracking-widest mb-8 border-b border-border-subtle pb-3">Engineering Evolution</h3>
              <TimelineNode theme="cyan" step="V1" title="Topology Inversion" desc="Initial BLE Server role caused instability. Inverted to a BLE Central Client, drastically reducing energy drain and improving reconnections." />
              <TimelineNode theme="cyan" step="V2" title="Flexible Casing" desc="Chassis iteration utilizing flexible TPU (Thermoplastic Polyurethane) and silicone to create an ergonomic, continuous-wear wristband." />
              <TimelineNode theme="cyan" step="V3" title="Flex PCB Integration" desc="Transitioned to a miniaturized flexible PCB substrate. True commercial-grade miniaturization remains the primary target for V4." isLast />
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
};