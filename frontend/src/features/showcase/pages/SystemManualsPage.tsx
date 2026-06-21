// frontend/src/features/showcase/pages/SystemManualsPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Terminal,
  Code2,
  Database,
  Bluetooth,
  ServerCog,
  ShieldCheck,
  FolderTree,
  Cpu,
  Users,
  Wrench,
  Printer,
  Box,
  Download,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
════════════════════════════════════════════════════════════════ */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/* ════════════════════════════════════════════════════════════════
   ACTUAL FILES FOR HARDWARE SECTION (Mapped to public/ folder)
════════════════════════════════════════════════════════════════ */
const hardwareFiles = [
  {
    id: 1,
    name: "CareBox 3D Model",
    desc: "Enclosure Model (GLB)",
    path: "/carebox_3d.glb",
    icon: Box,
  },
  {
    id: 2,
    name: "CareBand 3D Model",
    desc: "Wearable Model (GLB)",
    path: "/careband_3d.glb",
    icon: Box,
  },
  {
    id: 3,
    name: "CareBox PCB",
    desc: "Mainboard (GLB)",
    path: "/carebox.glb",
    icon: Cpu,
  },
  {
    id: 4,
    name: "CareBand PCB",
    desc: "Wearable PCB (GLB)",
    path: "/careband.glb",
    icon: Cpu,
  },
  {
    id: 5,
    name: "CareBox Firmware",
    desc: "Arduino Source (.ino) — RP2040 / Pico W",
    path: "/carebox_firmware.ino",
    icon: Terminal,
  },
];

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */
const InfoCard = ({
  prefix,
  number,
  title,
  icon: Icon,
  colorClass,
  bgClass,
  children,
}: any) => (
  <motion.div
    variants={fadeUp}
    className="relative p-6 rounded-2xl border border-border-subtle bg-bg-card shadow-sm ring-1 ring-black/[0.03] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
  >
    <div
      className={`absolute top-0 right-0 w-32 h-32 ${bgClass} blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none rounded-full transform translate-x-1/2 -translate-y-1/2`}
    />

    <div className="flex items-center gap-4 mb-5 relative z-10">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center border border-border-subtle group-hover:${bgClass} bg-bg-page transition-colors duration-300 ${colorClass}`}
      >
        <Icon size={24} />
      </div>
      <div>
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted mb-0.5">
          {prefix} 0{number}
        </div>
        <h3 className="text-lg font-bold text-text-main leading-tight">
          {title}
        </h3>
      </div>
    </div>

    <div className="relative z-10 space-y-3">{children}</div>
  </motion.div>
);

const DetailBullet = ({
  children,
  colorClass = "bg-brand-primary",
}: {
  children: React.ReactNode;
  colorClass?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colorClass} shrink-0`} />
    <p className="text-sm text-text-muted leading-relaxed">{children}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════ */
