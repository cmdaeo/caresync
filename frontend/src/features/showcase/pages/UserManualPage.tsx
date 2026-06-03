// frontend/src/features/showcase/pages/UserManualPage.tsx
import { motion } from 'framer-motion';
import { 
  BookOpen,
  Smartphone, 
  Watch, 
  Server,
  Zap,
  Radio,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Clock
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
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */
const StepCard = ({ number, title, icon: Icon, colorClass, bgClass, children }: any) => (
  <motion.div variants={fadeUp} className="relative p-6 rounded-xl border border-border-subtle bg-bg-card/40 hover:bg-bg-card hover:border-border-focus transition-all duration-300 overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2`} />
    
    <div className="flex items-center gap-4 mb-5 relative z-10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${bgClass} border-border-subtle ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-0.5">Step 0{number}</div>
        <h3 className="text-lg font-bold text-text-main leading-tight">{title}</h3>
      </div>
    </div>
    
    <div className="relative z-10 space-y-3">
      {children}
    </div>
  </motion.div>
);

const InstructionBullet = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
    <p className="text-sm text-text-muted leading-relaxed">{children}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const UserManualPage = () => {
  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">
      
      {/* Background Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-primary/[0.03] rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#c084fc]/[0.03] rounded-full blur-[120px]" />

      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto mb-16 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 mb-6">
          <BookOpen size={32} className="text-brand-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-text-main tracking-tight mb-5 leading-tight">
          System User Manual
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
          Official operational guidelines for the CareBox, CareBand, and CareApp ecosystem. Follow these instructions for proper subsystem initialization and closed-loop adherence verification.
        </p>
      </motion.div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-16">

        {/* ════════ SECTION 1: INITIALIZATION ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <Zap className="text-yellow-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Subsystem Initialization</h2>
              <p className="text-[11px] font-mono text-yellow-500 uppercase tracking-widest mt-1">Booting & Provisioning</p>
            </div>
          </div>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <StepCard number={1} title="Powering the CareBox" icon={Server} colorClass="text-yellow-500" bgClass="bg-yellow-500/10">
              <InstructionBullet>Connect the CareBox to an approved 5V DC power source.</InstructionBullet>
              <InstructionBullet>The I2C LCD panel will immediately light up, perform a self-test of the peripherals, and transition into the primary welcome standby loop.</InstructionBullet>
            </StepCard>

            <StepCard number={2} title="Connecting the CareApp" icon={Smartphone} colorClass="text-blue-500" bgClass="bg-blue-500/10">
              <InstructionBullet>Launch the native CareApp client on the designated smartphone device.</InstructionBullet>
              <InstructionBullet>Ensure that system Bluetooth permissions are enabled.</InstructionBullet>
            </StepCard>

            <StepCard number={3} title="Configuring Medications" icon={Radio} colorClass="text-purple-500" bgClass="bg-purple-500/10">
              <InstructionBullet><strong>Digital Application Sync:</strong> Within the CareApp interface, navigate to the "Medications" control module and commit the verified patient prescription.</InstructionBullet>
              <InstructionBullet><strong>Contactless RFID Provisioning:</strong> Place a pre-registered medical RFID card directly onto the physical CareBox scanner node to automatically populate a structured medication timeline without application intervention.</InstructionBullet>
            </StepCard>

            <StepCard number={4} title="Verifying Synchronization" icon={CheckCircle2} colorClass="text-emerald-500" bgClass="bg-emerald-500/10">
              <InstructionBullet>The CareApp establishes an active GATT bridge with the CareBox, transmitting configuration byte streams.</InstructionBullet>
              <InstructionBullet>The CareBox LCD will update dynamically to confirm that the scheduling sequence has been written to the device memory.</InstructionBullet>
            </StepCard>

          </motion.div>
        </section>

        {/* ════════ SECTION 2: SCHEDULED OPERATIONS ════════ */}
        <section>
          <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-4">
            <BellRing className="text-red-500" size={28} />
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-main">Scheduled Intake Operations</h2>
              <p className="text-[11px] font-mono text-red-500 uppercase tracking-widest mt-1">Alarms & Closed-Loop Verification</p>
            </div>
          </div>
          
          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <StepCard number={5} title="Alarm Activation" icon={BellRing} colorClass="text-red-500" bgClass="bg-red-500/10">
              <InstructionBullet>When an internal RTC countdown expires, the CareBox state machine transitions immediately to EST_ALERTA.</InstructionBullet>
              <InstructionBullet>The system actuates the continuous buzzer pattern, pulses the status LED to bright red, and commands the stepper motor to index the structural carousel to the corresponding medication chamber.</InstructionBullet>
            </StepCard>

            <StepCard number={6} title="Wearable Notification" icon={Watch} colorClass="text-cyan-500" bgClass="bg-cyan-500/10">
              <InstructionBullet>Simultaneously, the CareBox transmits a BLE packet to the CareBand, firing its internal haptic vibration motor and flashing its indicator sequence to notify the user.</InstructionBullet>
            </StepCard>

            <StepCard number={7} title="Retrieving Medication" icon={Server} colorClass="text-brand-primary" bgClass="bg-brand-primary/10">
              <InstructionBullet>The patient approaches the device and pulls open the sloped dispensing drawer.</InstructionBullet>
              <InstructionBullet>The integrated magnetic reed switch registers the break in continuity, moving the firmware to the confirmation loop.</InstructionBullet>
              <InstructionBullet>Once the medication is safely retrieved, the user must push the drawer firmly into its sealed seat.</InstructionBullet>
              <InstructionBullet>The reed switch registers a closed connection, completing the interaction verification cycle.</InstructionBullet>
            </StepCard>

            <StepCard number={8} title="Adherence Logging" icon={Clock} colorClass="text-amber-500" bgClass="bg-amber-500/10">
              <InstructionBullet>Drawer cycle completed within 60 seconds of trigger → Registered as On-Time Intake.</InstructionBullet>
              <InstructionBullet>Drawer cycle completed between 1 and 5 minutes of trigger → Registered as Delayed Intake.</InstructionBullet>
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertTriangle size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">Missed Dose Protocol</span>
                </div>
                <p className="text-xs text-red-400">No drawer cycle detected within a 5-minute window → Watchdog triggers, registers a Missed/Ignored Intake, silences the physical alarms, and sets the hardware back to standby.</p>
              </div>
            </StepCard>

          </motion.div>
        </section>

      </div>
    </div>
  );
};