export const SystemManualsPage = () => {
  const [activeTab, setActiveTab] = useState<"user" | "developer">("user");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // ════════ HIGH-PERFORMANCE CANVAS ENGINE ════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const spacing = 35; // Density of the grid

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = window.innerWidth;
      const displayHeight = window.innerHeight;

      // Handle Resize dynamically without flickering
      if (
        canvas.width !== displayWidth * dpr ||
        canvas.height !== displayHeight * dpr
      ) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        ctx.scale(dpr, dpr);
      }

      // Default mouse to center if it hasn't moved
      if (mouseRef.current.x === -1000) {
        mouseRef.current.x = displayWidth / 2;
        mouseRef.current.y = displayHeight / 2;
      }

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Check Theme explicitly to adjust Matrix transparency
      const isDark = document.documentElement.classList.contains("dark");
      const isUser = activeTab === "user";

      const r = isUser ? 139 : 16;
      const g = isUser ? 92 : 185;
      const b = isUser ? 246 : 129;

      // Draw the static matrix grid
      for (let x = spacing / 2; x < displayWidth; x += spacing) {
        for (let y = spacing / 2; y < displayHeight; y += spacing) {
          const dx = mouseRef.current.x - x;
          const dy = mouseRef.current.y - y;
          const angle = Math.atan2(dy, dx); // Angle pointing towards the mouse
          const dist = Math.hypot(dx, dy);

          // Magnetic Opacity (brighter near the mouse, faint further away)
          const maxDist = 450;
          const proximityGlow = Math.max(0, 1 - dist / maxDist) * 0.15;

          // Matrix opacity: Light Mode = 30%, Dark Mode = 15% (Decreased by 15%)
          const baseOpacity = isDark ? 0.02 : 0.1;
          const alpha = baseOpacity + proximityGlow;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

          ctx.save();
          // Move to the fixed position
          ctx.translate(x, y);
          // Rotate individually in place
          ctx.rotate(angle);

          // Draw the Rhombus / Kite polygon
          ctx.beginPath();
          ctx.moveTo(8, 0); // Front tip
          ctx.lineTo(0, 3.5); // Bottom corner
          ctx.lineTo(-5, 0); // Back tip
          ctx.lineTo(0, -3.5); // Top corner
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTab]);

  // Track Mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative h-full w-full overflow-y-auto tsc bg-bg-page px-4 py-12 sm:px-8 lg:px-16 overflow-x-hidden">
      {/* ════════ Z-0: MAGNETIC POLYGON MATRIX (CANVAS) ════════ */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 0%, transparent 100%)",
        }}
      />

      {/* ════════ Z-2: Background Subtle Gradient ════════ */}
      <div
        className={`pointer-events-none fixed inset-0 z-[2] bg-gradient-to-b from-transparent to-black/[0.03] transition-colors duration-1000 ${activeTab === "user" ? "dark:to-brand-primary/[0.02]" : "dark:to-emerald-500/[0.02]"}`}
      />

      {/* ════════ Z-10: PAGE CONTENT ════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-4xl mx-auto mb-10 text-center"
      >
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-6 bg-bg-card shadow-sm ring-1 ring-black/[0.03] transition-colors duration-500 ${activeTab === "user" ? "border-brand-primary/30 text-brand-primary" : "border-emerald-500/30 text-emerald-500"}`}
        >
          {activeTab === "user" ? (
            <BookOpen size={28} />
          ) : (
            <Terminal size={28} />
          )}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-text-main tracking-tight mb-4">
          System Documentation
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed h-12">
          {activeTab === "user"
            ? "Official operational guidelines for the CareBox, CareBand, and CareApp ecosystem. Instructions for proper subsystem initialization."
            : "Technical specifications, communication protocols, and architectural blueprints required to maintain, replicate, or expand the CareSync ecosystem."}
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <div className="relative z-10 flex justify-center mb-16">
        <div className="bg-bg-card border border-border-subtle p-1.5 rounded-2xl inline-flex gap-2 shadow-sm ring-1 ring-black/[0.03]">
          <button
            onClick={() => setActiveTab("user")}
            className={`px-6 py-2.5 rounded-xl flex items-center gap-2.5 font-medium text-sm transition-all duration-300 ${activeTab === "user" ? "bg-brand-primary text-white shadow-md" : "text-text-muted hover:text-text-main hover:bg-bg-page"}`}
          >
            <Users size={16} />
            User Manual
          </button>
          <button
            onClick={() => setActiveTab("developer")}
            className={`px-6 py-2.5 rounded-xl flex items-center gap-2.5 font-medium text-sm transition-all duration-300 ${activeTab === "developer" ? "bg-emerald-600 text-white shadow-md" : "text-text-muted hover:text-text-main hover:bg-bg-page"}`}
          >
            <Wrench size={16} />
            Developer Manual
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ════════ TAB: USER MANUAL ════════ */}
          {activeTab === "user" && (
            <motion.div
              key="user-manual"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-16"
            >
              <section>
                <div className="flex items-center gap-4 mb-6 pb-2 border-b border-border-subtle">
                  <Zap className="text-brand-primary" size={24} />
                  <h2 className="text-2xl font-bold text-text-main">
                    Subsystem Initialization
                  </h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <InfoCard
                    prefix="Step"
                    number={1}
                    title="Powering the CareBox"
                    icon={Server}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      Connect the CareBox to an approved 5V DC power source.
                    </DetailBullet>
                    <DetailBullet>
                      The I2C LCD panel will immediately light up, perform a
                      self-test of the peripherals, and transition into the
                      primary welcome standby loop.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={2}
                    title="Connecting the CareApp"
                    icon={Smartphone}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      Launch the native CareApp client on the designated
                      smartphone device.
                    </DetailBullet>
                    <DetailBullet>
                      Ensure that system Bluetooth permissions are enabled.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={3}
                    title="Configuring Medications"
                    icon={Radio}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      <strong>Digital Application Sync:</strong> Within the
                      CareApp interface, navigate to the "Medications" control
                      module and commit the verified patient prescription.
                    </DetailBullet>
                    <DetailBullet>
                      <strong>Contactless RFID Provisioning:</strong> Place a
                      pre-registered medical RFID card directly onto the
                      physical CareBox scanner node.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={4}
                    title="Verifying Synchronization"
                    icon={CheckCircle2}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      The CareApp establishes an active GATT bridge with the
                      CareBox, transmitting configuration byte streams.
                    </DetailBullet>
                    <DetailBullet>
                      The CareBox LCD will update dynamically to confirm that
                      the scheduling sequence has been written to the device
                      memory.
                    </DetailBullet>
                  </InfoCard>
                </motion.div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-6 pb-2 border-b border-border-subtle">
                  <BellRing className="text-brand-primary" size={24} />
                  <h2 className="text-2xl font-bold text-text-main">
                    Scheduled Intake Operations
                  </h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <InfoCard
                    prefix="Step"
                    number={5}
                    title="Alarm Activation"
                    icon={BellRing}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      When an internal RTC countdown expires, the CareBox state
                      machine transitions immediately to EST_ALERTA.
                    </DetailBullet>
                    <DetailBullet>
                      The system actuates the continuous buzzer pattern, pulses
                      the status LED to bright red, and commands the stepper
                      motor.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={6}
                    title="Wearable Notification"
                    icon={Watch}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      Simultaneously, the CareBox transmits a BLE packet to the
                      CareBand, firing its internal haptic vibration motor and
                      flashing its indicator sequence to notify the user.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={7}
                    title="Retrieving Medication"
                    icon={Server}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      The patient approaches the device and pulls open the
                      sloped dispensing drawer.
                    </DetailBullet>
                    <DetailBullet>
                      The integrated magnetic reed switch registers the break in
                      continuity, moving the firmware to the confirmation loop.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Step"
                    number={8}
                    title="Adherence Logging"
                    icon={Clock}
                    colorClass="text-brand-primary"
                    bgClass="bg-brand-primary/10"
                  >
                    <DetailBullet>
                      Drawer cycle completed within 60 seconds → Registered as
                      On-Time Intake.
                    </DetailBullet>
                    <DetailBullet>
                      Drawer cycle completed between 1 and 5 minutes →
                      Registered as Delayed Intake.
                    </DetailBullet>
                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <div className="flex items-center gap-2 text-text-main mb-1">
                        <AlertTriangle size={14} className="text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Missed Dose Protocol
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">
                        No drawer cycle detected within a 5-minute window →
                        Watchdog triggers, registers a Missed/Ignored Intake,
                        silences alarms.
                      </p>
                    </div>
                  </InfoCard>
                </motion.div>
              </section>
            </motion.div>
          )}

          {/* ════════ TAB: DEVELOPER MANUAL ════════ */}
          {activeTab === "developer" && (
            <motion.div
              key="dev-manual"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-16"
            >
              <section>
                <div className="flex items-center gap-4 mb-6 pb-2 border-b border-border-subtle">
                  <FolderTree className="text-emerald-600" size={24} />
                  <h2 className="text-2xl font-bold text-text-main">
                    System Architecture & Setup
                  </h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <InfoCard
                    prefix="Section"
                    number={1}
                    title="Frontend Stack"
                    icon={Code2}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Framework:</strong> React 18 with TypeScript and
                      Vite for optimized builds.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Styling & UI:</strong> Tailwind CSS and Framer
                      Motion for responsive animations.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Mobile Bridge:</strong> Capacitor handles
                      iOS/Android native compilation and Bluetooth hardware API
                      access.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={2}
                    title="Backend Infrastructure"
                    icon={Database}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Runtime:</strong> Node.js with Express.js
                      architecture.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Database:</strong> PostgreSQL hosted on Supabase
                      (EU West), utilizing a dual-Sequelize schema to segregate
                      PII and medical data.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Security:</strong> Field-level AES encryption, JWT
                      authentication, and Double-Submit CSRF protection.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={3}
                    title="Local Setup (Backend)"
                    icon={Terminal}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      Navigate to <code>cd backend</code> and run{" "}
                      <code>npm install</code>.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      Copy <code>.env.example</code> to <code>.env</code> and
                      populate the <code>DATABASE_URL</code> and cryptographic
                      secrets.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      Run <code>npm run dev</code> to start the server on port
                      5000. Schema syncs automatically on the first request.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={4}
                    title="Local Setup (Frontend)"
                    icon={Smartphone}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      Navigate to <code>cd frontend</code> and run{" "}
                      <code>npm install</code>.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      Start the Vite development server using{" "}
                      <code>npm run dev</code>.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      For mobile compilation, execute{" "}
                      <code>npx cap sync android</code> followed by{" "}
                      <code>npx cap open android</code>.
                    </DetailBullet>
                  </InfoCard>
                </motion.div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-6 pb-2 border-b border-border-subtle">
                  <Cpu className="text-emerald-600" size={24} />
                  <h2 className="text-2xl font-bold text-text-main">
                    Protocols & Integration
                  </h2>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <InfoCard
                    prefix="Section"
                    number={5}
                    title="Core REST API"
                    icon={ServerCog}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>/api/auth/*:</strong> Handles JWT issuance, TOTP
                      verification, and session management.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>/api/prescriptions/*:</strong> Ingests PDF
                      prescriptions and extracts posology via OCR/LLM
                      integration.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>/api/medications/*:</strong> Handles CRUD
                      operations for schedules, scoped securely to the
                      authenticated user.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={6}
                    title="BLE GATT Architecture"
                    icon={Bluetooth}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Topology:</strong> The CareBox acts as the BLE
                      Peripheral Server. The App and CareBand act as Central
                      Clients.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Events (...7892):</strong> CareBox pushes
                      real-time notifications to the App (e.g., intakes, delays,
                      RFID reads).
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>AppConfig (...7893):</strong> App writes daily
                      schedules and interval configurations to the CareBox
                      memory.
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={7}
                    title="Payload Formatting"
                    icon={Code2}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      To respect the strict 20-byte BLE payload limit, data is
                      transmitted as lightweight, pipe-delimited ASCII strings.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Configuration:</strong>{" "}
                      <code>MED|Paracetamol|240|7</code>
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      <strong>Sync:</strong> <code>SYNC|0800|1300|2000</code>
                    </DetailBullet>
                  </InfoCard>

                  <InfoCard
                    prefix="Section"
                    number={8}
                    title="Security & Compliance"
                    icon={ShieldCheck}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-500/10"
                  >
                    <DetailBullet colorClass="bg-emerald-500">
                      API hardened according to OWASP ASVS v5.0.0 Level 3
                      specifications.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      Features 4-tier rate limiting to prevent brute-force
                      attacks.
                    </DetailBullet>
                    <DetailBullet colorClass="bg-emerald-500">
                      Automated recursive log scrubbers redact PHI/PII before
                      writing to the transport layer.
                    </DetailBullet>
                  </InfoCard>
                </motion.div>
              </section>

              {/* ════════ SECTION 3: DIRECT HARDWARE DOWNLOADS ════════ */}
              <section className="mb-24">
                <div className="flex items-center gap-4 mb-6 pb-2 border-b border-border-subtle">
                  <Printer className="text-emerald-600" size={24} />
                  <h2 className="text-2xl font-bold text-text-main">
                    Hardware and Firmware Files
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hardwareFiles.map((file) => {
                    const Icon = file.icon;

                    return (
                      <a
                        key={file.id}
                        href={file.path}
                        download
                        className="p-5 rounded-2xl border border-border-subtle bg-bg-card flex items-center justify-between cursor-pointer hover:border-emerald-500/40 hover:shadow-md hover:-translate-y-1 ring-1 ring-black/[0.03] transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg bg-bg-page border border-border-subtle group-hover:border-emerald-500/30 group-hover:text-emerald-600 transition-colors text-text-muted">
                            <Icon size={24} />
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-text-main leading-tight group-hover:text-emerald-600 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-xs text-text-muted mt-1">
                              {file.desc}
                            </p>
                          </div>
                        </div>

                        <div className="p-2 rounded-full text-text-muted group-hover:text-emerald-600 group-hover:bg-emerald-500/10 transition-colors">
                          <Download size={20} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
